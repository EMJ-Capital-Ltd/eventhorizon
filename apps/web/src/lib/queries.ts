import { queryOptions } from '@tanstack/react-query'
import type {
  Event,
  EventsResponse,
  Market,
  MarketsResponse,
  MarketSignal,
  MarketSignalsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from '@eventhorizon/shared'
import { calculateStressIndex } from '@eventhorizon/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Legacy events (seed data)
export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${API_URL}/events`)
  if (!response.ok) {
    throw new Error('Failed to fetch events')
  }
  const data: EventsResponse = await response.json()
  return data.data
}

export const eventsQueryOptions = queryOptions({
  queryKey: ['events'],
  queryFn: fetchEvents,
})

// Markets from Dome
export async function fetchMarkets(options?: {
  platform?: 'polymarket' | 'kalshi'
  limit?: number
}): Promise<Market[]> {
  const params = new URLSearchParams()
  if (options?.platform) params.set('platform', options.platform)
  if (options?.limit) params.set('limit', String(options.limit))

  const url = `${API_URL}/markets${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch markets')
  }

  const data: MarketsResponse = await response.json()
  return data.data
}

export const marketsQueryOptions = (options?: { platform?: 'polymarket' | 'kalshi'; limit?: number }) =>
  queryOptions({
    queryKey: ['markets', options],
    queryFn: () => fetchMarkets(options),
  })

// Single market with history
export async function fetchMarket(marketId: string): Promise<Market> {
  const response = await fetch(`${API_URL}/markets/${marketId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch market')
  }

  const data = await response.json()
  return data.data
}

export const marketQueryOptions = (marketId: string) =>
  queryOptions({
    queryKey: ['market', marketId],
    queryFn: () => fetchMarket(marketId),
    enabled: !!marketId,
  })

// Aggregated signals
export async function fetchSignals(): Promise<MarketSignal[]> {
  const response = await fetch(`${API_URL}/market-predictions/signals`)

  if (!response.ok) {
    throw new Error('Failed to fetch signals')
  }

  const data: MarketSignalsResponse = await response.json()
  return data.data
}

export const signalsQueryOptions = queryOptions({
  queryKey: ['signals'],
  queryFn: fetchSignals,
})

// Leaderboard
export async function fetchLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const response = await fetch(`${API_URL}/leaderboard?limit=${limit}`)

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard')
  }

  const data: LeaderboardResponse = await response.json()
  return data.data
}

export const leaderboardQueryOptions = (limit: number = 50) =>
  queryOptions({
    queryKey: ['leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
  })

// My predictions (requires auth token)
export async function fetchMyPredictions(token: string) {
  const response = await fetch(`${API_URL}/market-predictions/mine`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch predictions')
  }

  const data = await response.json()
  return data.data
}

// Submit prediction
export async function submitPrediction(
  token: string,
  prediction: {
    marketId: string
    platform: 'polymarket' | 'kalshi'
    probability: number
    confidence: number
    stake: number
  }
) {
  const response = await fetch(`${API_URL}/market-predictions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prediction),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to submit prediction')
  }

  return response.json()
}

export { calculateStressIndex }
