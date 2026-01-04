import { BeliefChart } from './BeliefChart';
import type { Event } from '../data/events';

interface EventCardProps {
  event: Event;
}

const categoryColors: Record<string, string> = {
  regulatory: '#a78bfa',
  macro: '#38bdf8',
  crypto: '#fbbf24',
  geopolitical: '#f87171',
};

const regimeLabels: Record<string, { label: string; color: string }> = {
  stable: { label: 'STABLE', color: '#22c55e' },
  transitioning: { label: 'TRANSITIONING', color: '#eab308' },
  volatile: { label: 'VOLATILE', color: '#f97316' },
  tail: { label: 'TAIL EVENT', color: '#ef4444' },
};

export function EventCard({ event }: EventCardProps) {
  const probChange = event.currentProbability - event.previousProbability;
  const probChangePercent = (probChange * 100).toFixed(1);
  const isPositive = probChange >= 0;

  const velocityDisplay = (event.velocity * 100).toFixed(2);
  const regime = regimeLabels[event.regime];

  const chartColor = categoryColors[event.category] || '#22d3ee';

  return (
    <div className="event-card">
      <div className="event-header">
        <span
          className="event-category"
          style={{ backgroundColor: `${categoryColors[event.category]}20`, color: categoryColors[event.category] }}
        >
          {event.category.toUpperCase()}
        </span>
        <span
          className="event-regime"
          style={{ color: regime.color }}
        >
          {regime.label}
        </span>
      </div>

      <h3 className="event-title">{event.title}</h3>

      <div className="event-probability">
        <span className="prob-value">
          {(event.currentProbability * 100).toFixed(0)}%
        </span>
        <span className={`prob-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(Number(probChangePercent))}%
        </span>
      </div>

      <div className="event-chart">
        <BeliefChart data={event.trajectory} color={chartColor} />
      </div>

      <div className="event-metrics">
        <div className="metric">
          <span className="metric-label">Velocity</span>
          <span className={`metric-value ${event.velocity >= 0 ? 'positive' : 'negative'}`}>
            {event.velocity >= 0 ? '+' : ''}{velocityDisplay}%/hr
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Liquidity</span>
          <span className="metric-value">
            ${(event.liquidity / 1_000_000).toFixed(2)}M
          </span>
        </div>
      </div>
    </div>
  );
}
