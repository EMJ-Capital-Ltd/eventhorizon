import { getEvents, loadSignal, computeStress } from '@/lib/data';
import { EventsDashboard } from '@/components/events/events-dashboard';
import type { StressLevel } from '@/lib/types';

export default async function EventsPage() {
  const events = await getEvents();

  const eventsWithSignals = await Promise.all(
    events.map(async (event) => {
      const signal = await loadSignal(event.slug);
      const stress = computeStress(signal);
      return { event, signal, stress };
    })
  );

  const stressCounts: Record<StressLevel, number> = {
    low: 0,
    med: 0,
    high: 0,
  };

  for (const item of eventsWithSignals) {
    stressCounts[item.stress.level]++;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-100 mb-2">
            Risk Event Registry
          </h1>
          <p className="text-zinc-400">
            Track belief trajectories and stress levels across market-moving events.
          </p>
        </div>

        <EventsDashboard events={eventsWithSignals} stressCounts={stressCounts} />
      </div>
    </div>
  );
}
