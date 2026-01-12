'use client';

import { useState } from 'react';
import { AnimatedChartSection } from './animated-chart-section';
import { ProChartSection } from './pro-chart-section';
import { Button } from '@/components/ui/button';
import type { SignalPoint } from '@/lib/types';

interface ChartSectionWrapperProps {
  data: SignalPoint[];
}

export function ChartSectionWrapper({ data }: ChartSectionWrapperProps) {
  // Auto-detect if advanced metrics exist in the data
  const hasAdvancedMetrics = data.some(
    (p) =>
      p.ref_value !== undefined ||
      p.cost_to_move !== undefined ||
      p.concentration !== undefined
  );

  // Default to Pro view if advanced metrics exist, otherwise Simple
  const [viewMode, setViewMode] = useState<'simple' | 'pro'>(
    hasAdvancedMetrics ? 'pro' : 'simple'
  );

  // If no advanced metrics, just show the simple view
  if (!hasAdvancedMetrics) {
    return <AnimatedChartSection data={data} />;
  }

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Chart View:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('simple')}
              className={
                viewMode === 'simple'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:border-zinc-600'
              }
            >
              Simple
            </Button>
            <Button
              variant={viewMode === 'pro' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pro')}
              className={
                viewMode === 'pro'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:border-zinc-600'
              }
            >
              Pro
            </Button>
          </div>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          {viewMode === 'pro'
            ? 'Market Structure Analysis'
            : 'Core probability signal'}
        </div>
      </div>

      {/* Render the appropriate chart based on view mode */}
      {viewMode === 'simple' ? (
        <AnimatedChartSection data={data} />
      ) : (
        <ProChartSection data={data} />
      )}
    </div>
  );
}
