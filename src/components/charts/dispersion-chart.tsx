'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SignalPoint } from '@/lib/types';

interface DispersionChartProps {
  data: SignalPoint[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: SignalPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;
  const hasBand = point.low !== undefined && point.high !== undefined;

  if (!hasBand) {
    return null;
  }

  const bandWidth = point.high! - point.low!;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-zinc-400 text-xs mb-1">{formatDate(point.date)}</p>
      <p className="text-zinc-100 font-mono text-sm">
        Range: {(point.low! * 100).toFixed(1)}% - {(point.high! * 100).toFixed(1)}%
      </p>
      <p className="text-zinc-400 font-mono text-xs">
        Width: {(bandWidth * 100).toFixed(1)}pp
      </p>
    </div>
  );
}

export function DispersionChart({ data }: DispersionChartProps) {
  const hasBandData = data.some((p) => p.low !== undefined && p.high !== undefined);

  if (!hasBandData) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500">
        No dispersion band data available for this event.
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="high"
            stroke="#6366f1"
            strokeWidth={1}
            fill="#6366f1"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="low"
            stroke="#6366f1"
            strokeWidth={1}
            fill="#09090b"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
