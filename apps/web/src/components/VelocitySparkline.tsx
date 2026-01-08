import type { Event } from '@eventhorizon/shared';

interface VelocitySparklineProps {
  events: Event[];
}

export function VelocitySparkline({ events }: VelocitySparklineProps) {
  // Sort by absolute velocity
  const sorted = [...events].sort((a, b) => Math.abs(b.velocity) - Math.abs(a.velocity));

  const maxVelocity = Math.max(...events.map(e => Math.abs(e.velocity)));

  return (
    <div className="velocity-panel">
      <h3 className="panel-title">VELOCITY RANKINGS</h3>
      <div className="velocity-list">
        {sorted.map((event) => {
          const width = (Math.abs(event.velocity) / maxVelocity) * 100;
          const isPositive = event.velocity >= 0;

          return (
            <div key={event.id} className="velocity-item">
              <span className="velocity-name">{event.title.slice(0, 30)}...</span>
              <div className="velocity-bar-container">
                <div
                  className={`velocity-bar ${isPositive ? 'positive' : 'negative'}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className={`velocity-value ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{(event.velocity * 100).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
