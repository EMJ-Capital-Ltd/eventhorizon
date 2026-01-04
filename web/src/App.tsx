import { EventCard } from './components/EventCard';
import { StressIndicator } from './components/StressIndicator';
import { VelocitySparkline } from './components/VelocitySparkline';
import { events, calculateStressIndex } from './data/events';
import './App.css';

function App() {
  const stressIndex = calculateStressIndex(events);
  const lastUpdated = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-event">Event</span>
            <span className="logo-horizon">Horizon</span>
          </h1>
          <span className="tagline">Belief dynamics, not trading signals</span>
        </div>
        <div className="header-right">
          <span className="last-updated">Updated {lastUpdated}</span>
        </div>
      </header>

      <main className="main">
        <section className="stress-section">
          <StressIndicator value={stressIndex} />
        </section>

        <section className="events-section">
          <div className="section-header">
            <h2>ACTIVE EVENTS</h2>
            <span className="event-count">{events.length} tracked</span>
          </div>
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>

        <section className="velocity-section">
          <VelocitySparkline events={events} />
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-statement">
            EventHorizon measures how beliefs change. We do not trade, execute, or recommend actions.
          </p>
          <div className="footer-links">
            <a href="https://github.com/EMJ-Capital-Ltd/eventhorizon" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span className="divider">|</span>
            <a href="https://github.com/EMJ-Capital-Ltd/eventhorizon/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
              Contribute a Sensor
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
