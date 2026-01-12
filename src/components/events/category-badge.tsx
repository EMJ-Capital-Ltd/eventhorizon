import { Badge } from '@/components/ui/badge';
import type { RiskCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: RiskCategory;
  className?: string;
}

const categoryConfig: Record<RiskCategory, { label: string; className: string }> = {
  regulatory: {
    label: 'Regulatory',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  macro: {
    label: 'Macro',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  liquidity: {
    label: 'Liquidity',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  protocol: {
    label: 'Protocol',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  rwa: {
    label: 'RWA',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category];

  return (
    <Badge
      variant="outline"
      className={cn('text-xs capitalize', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
