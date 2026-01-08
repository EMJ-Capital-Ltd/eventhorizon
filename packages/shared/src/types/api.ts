import type { Event } from './events.js';

// API Response types
export interface ApiResponse<T> {
  data: T;
  timestamp: number;
}

export interface ApiError {
  error: string;
  code: string;
  timestamp: number;
}

// Events API
export type EventsResponse = ApiResponse<Event[]>;
export type EventResponse = ApiResponse<Event>;

// Predictions API
export interface PredictionSubmission {
  eventId: string;
  probability: number;
  confidence: number;
  stake?: number;
}

export interface Prediction extends PredictionSubmission {
  id: string;
  traderId: string;
  submittedAt: number;
}

export type PredictionResponse = ApiResponse<Prediction>;
export type PredictionsResponse = ApiResponse<Prediction[]>;

// Aggregated signal
export interface AggregatedSignal {
  eventId: string;
  probability: number;
  confidence: number;
  contributorCount: number;
  totalStake: number;
  updatedAt: number;
}

export type SignalResponse = ApiResponse<AggregatedSignal>;
export type SignalsResponse = ApiResponse<AggregatedSignal[]>;
