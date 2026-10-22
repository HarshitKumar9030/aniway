import { sql } from 'drizzle-orm';
import { getDb } from '../db';
import { summarizeHealth, type ServiceCheck, type HealthSample } from './health-history';

export const publicPaths = ['/', '/statistics', '/status'] as const;
const DAY = 86_400_000;
const CHECK_INTERVAL = 300_000;

let ready: Promise<void> | undefined;
let pendingCheck: Promise<HealthSample> | undefined;
let fallbackSample: HealthSample | undefined;

// Additive and idempotent for both the Turso production and local D1 databases.
export function ensureObservability() {
  if (!ready) ready = (async () => {
    const db = getDb();
    await db.run(sql`CREATE TABLE IF NOT EXISTS site_daily_views (day TEXT NOT NULL, path TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day, path))`);
    await db.run(sql`CREATE TABLE IF NOT EXISTS site_health_checks (bucket INTEGER PRIMARY KEY, checked_at INTEGER NOT NULL, result TEXT NOT NULL)`);
  })().catch(error => { ready = undefined; throw error; });
  return ready;
}

export async function recordView(path: string) {
  await ensureObservability();
  const day = new Date().toISOString().slice(0, 10);
  await getDb().run(sql`INSERT INTO site_daily_views(day,path,views) VALUES(${day},${path},1) ON CONFLICT(day,path) DO UPDATE SET views=views+1`);
}

export async function getStatistics() {
  await ensureObservability();
  const db = getDb();
  const since = new Date(Date.now() - 29 * DAY).toISOString().slice(0, 10);
  const [views, totals, first] = await Promise.all([
    db.all<{ day: string; path: string; views: number }>(sql`SELECT day,path,views FROM site_daily_views WHERE day>=${since} ORDER BY day,path`),
    db.get<{ accounts: number; follows: number; episodes: number }>(sql`SELECT (SELECT COUNT(*) FROM accounts) AS accounts, (SELECT COUNT(*) FROM follows) AS follows, (SELECT COALESCE(SUM(watched),0) FROM follows) AS episodes`),
    db.get<{ day: string | null }>(sql`SELECT MIN(day) AS day FROM site_daily_views`),
  ]);
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(Date.now() - (29 - i) * DAY).toISOString().slice(0, 10);
    return { day, views: !first?.day || day < first.day ? null : views.filter(row => row.day === day).reduce((sum, row) => sum + Number(row.views), 0) };
  });
  return { updatedAt: Date.now(), trackingSince: first?.day ?? null, days, pageViews: days.reduce((sum, day) => sum + (day.views ?? 0), 0), pages: publicPaths.map(path => ({ path, views: views.filter(row => row.path === path).reduce((sum, row) => sum + Number(row.views), 0) })), accounts: Number(totals?.accounts ?? 0), follows: Number(totals?.follows ?? 0), episodes: Number(totals?.episodes ?? 0) };
}

async function probe(id: string, name: string, work: () => Promise<{ state: ServiceCheck['state']; detail: string }>): Promise<ServiceCheck> {
  const start = performance.now();
  try { return { id, name, ...await work(), latencyMs: Math.round(performance.now() - start) }; }
  catch { return { id, name, state: 'outage', latencyMs: Math.round(performance.now() - start), detail: 'The check failed or timed out. No credentials or error details are published.' }; }
}

async function runChecks(): Promise<HealthSample> {
  const checks = await Promise.all([
    probe('database', 'Account & watchlist database', async () => {
      await getDb().get(sql`SELECT 1 AS healthy`);
      return { state: 'operational', detail: 'Database query completed successfully.' };
    }),
    probe('anilist', 'AniList · schedules & discovery', async () => {
      const response = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: '{catalog:Page(perPage:1){media(type:ANIME){id}} schedule:Page(perPage:1){airingSchedules{id}}}' }), signal: AbortSignal.timeout(8000), cache: 'no-store' });
      if (response.status === 429) return { state: 'degraded', detail: 'AniList is rate limiting requests. Schedules and discovery may load slowly.' };
      if (!response.ok) throw new Error('Provider failure');
      const body = await response.json() as { data?: { catalog?: { media?: unknown[] }; schedule?: { airingSchedules?: unknown[] } }; errors?: unknown[] };
      if (body.errors?.length || !Array.isArray(body.data?.catalog?.media) || !Array.isArray(body.data?.schedule?.airingSchedules)) throw new Error('Invalid provider response');
      return { state: 'operational', detail: 'Catalog and broadcast queries returned valid data.' };
    }),
    probe('crunchyroll', 'Crunchyroll API reachability', async () => {
      const response = await fetch('https://beta-api.crunchyroll.com/auth/v1/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=health_check', redirect: 'manual', signal: AbortSignal.timeout(8000), cache: 'no-store' });
      if (response.status === 403 || response.status === 429) return { state: 'degraded', detail: 'Crunchyroll is blocking or limiting requests from this server.' };
      if (response.status >= 500 || response.status < 200 || response.status >= 300 && ![400, 401, 405].includes(response.status)) throw new Error('Provider unavailable');
      const body = await response.json() as { error?: unknown };
      if (typeof body.error !== 'string') return { state: 'degraded', detail: 'Crunchyroll responded, but its authentication response was unexpected.' };
      return { state: 'operational', detail: 'Authentication API is reachable. Individual sign-ins and account sync are not tested.' };
    }),
  ]);
  return { checkedAt: Date.now(), checks };
}

export async function getStatus() {
  let stored = true;
  let history: HealthSample[] = [];
  try {
    await ensureObservability();
    const rows = await getDb().all<{ result: string }>(sql`SELECT result FROM site_health_checks WHERE checked_at>=${Date.now() - 30 * DAY} ORDER BY checked_at`);
    history = rows.map(row => JSON.parse(row.result) as HealthSample);
  } catch { stored = false; }
  let latest = history.at(-1);
  if (fallbackSample && (!latest || fallbackSample.checkedAt > latest.checkedAt)) latest = fallbackSample;
  if (!latest || Date.now() - latest.checkedAt >= CHECK_INTERVAL) {
    if (!pendingCheck) pendingCheck = runChecks().finally(() => { pendingCheck = undefined; });
    latest = await pendingCheck;
    fallbackSample = latest;
    if (stored) {
      try {
        await getDb().run(sql`INSERT OR IGNORE INTO site_health_checks(bucket,checked_at,result) VALUES(${Math.floor(latest.checkedAt / CHECK_INTERVAL)},${latest.checkedAt},${JSON.stringify(latest)})`);
        await getDb().run(sql`DELETE FROM site_health_checks WHERE checked_at<${Date.now() - 30 * DAY}`);
      } catch { stored = false; }
    }
    history.push(latest);
  }
  return { ...latest, state: latest.checks.some(check => check.state === 'outage') ? 'outage' : latest.checks.some(check => check.state === 'degraded') ? 'degraded' : 'operational', ...summarizeHealth(history), historyAvailable: stored, intervalMinutes: 5 };
}
