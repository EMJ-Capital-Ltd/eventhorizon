'use client';

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SignalPoint } from '@/lib/types';

interface SignalChartProps {
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

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-zinc-400 text-xs mb-1">{formatDate(point.date)}</p>
      <p className="text-zinc-100 font-mono text-sm">
        P: {(point.p * 100).toFixed(1)}%
      </p>
      {hasBand && (
        <p className="text-zinc-400 font-mono text-xs">
          Range: {(point.low! * 100).toFixed(1)}% - {(point.high! * 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export function SignalChart({ data }: SignalChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        No signal data available
      </div>
    );
  }

  const hasBandData = data.some((p) => p.low !== undefined && p.high !== undefined);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          {hasBandData && (
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="#3f3f46"
              fillOpacity={0.3}
            />
          )}
          {hasBandData && (
            <Area
              type="monotone"
              dataKey="low"
              stroke="none"
              fill="#09090b"
              fillOpacity={1}
            />
          )}
          <Line
            type="monotone"
            dataKey="p"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {!hasBandData && (
        <p className="text-zinc-500 text-xs text-center mt-2">
          No confidence band data provided for this event yet.
        </p>
      )}
    </div>
  );
}
