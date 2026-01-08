import { Elysia, t } from 'elysia';
import type { Prediction, PredictionSubmission, PredictionResponse, AggregatedSignal } from '@eventhorizon/shared';

// In-memory store - will be replaced with database
const predictions: Prediction[] = [];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function aggregateSignal(eventId: string): AggregatedSignal | null {
  const eventPredictions = predictions.filter(p => p.eventId === eventId);
  if (eventPredictions.length === 0) return null;

  const totalStake = eventPredictions.reduce((sum, p) => sum + (p.stake || 1), 0);

  // Stake-weighted probability
  const weightedProb = eventPredictions.reduce((sum, p) => {
    const weight = (p.stake || 1) / totalStake;
    return sum + p.probability * weight;
  }, 0);

  // Average confidence
  const avgConfidence = eventPredictions.reduce((sum, p) => sum + p.confidence, 0) / eventPredictions.length;

  return {
    eventId,
    probability: weightedProb,
    confidence: avgConfidence,
    contributorCount: eventPredictions.length,
    totalStake,
    updatedAt: Date.now(),
  };
}

export const predictionsRoutes = new Elysia({ prefix: '/predictions' })
  .post(
    '/',
    ({ body }): PredictionResponse => {
      const prediction: Prediction = {
        id: generateId(),
        traderId: 'anonymous', // TODO: Auth
        submittedAt: Date.now(),
        ...body,
      };
      predictions.push(prediction);
      return { data: prediction, timestamp: Date.now() };
    },
    {
      body: t.Object({
        eventId: t.String(),
        probability: t.Number({ minimum: 0, maximum: 1 }),
        confidence: t.Number({ minimum: 0, maximum: 1 }),
        stake: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )
  .get('/', () => ({
    data: predictions,
    timestamp: Date.now(),
  }))
  .get('/signals', () => {
    const eventIds = [...new Set(predictions.map(p => p.eventId))];
    const signals = eventIds
      .map(aggregateSignal)
      .filter((s): s is AggregatedSignal => s !== null);
    return { data: signals, timestamp: Date.now() };
  })
  .get('/signals/:eventId', ({ params: { eventId } }) => {
    const signal = aggregateSignal(eventId);
    if (!signal) {
      return { error: 'No predictions for this event', code: 'NOT_FOUND', timestamp: Date.now() };
    }
    return { data: signal, timestamp: Date.now() };
  });
