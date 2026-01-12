import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getEvent, getEvents, loadSignal, computeStress, calculateVelocity, detectFragility } from '@/lib/data';
import { SignalChartV2 } from '@/components/charts/signal-chart-v2';
import { StressBadge } from '@/components/events/stress-badge';
import { CategoryBadge } from '@/components/events/category-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((event) => ({ slug: event.slug }));
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });

  return `${startStr} – ${endStr}`;
}

export default async function EventPageV2({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  const signal = await loadSignal(slug);
  const stress = computeStress(signal);
  const latestPoint = signal[signal.length - 1];
  const primaryOutcome = event.outcomes[0];

  // Calculate dispersion width for display
  const latestDispersion = latestPoint?.high !== undefined && latestPoint?.low !== undefined
    ? ((latestPoint.high - latestPoint.low) * 100).toFixed(1)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Version indicator */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild className="-ml-4 text-zinc-400 hover:text-zinc-100">
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
            V2 — Merged Chart
          </span>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryBadge category={event.category} />
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-sm text-zinc-400">
              {formatDateRange(event.windowStart, event.windowEnd)}
            </span>
            <span className="text-zinc-600">•</span>
            <StressBadge level={stress.level} />
          </div>

          <h1 className="text-3xl font-semibold text-zinc-100">
            {event.title}
          </h1>

          {event.notes && (
            <p className="text-zinc-400">{event.notes}</p>
          )}

          {/* Key Metrics Row - Terminal Style */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Primary</p>
              <p className="font-mono text-zinc-100">{primaryOutcome.label}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Probability</p>
              <p className="font-mono text-2xl text-blue-500">
                {latestPoint ? `${(latestPoint.p * 100).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Dispersion</p>
              <p className="font-mono text-lg text-indigo-400">
                {latestDispersion ? `±${(parseFloat(latestDispersion) / 2).toFixed(1)}pp` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Stress</p>
              <p className="font-mono text-lg">
                <span className={
                  stress.level === 'high' ? 'text-rose-500' :
                  stress.level === 'med' ? 'text-amber-500' : 'text-emerald-500'
                }>
                  {stress.level.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Unified Chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-zinc-100">Belief Signal + Dispersion</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
                  <span className="text-zinc-400 font-mono">Probability</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-indigo-500/30 rounded-sm border border-indigo-500/50"></span>
                  <span className="text-zinc-400 font-mono">Uncertainty</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-500">
              Wider band = more market disagreement. Rising line + widening band = fragile conviction.
            </p>
          </CardHeader>
          <CardContent>
            <SignalChartV2 data={signal} />
          </CardContent>
        </Card>

        {/* Stress Analysis */}
        <div className="font-mono text-sm text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
          <span className="text-zinc-500">&gt;</span> {stress.rationale}
        </div>

        {/* Metadata Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-mono uppercase tracking-wider">Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {event.outcomes.map((outcome, index) => (
                  <li key={outcome.key} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-zinc-600 w-4">
                      {index + 1}.
                    </span>
                    <span className="text-zinc-300">{outcome.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-mono uppercase tracking-wider">Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {event.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors text-sm"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{source.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-mono uppercase tracking-wider">Contributors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {event.contributors.map((contributor, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-zinc-300">{contributor.name}</span>
                    {contributor.handle && (
                      <span className="text-zinc-500 font-mono ml-1 text-xs">{contributor.handle}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-zinc-800" />

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <p className="text-zinc-400 text-sm">
            Improve this sensor with updated probability data.
          </p>
          <div className="flex items-center gap-3">
            <code className="text-xs text-zinc-500 bg-zinc-900 px-3 py-2 rounded font-mono">
              data/signals/{slug}.csv
            </code>
            <Button size="sm" asChild>
              <Link href="/contribute">Contribute</Link>
            </Button>
          </div>
        </div>

        {/* Compare link */}
        <div className="text-center pt-4 border-t border-zinc-800">
          <Link
            href={`/events/${slug}`}
            className="text-xs text-zinc-500 hover:text-zinc-400 font-mono"
          >
            ← Compare with V1 (stacked charts)
          </Link>
        </div>
      </div>
    </div>
  );
}
