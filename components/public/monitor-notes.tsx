import { ArrowUpRight, ChevronDown, Info } from 'lucide-react';

export function MonitorNotes() {
  return (
    <details className="public-card monitor-notes">
      <summary>
        <span className="public-icon-heading"><Info size={19} aria-hidden="true"/>About this monitor</span>
        <ChevronDown className="monitor-notes-chevron" size={18} aria-hidden="true"/>
      </summary>
      <div className="monitor-notes-content">
        <p>Availability is the percentage of recorded checks that succeeded, not continuous uptime. Gaps between checks are unobserved. New monitoring starts with no historical data; we never backfill a healthy history.</p>
        <p>The database check runs a query. AniList is checked with real catalog and broadcast queries. Crunchyroll is checked without user credentials; reachability does not guarantee that an individual account can sign in or sync.</p>
        <p>This page is hosted with the app. If the website itself is unavailable, independent check results remain visible in <a className="public-inline-link" href="https://github.com/HarshitKumar9030/aniway/actions/workflows/uptime.yml" target="_blank" rel="noreferrer">GitHub Actions <ArrowUpRight size={13} aria-hidden="true"/></a>.</p>
      </div>
    </details>
  );
}
