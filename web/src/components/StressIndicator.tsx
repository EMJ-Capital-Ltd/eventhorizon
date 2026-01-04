interface StressIndicatorProps {
  value: number; // 0-1
}

export function StressIndicator({ value }: StressIndicatorProps) {
  const percentage = value * 100;

  const getColor = () => {
    if (value < 0.25) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' };
    if (value < 0.5) return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' };
    if (value < 0.75) return { main: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
  };

  const getLabel = () => {
    if (value < 0.25) return 'LOW';
    if (value < 0.5) return 'MODERATE';
    if (value < 0.75) return 'ELEVATED';
    return 'HIGH';
  };

  const colors = getColor();

  return (
    <div className="stress-indicator">
      <div className="stress-header">
        <span className="stress-title">BELIEF STRESS INDEX</span>
        <span
          className="stress-label"
          style={{ color: colors.main }}
        >
          {getLabel()}
        </span>
      </div>

      <div className="stress-bar-container">
        <div
          className="stress-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.main,
            boxShadow: `0 0 20px ${colors.glow}`,
          }}
        />
        <div className="stress-bar-markers">
          <span style={{ left: '25%' }} />
          <span style={{ left: '50%' }} />
          <span style={{ left: '75%' }} />
        </div>
      </div>

      <div className="stress-value">
        {(value * 100).toFixed(1)}
      </div>
    </div>
  );
}
