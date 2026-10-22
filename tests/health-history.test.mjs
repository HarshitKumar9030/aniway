import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeHealth } from '../lib/health-history.ts';
const now = Date.parse('2026-10-22T12:00:00Z');
const sample = (at, state = 'operational', id = 'anilist') => ({ checkedAt: Date.parse(at), checks: [{ id, name: id, state, latencyMs: 100, detail: 'test' }] });
test('health history treats gaps as unknown and counts degraded and failed checks separately', () => {
 const history = summarizeHealth([sample('2026-10-20T10:00:00Z'), sample('2026-10-20T11:00:00Z', 'degraded'), sample('2026-10-22T10:00:00Z', 'outage')], now);
 assert.equal(history.days.length, 30);
 assert.deepEqual(history.days.find(day => day.day === '2026-10-21').services, []);
 assert.deepEqual(history.availability, [{ id: 'anilist', total: 3, successful: 1 }]);
 assert.deepEqual(history.days.find(day => day.day === '2026-10-20').services, [{ id: 'anilist', total: 2, successful: 1, degraded: 1, outage: 0 }]);
});
test('health summary excludes future and old checks, preserves separate services, and bounds recent payloads', () => {
 const samples = Array.from({ length: 25 }, (_, i) => sample(`2026-10-22T10:${String(i).padStart(2, '0')}:00Z`));
 const result = summarizeHealth([...samples, sample('2026-09-01T00:00:00Z', 'outage'), sample('2026-10-23T00:00:00Z', 'outage'), sample('2026-10-22T11:00:00Z', 'degraded', 'database')], now);
 assert.equal(result.recent.length, 20);
 assert.equal(result.recent[0].checks[0].id, 'database');
 assert.deepEqual(result.availability, [{ id: 'anilist', total: 25, successful: 25 }, { id: 'database', total: 1, successful: 0 }]);
 assert.equal(result.days[0].day, '2026-09-23');
 assert.equal(result.days.at(-1).day, '2026-10-22');
});
