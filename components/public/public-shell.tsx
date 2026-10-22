import type { ReactNode } from 'react';
import './public-pages.css';
export function PublicShell({ current, title, description, children }: { current: 'statistics' | 'status'; title: string; description: string; children: ReactNode }) {
  return <main className="public-page"><header className="public-nav"><a href="/" className="public-brand"><img src="/favicon.svg" alt="" width="32" height="32"/>aniway<span>.</span></a><nav aria-label="Public pages"><a href="/">Open app ↗</a><a href="/statistics" aria-current={current === 'statistics' ? 'page' : undefined}>Statistics</a><a href="/status" aria-current={current === 'status' ? 'page' : undefined}>Status</a></nav></header><div className="public-intro"><p className="public-eyebrow">Out in the open</p><h1>{title}</h1><p>{description}</p></div>{children}<footer className="public-footer"><span>Made for your anime week.</span><a href="/">Back to aniway ↗</a></footer></main>;
}
