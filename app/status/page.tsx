import type { Metadata } from 'next';
import { PublicShell } from '../../components/public/public-shell';
import { StatusDashboard } from '../../components/public/dashboards';
export const metadata: Metadata = { title: 'Service Status | Aniway', description: 'Live service health and recorded availability for Aniway’s database, AniList schedule API, and Crunchyroll API reachability.', alternates: { canonical: '/status' }, openGraph: { title: 'Service Status | Aniway', url: '/status' } };
export default function StatusPage() { return <PublicShell current="status" title="Service status." description="Current API health, response times, and recorded availability for the services behind aniway."><StatusDashboard/></PublicShell>; }
