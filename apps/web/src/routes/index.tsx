import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { EventCard } from '../components/EventCard'
import { StressIndicator } from '../components/StressIndicator'
import { VelocitySparkline } from '../components/VelocitySparkline'
import { eventsQueryOptions, calculateStressIndex } from '../lib/queries'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: events, isLoading, error } = useQuery(eventsQueryOptions)

  if (isLoading) {
    return (
      <main className="main">
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading events...</div>
      </main>
    )
  }

  if (error || !events) {
    return (
      <main className="main">
        <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
          Failed to load events
        </div>
      </main>
    )
  }

  const stressIndex = calculateStressIndex(events)

  return (
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
  )
}
