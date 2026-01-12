'use client';

import type { StressLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RiskTickerProps {
  totalEvents: number;
  stressCounts: Record<StressLevel, number>;
  activeFilter: StressLevel | 'all';
  onFilterChange: (level: StressLevel | 'all') => void;
}

export function RiskTicker({ totalEvents, stressCounts, activeFilter, onFilterChange }: RiskTickerProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
            activeFilter === 'all'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          )}
        >
          <span>Total Sensors:</span>
          <span className="font-mono text-zinc-100">{totalEvents}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterChange(activeFilter === 'high' ? 'all' : 'high')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
              activeFilter === 'high'
                ? 'bg-rose-500/20 ring-1 ring-rose-500/50'
                : 'hover:bg-zinc-800/50'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-zinc-400">High:</span>
            <span className="font-mono text-rose-500">{stressCounts.high}</span>
          </button>

          <button
            onClick={() => onFilterChange(activeFilter === 'med' ? 'all' : 'med')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
              activeFilter === 'med'
                ? 'bg-amber-500/20 ring-1 ring-amber-500/50'
                : 'hover:bg-zinc-800/50'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-zinc-400">Med:</span>
            <span className="font-mono text-amber-500">{stressCounts.med}</span>
          </button>

          <button
            onClick={() => onFilterChange(activeFilter === 'low' ? 'all' : 'low')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
              activeFilter === 'low'
                ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50'
                : 'hover:bg-zinc-800/50'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">Low:</span>
            <span className="font-mono text-emerald-500">{stressCounts.low}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
