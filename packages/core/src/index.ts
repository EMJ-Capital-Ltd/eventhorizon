/**
 * EventHorizon
 *
 * A belief-risk sensing layer that detects regime shifts before price.
 * Built for governance, not trading.
 *
 * @packageDocumentation
 */

// Core interfaces
export * from './interfaces/index.js';

// Evaluation types
export * from './evaluation/types.js';

// Reference sensor
export { velocitySimpleSensor } from './sensors/velocity-simple/index.js';
