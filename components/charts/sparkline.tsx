'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { SignalPoint, StressLevel } from '@/lib/types';

interface SparklineProps {
  data: SignalPoint[];
  stressLevel?: StressLevel;
  width?: number;
  height?: number;
}

const stressColors: Record<StressLevel, string> = {
  high: '#f43f5e',   // rose-500
  med: '#f59e0b',    // amber-500
  low: '#10b981',    // emerald-500
};

export function Sparkline({ data, stressLevel = 'low', width = 80, height = 24 }: SparklineProps) {
  const last7Days = data.slice(-7);

  if (last7Days.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-zinc-500 text-xs font-mono"
        style={{ width, height }}
      >
        --
      </div>
    );
  }

  const strokeColor = stressColors[stressLevel];

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={last7Days}>
          <Line
            type="monotone"
            dataKey="p"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
