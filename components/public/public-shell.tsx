import type { ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Activity, ChartNoAxesCombined, House } from 'lucide-react';
import './public-pages.css';
export function PublicShell({ current, title, description, children }: { current: 'statistics' | 'status'; title: string; description: string; children: ReactNode }) {
  return <main className="public-page">
    <header className="public-nav">
      <a href="/" className="public-brand" aria-label="Aniway home"><img src="/favicon.svg" alt="" width="32" height="32"/>aniway<span>.</span></a>
      <nav aria-label="Public pages">
        <a href="/"><House size={16} aria-hidden="true"/>Open app<ArrowUpRight size={14} aria-hidden="true"/></a>
        <a href="/statistics" aria-current={current === 'statistics' ? 'page' : undefined}><ChartNoAxesCombined size={16} aria-hidden="true"/>Statistics</a>
        <a href="/status" aria-current={current === 'status' ? 'page' : undefined}><Activity size={16} aria-hidden="true"/>Status</a>
      </nav>
    </header>
    <div className="public-intro public-enter"><p className="public-eyebrow">{current === 'statistics' ? 'Public statistics' : 'System status'}</p><h1>{title}</h1><p>{description}</p></div>
    {children}
    <footer className="public-footer"><span>aniway · Public dashboard</span><a href="/"><ArrowLeft size={14} aria-hidden="true"/>Back to aniway</a></footer>
  </main>;
}
