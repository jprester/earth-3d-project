/**
 * Scenario and event types for the invasion narrative
 */

import type { LocationStatus } from '../../types';

// Time in the scenario (game hours from start)
export type ScenarioTime = number;

// Speed multipliers for time progression
// At base speed (1): 1 real second = 1 game minute
// Real-time (REALTIME_SPEED): 1 real second = 1 game second
export const REALTIME_SPEED = 1 / 60;
export type SpeedMultiplier = number;
export const SPEED_PRESETS: SpeedMultiplier[] = [REALTIME_SPEED, 1, 2, 5, 10, 20];

const rt = REALTIME_SPEED;
export const SPEED_LABELS: Record<number, string> = {
  [rt]: 'Real',
  1: '1x',
  2: '2x',
  5: '5x',
  10: '10x',
  20: '20x',
};

// Game time representation
export interface GameTime {
  elapsedMs: number;
  day: number;
  hour: number;
  minute: number;
}

// Types of scenario events
export type ScenarioEventType =
  | 'attack'           // Attack a location
  | 'hack'             // Cyber attack / disable
  | 'occupy'           // Take control of location
  | 'destroy'          // Completely destroy
  | 'human_response'   // Human military response
  | 'civilian'         // Civilian event (evacuation, panic)
  | 'narrative';       // Pure story beat, no location change

// Event effect on a location
export interface LocationEffect {
  locationId: string;
  newStatus?: LocationStatus;
  newControlledBy?: 'human' | 'alien' | 'contested' | 'destroyed';
  stabilityChange?: number;  // Delta to apply
}

// A single scenario event
export interface ScenarioEvent {
  id: string;
  time: ScenarioTime;            // When to trigger (in game hours)
  type: ScenarioEventType;

  // What happens
  locationId?: string;           // Primary location (optional for narrative events)
  effect?: LocationEffect;       // Effect on the location

  // Narrative content
  alienMessage?: string;         // Message for alien command feed
  newsHeadline?: string;         // Message for human news feed
  newsDetail?: string;           // Optional longer description

  // Visual/camera
  focusCamera?: boolean;         // Should camera focus on this location?

  // Metadata
  importance?: 'minor' | 'major' | 'critical';
}

// A complete scenario (invasion timeline)
export interface Scenario {
  id: string;
  name: string;
  description: string;
  events: ScenarioEvent[];

  // Initial state overrides for locations
  initialState?: Record<string, Partial<LocationEffect>>;
}

// Scenario playback state
export interface ScenarioState {
  scenarioId: string;
  currentTime: ScenarioTime;
  completedEventIds: Set<string>;
  isComplete: boolean;
}

// Event payloads for EventBus
export interface ScenarioEventTriggeredPayload {
  event: ScenarioEvent;
  scenarioTime: ScenarioTime;
}

export interface ScenarioCompletePayload {
  scenarioId: string;
  totalEvents: number;
  duration: ScenarioTime;
}
