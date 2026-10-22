import type { Metadata } from 'next';
import { PublicShell } from '../../components/public/public-shell';
import { StatisticsDashboard } from '../../components/public/dashboards';
export const metadata: Metadata = { title: 'Public Statistics | Aniway', description: 'Public usage and product statistics for Aniway. Aggregate page views, accounts, watchlist entries, and watched episodes.', alternates: { canonical: '/statistics' }, openGraph: { title: 'Public Statistics | Aniway', url: '/statistics' } };
export default function StatisticsPage() { return <PublicShell current="statistics" title="Aniway in numbers." description="Public usage statistics, from daily page views to the shows people have saved."><StatisticsDashboard/></PublicShell>; }
