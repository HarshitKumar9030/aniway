import { getStatistics, publicPaths, recordView } from '../../../lib/observability';
import { sameOrigin } from '../../../lib/request-security';

export async function GET() {
  try {
    return Response.json(await getStatistics(), { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch {
    return Response.json({ error: 'Statistics are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 256) return new Response(null, { status: 413 });
  let path: string;
  try {
    const text = await request.text();
    if (text.length > 256) return new Response(null, { status: 413 });
    const body = JSON.parse(text);
    if (!body || typeof body.path !== 'string' || !publicPaths.includes(body.path)) return new Response(null, { status: 400 });
    path = body.path;
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    await recordView(path);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
