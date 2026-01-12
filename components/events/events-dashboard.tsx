'use client';

import { useState } from 'react';
import { RiskTicker } from './risk-ticker';
import { EventsTable, EventWithSignal } from './events-table';
import type { StressLevel } from '@/lib/types';

interface EventsDashboardProps {
  events: EventWithSignal[];
  stressCounts: Record<StressLevel, number>;
}

export function EventsDashboard({ events, stressCounts }: EventsDashboardProps) {
  const [stressFilter, setStressFilter] = useState<StressLevel | 'all'>('all');

  return (
    <>
      <RiskTicker
        totalEvents={events.length}
        stressCounts={stressCounts}
        activeFilter={stressFilter}
        onFilterChange={setStressFilter}
      />

      <EventsTable
        events={events}
        stressFilter={stressFilter}
        onStressFilterChange={setStressFilter}
      />
    </>
  );
}
