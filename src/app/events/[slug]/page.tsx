import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TriangleAlert } from 'lucide-react';
import { getEvent, getEvents, loadSignal, computeStress, calculateVelocity, detectFragility, calculateAcceleration, calculateJerk, detectBeliefFlip } from '@/lib/data';
import { ChartSectionWrapper } from '@/components/charts/chart-section-wrapper';
import { RawDataInspector } from '@/components/charts/raw-data-inspector';
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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startStr} – ${endStr}`;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  const signal = await loadSignal(slug);
  const stress = computeStress(signal);
  const latestPoint = signal[signal.length - 1];
  const primaryOutcome = event.outcomes[0];

  // Calculate velocity and fragility
  const velocity = calculateVelocity(signal);
  const isFragile = detectFragility(signal);

  // Calculate 2nd and 3rd derivatives for flip detection
  const acceleration = calculateAcceleration(signal);
  const jerk = calculateJerk(signal);
  const beliefFlip = detectBeliefFlip(signal);

  // Calculate dispersion
  const dispersion = (latestPoint?.high !== undefined && latestPoint?.low !== undefined)
    ? (latestPoint.high - latestPoint.low)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="mb-4">
            <Button variant="ghost" asChild className="-ml-4 text-zinc-400 hover:text-zinc-100">
              <Link href="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <CategoryBadge category={event.category} />
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-sm text-zinc-400">
              {formatDateRange(event.windowStart, event.windowEnd)}
            </span>
            <span className="text-zinc-500">•</span>
            <StressBadge level={stress.level} />
          </div>

          <h1 className="text-3xl font-semibold text-zinc-100 mb-3">
            {event.title}
          </h1>

          {event.notes && (
            <p className="text-zinc-400 mb-4">{event.notes}</p>
          )}

          {/* 6-Metric Header Readout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            {/* PRIMARY */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                PRIMARY
              </div>
              <div className="text-zinc-100 font-medium text-sm">
                {primaryOutcome.label}
              </div>
            </div>

            {/* PROBABILITY */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                PROBABILITY
              </div>
              <div className="font-mono text-lg text-blue-500">
                {latestPoint ? `${(latestPoint.p * 100).toFixed(1)}%` : '—'}
              </div>
            </div>

            {/* DISPERSION */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                DISPERSION
              </div>
              <div className="font-mono text-lg text-purple-400">
                {dispersion > 0 ? `±${(dispersion * 100).toFixed(1)}pp` : '—'}
              </div>
            </div>

            {/* VELOCITY (1st derivative) */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                VELOCITY (δ¹)
              </div>
              <div className={`font-mono text-lg ${
                velocity > 0
                  ? 'text-emerald-500'
                  : velocity < 0
                    ? 'text-rose-500'
                    : 'text-zinc-500'
              }`}>
                {velocity !== 0
                  ? `${velocity > 0 ? '+' : ''}${(velocity * 100).toFixed(2)}pp/d`
                  : '0.00pp/d'}
              </div>
            </div>

            {/* ACCELERATION (2nd derivative) */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                ACCEL (δ²)
              </div>
              <div className={`font-mono text-lg ${
                acceleration > 0.001
                  ? 'text-cyan-500'
                  : acceleration < -0.001
                    ? 'text-orange-500'
                    : 'text-zinc-500'
              }`}>
                {Math.abs(acceleration) > 0.0001
                  ? `${acceleration > 0 ? '+' : ''}${(acceleration * 100).toFixed(3)}pp/d²`
                  : '0.000pp/d²'}
              </div>
            </div>

            {/* JERK (3rd derivative) */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
                JERK (δ³)
              </div>
              <div className={`font-mono text-lg ${
                jerk > 0.0005
                  ? 'text-pink-500'
                  : jerk < -0.0005
                    ? 'text-amber-500'
                    : 'text-zinc-500'
              }`}>
                {Math.abs(jerk) > 0.00001
                  ? `${jerk > 0 ? '+' : ''}${(jerk * 100).toFixed(4)}pp/d³`
                  : '0.0000pp/d³'}
              </div>
            </div>
          </div>
        </div>

        {/* Belief Flip Warning */}
        {beliefFlip.hasFlip && (
          <div
            className={`flex items-center gap-3 ${
              beliefFlip.flipType === 'bullish'
                ? 'bg-cyan-950/20 border-cyan-900/50'
                : 'bg-orange-950/20 border-orange-900/50'
            } border rounded-lg px-4 py-3`}
            title="Inflection point detected - market momentum is shifting direction."
          >
            <TriangleAlert className={`h-5 w-5 ${
              beliefFlip.flipType === 'bullish' ? 'text-cyan-500' : 'text-orange-500'
            } flex-shrink-0`} />
            <div>
              <div className={`font-mono text-sm uppercase tracking-wider ${
                beliefFlip.flipType === 'bullish' ? 'text-cyan-500' : 'text-orange-500'
              }`}>
                🔄 {beliefFlip.flipType.toUpperCase()} FLIP DETECTED
              </div>
              <div className={`text-xs mt-1 ${
                beliefFlip.flipType === 'bullish' ? 'text-cyan-400/80' : 'text-orange-400/80'
              }`}>
                Inflection point detected - market momentum is {beliefFlip.flipType === 'bullish' ? 'accelerating upward' : 'reversing downward'}.
                Strength: {(beliefFlip.strength * 100).toFixed(3)}pp/d²
              </div>
            </div>
          </div>
        )}

        {/* Fragility Warning Flag */}
        {isFragile && (
          <div
            className="flex items-center gap-3 bg-amber-950/20 border border-amber-900/50 rounded-lg px-4 py-3"
            title="Probability is rising, but consensus is breaking. This pattern often precedes volatility."
          >
            <TriangleAlert className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <div className="font-mono text-sm text-amber-500 uppercase tracking-wider">
                ⚠ FRAGILE CONVICTION DETECTED
              </div>
              <div className="text-xs text-amber-400/80 mt-1">
                Probability is rising, but consensus is breaking. This pattern often precedes volatility.
              </div>
            </div>
          </div>
        )}

        <ChartSectionWrapper data={signal} />

        <div className="text-sm text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
          <strong className="text-zinc-400">Regime Risk Analysis:</strong> {stress.rationale}
        </div>

        {/* Phase 4: Raw Data Inspector */}
        <RawDataInspector data={signal} />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-lg">Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {event.outcomes.map((outcome, index) => (
                  <li key={outcome.key} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500 w-6">
                      {index + 1}.
                    </span>
                    <span className="text-zinc-300">{outcome.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-lg">Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {event.sources && event.sources.length > 0 ? (
                <ul className="space-y-2">
                  {event.sources.map((source, index) => (
                    <li key={index}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="text-sm">{source.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">No sources available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-lg">Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            {event.contributors && event.contributors.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {event.contributors.map((contributor, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-zinc-300">{contributor.name}</span>
                    {contributor.handle && (
                      <span className="text-zinc-500 ml-1">{contributor.handle}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No contributors listed</p>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-zinc-800" />

        <div className="text-center">
          <p className="text-zinc-400 mb-4">
            Want to improve this sensor? Contribute updated probability data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild>
              <Link href="/contribute">How to Contribute</Link>
            </Button>
            <code className="text-xs text-zinc-500 bg-zinc-900 px-3 py-2 rounded">
              data/signals/{slug}.csv
            </code>
          </div>
        </div>

      </div>
    </div>
  );
}
