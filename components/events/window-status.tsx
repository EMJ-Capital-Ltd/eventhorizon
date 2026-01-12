import { Clock, CheckCircle2 } from 'lucide-react';

interface WindowStatusProps {
  windowStart: string;
  windowEnd: string;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WindowStatus({ windowStart, windowEnd }: WindowStatusProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(windowStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(windowEnd);
  end.setHours(0, 0, 0, 0);

  const dateRange = `${formatShortDate(windowStart)} – ${formatShortDate(windowEnd)}`;

  // Before window starts
  if (today < start) {
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <Clock className="h-3 w-3" />
          <span className="font-mono text-sm">
            Starts in {daysUntil}d
          </span>
        </div>
        <span className="font-mono text-xs text-zinc-600">{dateRange}</span>
      </div>
    );
  }

  // After window ends
  if (today > end) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <CheckCircle2 className="h-3 w-3" />
          <span className="font-mono text-sm">Resolved</span>
        </div>
        <span className="font-mono text-xs text-zinc-600">{dateRange}</span>
      </div>
    );
  }

  // Inside window (active)
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const currentDay = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const progress = (currentDay / totalDays) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span className="font-mono text-sm text-blue-500">
          Day {currentDay}/{totalDays}
        </span>
      </div>
      <div className="w-full">
        <div className="h-0.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <span className="font-mono text-xs text-zinc-600">{dateRange}</span>
    </div>
  );
}
