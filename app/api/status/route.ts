import { getStatus } from '../../../lib/observability';
export async function GET() {
  try { return Response.json(await getStatus(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: 'Health monitoring is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
