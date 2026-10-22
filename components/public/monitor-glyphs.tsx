import { Database, Link2, Radio } from 'lucide-react';

const serviceIcons = { database: Database, anilist: Radio, crunchyroll: Link2 };

export function ServiceGlyph({ service }: { service: string }) {
  const Icon = serviceIcons[service as keyof typeof serviceIcons] ?? Radio;
  return <span className={`service-glyph service-glyph-${service}`} aria-hidden="true"><Icon size={18}/></span>;
}

export function LiveSignal() {
  return (
    <svg className="public-live-signal" viewBox="0 0 40 40" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle className="signal-ring" cx="20" cy="20" r="18"/>
      <path className="signal-track" d="M7 20h6l3-7 6 14 4-7h7"/>
      <path className="signal-trace" d="M7 20h6l3-7 6 14 4-7h7"/>
    </svg>
  );
}
