'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, SplitSquareVertical } from 'lucide-react';
import { SignalChart } from './signal-chart';
import { DispersionChart } from './dispersion-chart';
import { SignalChartV2 } from './signal-chart-v2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SignalPoint } from '@/lib/types';

interface AnimatedChartSectionProps {
  data: SignalPoint[];
}

export function AnimatedChartSection({ data }: AnimatedChartSectionProps) {
  const [isOverlaid, setIsOverlaid] = useState(true);

  const hasBandData = data.some((p) => p.low !== undefined && p.high !== undefined);

  return (
    <div className="space-y-6">
      {/* Toggle Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOverlaid(!isOverlaid)}
          className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 gap-2"
        >
          <motion.div
            animate={{ rotate: isOverlaid ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOverlaid ? (
              <SplitSquareVertical className="h-4 w-4" />
            ) : (
              <Layers className="h-4 w-4" />
            )}
          </motion.div>
          {isOverlaid ? 'Split Charts' : 'Overlay Data'}
        </Button>
      </div>

      {/* Charts Container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {!isOverlaid ? (
            // Stacked View
            <motion.div
              key="stacked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Signal Chart */}
              <motion.div
                layout
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Belief Signal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SignalChart data={data} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Dispersion Chart */}
              <motion.div
                layout
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{
                  y: -200,
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.5, ease: 'easeInOut' }
                }}
              >
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-100">Dispersion Band</CardTitle>
                    <p className="text-sm text-zinc-400">Uncertainty evolution over time</p>
                  </CardHeader>
                  <CardContent>
                    <DispersionChart data={data} />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : (
            // Merged View
            <motion.div
              key="merged"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-zinc-100 flex items-center gap-2">
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          Belief Signal + Dispersion
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: 'spring', stiffness: 500 }}
                          className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded"
                        >
                          MERGED
                        </motion.span>
                      </CardTitle>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-zinc-500 mt-1"
                      >
                        Wider band = more market disagreement. Rising line + widening band = fragile conviction.
                      </motion.p>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-4 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
                        <span className="text-zinc-400 font-mono">Probability</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-indigo-500/30 rounded-sm border border-indigo-500/50"></span>
                        <span className="text-zinc-400 font-mono">Uncertainty</span>
                      </div>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <SignalChartV2 data={data} />
                  </motion.div>
                </CardContent>
              </Card>

              {/* Animated insight that appears after merge */}
              {hasBandData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg"
                >
                  <p className="text-sm text-indigo-300 font-mono">
                    <span className="text-indigo-400">TIP:</span> When the blue line rises but the shaded area widens,
                    you&apos;re seeing &quot;fragile conviction&quot; — probability is up, but so is uncertainty.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
