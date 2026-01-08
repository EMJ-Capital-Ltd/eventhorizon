import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { ProbabilityPoint } from '@eventhorizon/shared';

interface BeliefChartProps {
  data: ProbabilityPoint[];
  height?: number;
  showAxes?: boolean;
  color?: string;
}

export function BeliefChart({
  data,
  height = 120,
  showAxes = false,
  color = '#22d3ee'
}: BeliefChartProps) {
  const chartData = data.map(point => ({
    time: point.timestamp,
    probability: point.probability * 100,
  }));

  const minProb = Math.min(...chartData.map(d => d.probability));
  const maxProb = Math.max(...chartData.map(d => d.probability));
  const padding = (maxProb - minProb) * 0.1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {showAxes && (
          <>
            <XAxis
              dataKey="time"
              tickFormatter={(t) => format(t, 'MMM d')}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[Math.max(0, minProb - padding), Math.min(100, maxProb + padding)]}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              width={40}
            />
          </>
        )}

        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelFormatter={(t) => format(t, 'MMM d, h:mm a')}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Probability']}
        />

        <ReferenceLine
          y={50}
          stroke="#475569"
          strokeDasharray="3 3"
          strokeOpacity={0.5}
        />

        <Area
          type="monotone"
          dataKey="probability"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
