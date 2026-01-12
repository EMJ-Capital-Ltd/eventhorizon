'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SignalPoint } from '@/lib/types';

interface RawDataInspectorProps {
  data: SignalPoint[];
}

export function RawDataInspector({ data }: RawDataInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any advanced metrics exist
  const hasAdvancedMetrics = data.some(
    (p) => p.ref_value !== undefined || p.concentration !== undefined || p.cost_to_move !== undefined
  );

  if (!hasAdvancedMetrics) {
    return null;
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-zinc-500" />
            <CardTitle className="text-zinc-100 text-lg">Raw Data Inspector</CardTitle>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
              PHASE 4
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Advanced Metrics
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-zinc-500 mt-2">
          Advanced market structure data for v0.3 dual-axis visualizations.
        </p>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-zinc-500 font-medium">Date</th>
                  <th className="text-right py-2 px-3 text-zinc-500 font-medium">Probability</th>
                  <th className="text-right py-2 px-3 text-cyan-500 font-medium">Ref Value</th>
                  <th className="text-right py-2 px-3 text-purple-500 font-medium">Concentration</th>
                  <th className="text-right py-2 px-3 text-emerald-500 font-medium">Cost to Move</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-20).map((point, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-900 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 text-zinc-400">
                      {new Date(point.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="text-right py-2 px-3 text-blue-400">
                      {(point.p * 100).toFixed(1)}%
                    </td>
                    <td className="text-right py-2 px-3 text-cyan-400">
                      {point.ref_value !== undefined
                        ? `$${point.ref_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="text-right py-2 px-3 text-purple-400">
                      {point.concentration !== undefined
                        ? (point.concentration * 100).toFixed(1) + '%'
                        : '—'}
                    </td>
                    <td className="text-right py-2 px-3 text-emerald-400">
                      {point.cost_to_move !== undefined
                        ? `$${(point.cost_to_move / 1000000).toFixed(2)}M`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-zinc-500 space-y-1">
            <p>
              <span className="text-cyan-400">Ref Value:</span> Price of underlying asset
            </p>
            <p>
              <span className="text-purple-400">Concentration:</span> Herfindahl Score (whale
              concentration)
            </p>
            <p>
              <span className="text-emerald-400">Cost to Move:</span> USD resilience metric
            </p>
            <p className="text-zinc-600 italic mt-2">
              Showing last 20 data points. Full dataset available for download.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
