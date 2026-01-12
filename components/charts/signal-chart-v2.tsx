'use client';

import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SignalPoint } from '@/lib/types';

interface SignalChartV2Props {
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
  const halfBand = hasBand ? (point.high! - point.low!) / 2 : null;
  const hasLiquidity = point.liquidity !== undefined && point.liquidity < 1.0;
  const hasSentiment = point.sentiment !== undefined;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg min-w-35">
      <p className="text-zinc-400 text-xs mb-2 font-mono border-b border-zinc-700 pb-1">
        {formatDate(point.date)}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-zinc-500 text-xs">Prob</span>
          <span className="text-zinc-100 font-mono text-sm">
            {(point.p * 100).toFixed(1)}%
          </span>
        </div>
        {hasBand && (
          <>
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500 text-xs">Range</span>
              <span className="text-zinc-400 font-mono text-xs">
                {(point.low! * 100).toFixed(1)}–{(point.high! * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500 text-xs">±</span>
              <span className="text-indigo-400 font-mono text-sm font-medium">
                ±{(halfBand! * 100).toFixed(1)}pp
              </span>
            </div>
          </>
        )}
        {hasLiquidity && (
          <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">Liquidity</span>
            <span className="text-amber-400 font-mono text-xs">
              {(point.liquidity! * 100).toFixed(0)}%
            </span>
          </div>
        )}
        {hasSentiment && (
          <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">Context</span>
            <span className="text-cyan-400 font-mono text-xs">
              {point.sentiment}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SignalChartV2({ data }: SignalChartV2Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-zinc-500">
        No signal data available
      </div>
    );
  }

  const hasBandData = data.some((p) => p.low !== undefined && p.high !== undefined);

  // Phase 3: Calculate average liquidity for line style (dashed = low liquidity)
  const avgLiquidity = data.reduce((sum, p) => sum + (p.liquidity || 1.0), 0) / data.length;
  const isLowLiquidity = avgLiquidity < 0.8;
  const strokeDasharray = isLowLiquidity ? "5 5" : "0"; // Dashed for low liquidity (industry standard)

  // Phase 3: Detect sentiment changes
  const sentimentChanges: Array<{ date: string; p: number; sentiment: string }> = [];
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    if (current.sentiment && current.sentiment !== previous.sentiment) {
      sentimentChanges.push({
        date: current.date,
        p: current.p,
        sentiment: current.sentiment,
      });
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dispersionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#71717a"
            fontSize={12}
            fontFamily="var(--font-jetbrains-mono), monospace"
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            stroke="#71717a"
            fontSize={12}
            fontFamily="var(--font-jetbrains-mono), monospace"
            tickLine={false}
            axisLine={{ stroke: '#3f3f46' }}
            width={45}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {hasBandData && (
            <>
              <Area
                type="monotone"
                dataKey="high"
                stroke="#6366f1"
                strokeWidth={1}
                strokeOpacity={0.5}
                fill="url(#dispersionGradient)"
              />
              <Area
                type="monotone"
                dataKey="low"
                stroke="#6366f1"
                strokeWidth={1}
                strokeOpacity={0.5}
                fill="#09090b"
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="p"
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeDasharray={strokeDasharray}
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2 }}
          />
          {/* Phase 3: Sentiment change markers */}
          {sentimentChanges.map((change, idx) => (
            <ReferenceDot
              key={`sentiment-${idx}`}
              x={change.date}
              y={change.p}
              r={6}
              fill="#06b6d4"
              stroke="#0e7490"
              strokeWidth={2}
              label={{
                value: '◆',
                position: 'top',
                fill: '#06b6d4',
                fontSize: 14,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
      {!hasBandData && (
        <p className="text-zinc-500 text-xs text-center font-mono">
          No dispersion band data provided for this event yet.
        </p>
      )}
      {isLowLiquidity && (
        <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-950/20 border border-amber-900/50 rounded px-3 py-2">
          <span className="font-mono">⚠</span>
          <span>Low liquidity signal ({(avgLiquidity * 100).toFixed(0)}%) - shown as dashed line</span>
        </div>
      )}
    </div>
  );
}
