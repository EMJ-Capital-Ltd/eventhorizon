'use client';

import { useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SignalPoint } from '@/lib/types';

interface ProChartSectionProps {
  data: SignalPoint[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProChartSection({ data }: ProChartSectionProps) {
  const [syncedIndex, setSyncedIndex] = useState<number | null>(null);
  const [isOverlaid, setIsOverlaid] = useState(true);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-zinc-500">
        No signal data available
      </div>
    );
  }

  const hasBandData = data.some((p) => p.low !== undefined && p.high !== undefined);
  const hasRefValue = data.some((p) => p.ref_value !== undefined);
  const hasCostToMove = data.some((p) => p.cost_to_move !== undefined);
  const hasConcentration = data.some((p) => p.concentration !== undefined);

  // Calculate liquidity for line style
  const avgLiquidity = data.reduce((sum, p) => sum + (p.liquidity || 1.0), 0) / data.length;
  const isLowLiquidity = avgLiquidity < 0.8;
  const strokeDasharray = isLowLiquidity ? "5 5" : "0";

  // Detect sentiment changes for markers
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

  // Calculate ref_value range for right axis
  const refValues = data.map((p) => p.ref_value).filter((v): v is number => v !== undefined);
  const minRefValue = refValues.length > 0 ? Math.min(...refValues) * 0.98 : 0;
  const maxRefValue = refValues.length > 0 ? Math.max(...refValues) * 1.02 : 100;

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOverlaid(!isOverlaid)}
          className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
        >
          {isOverlaid ? 'Split View' : 'Merge View'}
        </Button>
      </div>

      {isOverlaid ? (
        // MERGED VIEW: Single Card with all panels
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  <span>Tower of Conviction</span>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    PRO
                  </span>
                </CardTitle>
                <p className="text-sm text-zinc-500 mt-1">
                  Market structure analysis
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* MERGED VIEW CONTENT */}
            <>
              {/* MERGED VIEW: Panel A (Combined) */}
              <div className="w-full" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
                onMouseMove={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    const index = typeof e.activeTooltipIndex === 'number'
                      ? e.activeTooltipIndex
                      : parseInt(String(e.activeTooltipIndex), 10);
                    if (!isNaN(index)) {
                      setSyncedIndex(index);
                    }
                  }
                }}
                onMouseLeave={() => setSyncedIndex(null)}
              >
                <defs>
                  <linearGradient id="dispersionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                {/* X-Axis */}
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#71717a"
                  fontSize={12}
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                />

                {/* Left Y-Axis: Probability */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  stroke="#71717a"
                  fontSize={12}
                  fontFamily="var(--font-jetbrains-mono), monospace"
                  tickLine={false}
                  axisLine={{ stroke: '#3f3f46' }}
                  width={45}
                  label={{
                    value: 'Probability',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: '#71717a' },
                  }}
                />

                {/* Right Y-Axis: Ref Value */}
                {hasRefValue && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[minRefValue, maxRefValue]}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    stroke="#71717a"
                    fontSize={12}
                    fontFamily="var(--font-jetbrains-mono), monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#3f3f46' }}
                    width={70}
                    label={{
                      value: 'Asset Price',
                      angle: 90,
                      position: 'insideRight',
                      style: { fontSize: 12, fill: '#71717a' },
                    }}
                  />
                )}

                <Tooltip
                  cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={<PanelATooltip />}
                />

                {/* Dispersion Band */}
                {hasBandData && (
                  <>
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="high"
                      stroke="#6366f1"
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      fill="url(#dispersionGradient)"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="low"
                      stroke="#6366f1"
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      fill="#09090b"
                    />
                  </>
                )}

                {/* Probability Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="p"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  strokeDasharray={strokeDasharray}
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2 }}
                />

                {/* Ref Value Line (Gray, subtle) */}
                {hasRefValue && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ref_value"
                    stroke="#71717a"
                    strokeWidth={1.5}
                    dot={false}
                    strokeOpacity={0.7}
                  />
                )}

                {/* Sentiment change markers */}
                {sentimentChanges.map((change, idx) => (
                  <ReferenceDot
                    key={`sentiment-${idx}`}
                    yAxisId="left"
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

          {/* Panel B: Cost to Move (Bar Chart) */}
          {hasCostToMove && (
            <div className="w-full" style={{ height: '120px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
                  onMouseMove={(e) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      const index = typeof e.activeTooltipIndex === 'number'
                        ? e.activeTooltipIndex
                        : parseInt(String(e.activeTooltipIndex), 10);
                      if (!isNaN(index)) {
                        setSyncedIndex(index);
                      }
                    }
                  }}
                  onMouseLeave={() => setSyncedIndex(null)}
                >
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#71717a"
                    fontSize={12}
                    fontFamily="var(--font-jetbrains-mono), monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#3f3f46' }}
                    hide
                  />
                  <Tooltip
                    cursor={{ fill: '#52525b', fillOpacity: 0.1 }}
                    content={<PanelBTooltip />}
                  />
                  <Bar
                    dataKey="cost_to_move"
                    fill="#3f3f46"
                    opacity={0.5}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Panel C: Concentration Heatmap */}
          {hasConcentration && (
            <div className="w-full" style={{ height: '24px' }}>
              <ConcentrationHeatmap data={data} />
            </div>
          )}

          {/* Low liquidity warning */}
          {isLowLiquidity && (
            <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-950/20 border border-amber-900/50 rounded px-3 py-2 mt-2">
              <span className="font-mono">⚠</span>
              <span>Low liquidity signal ({(avgLiquidity * 100).toFixed(0)}%) - shown as dashed line</span>
            </div>
          )}
            </>
          </CardContent>
        </Card>
      ) : (
        // SPLIT VIEW: Separate Cards for each panel
        <div className="space-y-4">
          {/* A1: Direction - Probability vs. Price */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Direction</CardTitle>
              <p className="text-sm text-zinc-400">Probability vs. Asset Price</p>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data}
                      margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
                      onMouseMove={(e) => {
                        if (e && e.activeTooltipIndex !== undefined) {
                          const index = typeof e.activeTooltipIndex === 'number'
                            ? e.activeTooltipIndex
                            : parseInt(String(e.activeTooltipIndex), 10);
                          if (!isNaN(index)) {
                            setSyncedIndex(index);
                          }
                        }
                      }}
                      onMouseLeave={() => setSyncedIndex(null)}
                    >
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
                        yAxisId="left"
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        stroke="#71717a"
                        fontSize={12}
                        fontFamily="var(--font-jetbrains-mono), monospace"
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        width={45}
                        label={{
                          value: 'Probability',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 12, fill: '#71717a' },
                        }}
                      />
                      {hasRefValue && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[minRefValue, maxRefValue]}
                          tickFormatter={(v) => `$${v.toLocaleString()}`}
                          stroke="#71717a"
                          fontSize={12}
                          fontFamily="var(--font-jetbrains-mono), monospace"
                          tickLine={false}
                          axisLine={{ stroke: '#3f3f46' }}
                          width={70}
                          label={{
                            value: 'Asset Price',
                            angle: 90,
                            position: 'insideRight',
                            style: { fontSize: 12, fill: '#71717a' },
                          }}
                        />
                      )}
                      <Tooltip
                        cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={<PanelA1Tooltip />}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="p"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        strokeDasharray={strokeDasharray}
                        dot={false}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2 }}
                      />
                      {hasRefValue && (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="ref_value"
                          stroke="#71717a"
                          strokeWidth={1.5}
                          dot={false}
                          strokeOpacity={0.7}
                        />
                      )}
                      {sentimentChanges.map((change, idx) => (
                        <ReferenceDot
                          key={`sentiment-a1-${idx}`}
                          yAxisId="left"
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
            </CardContent>
          </Card>

          {/* A2: Uncertainty - Dispersion */}
          {hasBandData && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Uncertainty</CardTitle>
                <p className="text-sm text-zinc-400">Dispersion range over time</p>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={data}
                        margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
                        onMouseMove={(e) => {
                          if (e && e.activeTooltipIndex !== undefined) {
                            const index = typeof e.activeTooltipIndex === 'number'
                              ? e.activeTooltipIndex
                              : parseInt(String(e.activeTooltipIndex), 10);
                            if (!isNaN(index)) {
                              setSyncedIndex(index);
                            }
                          }
                        }}
                        onMouseLeave={() => setSyncedIndex(null)}
                      >
                        <defs>
                          <linearGradient id="dispersionGradientSplit" x1="0" y1="0" x2="0" y2="1">
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
                          label={{
                            value: 'Dispersion',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 12, fill: '#71717a' },
                          }}
                        />
                        <Tooltip
                          cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                          content={<PanelA2Tooltip />}
                        />
                        <Area
                          type="monotone"
                          dataKey="high"
                          stroke="#6366f1"
                          strokeWidth={1}
                          strokeOpacity={0.5}
                          fill="url(#dispersionGradientSplit)"
                        />
                        <Area
                          type="monotone"
                          dataKey="low"
                          stroke="#6366f1"
                          strokeWidth={1}
                          strokeOpacity={0.5}
                          fill="#09090b"
                        />
                        <Line
                          type="monotone"
                          dataKey="p"
                          stroke="#3b82f6"
                          strokeWidth={1}
                          strokeOpacity={0.3}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* B: Resilience - Cost to Move */}
          {hasCostToMove && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Resilience</CardTitle>
                <p className="text-sm text-zinc-400">Cost to move the market</p>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data}
                        margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
                        onMouseMove={(e) => {
                          if (e && e.activeTooltipIndex !== undefined) {
                            const index = typeof e.activeTooltipIndex === 'number'
                              ? e.activeTooltipIndex
                              : parseInt(String(e.activeTooltipIndex), 10);
                            if (!isNaN(index)) {
                              setSyncedIndex(index);
                            }
                          }
                        }}
                        onMouseLeave={() => setSyncedIndex(null)}
                      >
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
                          stroke="#71717a"
                          fontSize={12}
                          fontFamily="var(--font-jetbrains-mono), monospace"
                          tickLine={false}
                          axisLine={{ stroke: '#3f3f46' }}
                          width={45}
                          tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip
                          cursor={{ fill: '#52525b', fillOpacity: 0.1 }}
                          content={<PanelBTooltip />}
                        />
                        <Bar
                          dataKey="cost_to_move"
                          fill="#3f3f46"
                          opacity={0.5}
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* C: Quality - Concentration */}
          {hasConcentration && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Quality</CardTitle>
                <p className="text-sm text-zinc-400">Market concentration heatmap</p>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: '40px' }}>
                  <ConcentrationHeatmap data={data} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low liquidity warning */}
          {isLowLiquidity && (
            <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-950/20 border border-amber-900/50 rounded px-3 py-2">
              <span className="font-mono">⚠</span>
              <span>Low liquidity signal ({(avgLiquidity * 100).toFixed(0)}%) - shown as dashed line</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Panel A Tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SignalPoint }>;
}

function PanelATooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const hasBand = point.low !== undefined && point.high !== undefined;
  const halfBand = hasBand ? (point.high! - point.low!) / 2 : null;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg min-w-[180px]">
      <p className="text-zinc-400 text-xs mb-2 font-mono border-b border-zinc-700 pb-1">
        {formatDate(point.date)}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-zinc-500 text-xs">Probability</span>
          <span className="text-blue-400 font-mono text-sm font-medium">
            {(point.p * 100).toFixed(1)}%
          </span>
        </div>
        {hasBand && (
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-zinc-500 text-xs">±Range</span>
            <span className="text-indigo-400 font-mono text-xs">
              ±{(halfBand! * 100).toFixed(1)}pp
            </span>
          </div>
        )}
        {point.ref_value !== undefined && (
          <div className="flex justify-between items-baseline gap-4 pt-1 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">Asset Price</span>
            <span className="text-zinc-400 font-mono text-sm">
              ${point.ref_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {point.sentiment && (
          <div className="flex justify-between items-baseline gap-4 pt-1 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">Context</span>
            <span className="text-cyan-400 font-mono text-xs">{point.sentiment}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel A1 Tooltip (Split View - Direction)
function PanelA1Tooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg min-w-[180px]">
      <p className="text-zinc-400 text-xs mb-2 font-mono border-b border-zinc-700 pb-1">
        {formatDate(point.date)}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-zinc-500 text-xs">Probability</span>
          <span className="text-blue-400 font-mono text-sm font-medium">
            {(point.p * 100).toFixed(1)}%
          </span>
        </div>
        {point.ref_value !== undefined && (
          <div className="flex justify-between items-baseline gap-4 pt-1 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">Asset Price</span>
            <span className="text-zinc-400 font-mono text-sm">
              ${point.ref_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {point.sentiment && (
          <div className="flex justify-between items-baseline gap-4 pt-1 border-t border-zinc-800">
            <span className="text-zinc-500 text-xs">Context</span>
            <span className="text-cyan-400 font-mono text-xs">{point.sentiment}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Panel A2 Tooltip (Split View - Uncertainty)
function PanelA2Tooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const hasBand = point.low !== undefined && point.high !== undefined;
  const halfBand = hasBand ? (point.high! - point.low!) / 2 : null;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg min-w-[180px]">
      <p className="text-zinc-400 text-xs mb-2 font-mono border-b border-zinc-700 pb-1">
        {formatDate(point.date)}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-zinc-500 text-xs">Probability</span>
          <span className="text-blue-400 font-mono text-sm font-medium">
            {(point.p * 100).toFixed(1)}%
          </span>
        </div>
        {hasBand && (
          <>
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-zinc-500 text-xs">Range</span>
              <span className="text-zinc-400 font-mono text-xs">
                {(point.low! * 100).toFixed(1)}–{(point.high! * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-zinc-500 text-xs">±Dispersion</span>
              <span className="text-indigo-400 font-mono text-sm font-medium">
                ±{(halfBand! * 100).toFixed(1)}pp
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Panel B Tooltip
function PanelBTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-zinc-400 text-xs mb-1 font-mono border-b border-zinc-700 pb-1">
        {formatDate(point.date)}
      </p>
      <div className="flex justify-between items-baseline gap-4">
        <span className="text-zinc-500 text-xs">Resilience</span>
        <span className="text-emerald-400 font-mono text-sm font-medium">
          ${(point.cost_to_move! / 1000000).toFixed(2)}M
        </span>
      </div>
    </div>
  );
}

// Panel C: Concentration Heatmap Component
function ConcentrationHeatmap({ data }: { data: SignalPoint[] }) {
  return (
    <div className="w-full h-full flex">
      {data.map((point, idx) => {
        const conc = point.concentration || 0;
        let bgColor = '#27272a'; // default zinc-800

        if (conc < 0.3) {
          bgColor = '#064e3b'; // emerald-900
        } else if (conc >= 0.7) {
          bgColor = '#4c0519'; // rose-900
        }

        return (
          <div
            key={idx}
            className="flex-1 h-full border-r border-zinc-950 last:border-r-0"
            style={{ backgroundColor: bgColor }}
            title={`${formatDate(point.date)}: ${(conc * 100).toFixed(1)}% concentration`}
          />
        );
      })}
    </div>
  );
}
