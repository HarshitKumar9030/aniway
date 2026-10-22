export type ServiceCheck = { id: string; name: string; state: 'operational' | 'degraded' | 'outage'; latencyMs: number; detail: string };
export type HealthSample = { checkedAt: number; checks: ServiceCheck[] };
export function summarizeHealth(history: HealthSample[], now = Date.now()) {
  const days = Array.from({ length: 30 }, (_, i) => ({ day: new Date(now - (29 - i) * 86_400_000).toISOString().slice(0, 10), services: [] as { id: string; total: number; successful: number; degraded: number; outage: number }[] }));
  const dayMap = new Map(days.map(day => [day.day, day]));
  const totals = new Map<string, { id: string; total: number; successful: number }>();
  const samples = history.filter(sample => sample.checkedAt <= now && dayMap.has(new Date(sample.checkedAt).toISOString().slice(0, 10)));
  for (const sample of samples) {
    const day = dayMap.get(new Date(sample.checkedAt).toISOString().slice(0, 10))!;
    for (const check of sample.checks) {
      let service = day.services.find(service => service.id === check.id);
      if (!service) { service = { id: check.id, total: 0, successful: 0, degraded: 0, outage: 0 }; day.services.push(service); }
      service.total++;
      if (check.state === 'operational') service.successful++;
      else if (check.state === 'degraded') service.degraded++;
      else service.outage++;
      const total = totals.get(check.id) ?? { id: check.id, total: 0, successful: 0 };
      total.total++;
      if (check.state === 'operational') total.successful++;
      totals.set(check.id, total);
    }
  }
  return { days, availability: [...totals.values()], recent: samples.slice().sort((a, b) => b.checkedAt - a.checkedAt).slice(0, 20) };
}
