'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
const reported = new Set<string>();
export function PageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (!['/', '/statistics', '/status'].includes(pathname) || reported.has(pathname) || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    reported.add(pathname);
    void fetch('/api/statistics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: pathname }), keepalive: true }).catch(() => { reported.delete(pathname); });
  }, [pathname]);
  return null;
}
