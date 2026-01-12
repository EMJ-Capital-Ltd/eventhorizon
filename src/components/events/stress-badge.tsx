import { Badge } from '@/components/ui/badge';
import type { StressLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StressBadgeProps {
  level: StressLevel;
  showLabel?: boolean;
  className?: string;
}

const regimeRiskConfig: Record<StressLevel, { label: string; displayLabel: string; className: string }> = {
  low: {
    label: 'STABLE',
    displayLabel: 'STABLE',
    className: 'bg-emerald-950 text-emerald-500 hover:bg-emerald-950/80 border-emerald-900',
  },
  med: {
    label: 'ELEVATED',
    displayLabel: 'ELEVATED',
    className: 'bg-orange-950 text-orange-500 hover:bg-orange-950/80 border-orange-900',
  },
  high: {
    label: 'TRANSITIONING',
    displayLabel: 'TRANSITIONING',
    className: 'bg-rose-950 text-rose-500 hover:bg-rose-950/80 border-rose-900',
  },
};

export function StressBadge({ level, showLabel = true, className }: StressBadgeProps) {
  const config = regimeRiskConfig[level];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
        REGIME RISK
      </span>
      <Badge
        variant="outline"
        className={cn(
          'font-mono text-xs uppercase tracking-wider',
          config.className,
          className
        )}
      >
        {showLabel ? config.displayLabel : level.toUpperCase()}
      </Badge>
    </div>
  );
}
