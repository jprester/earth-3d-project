/**
 * Game state type definitions
 */

import type { FleetResources } from './Resources';

// Game phases (1-5)
export type GamePhaseId = 1 | 2 | 3 | 4 | 5;

export interface GamePhase {
  id: GamePhaseId;
  name: string;
  description: string;
}

export const GAME_PHASES: Record<GamePhaseId, GamePhase> = {
  1: {
    id: 1,
    name: 'First Contact',
    description: 'Initial reconnaissance and intelligence gathering',
  },
  2: {
    id: 2,
    name: 'Infiltration',
    description: 'Covert operations and strategic positioning',
  },
  3: {
    id: 3,
    name: 'Shock & Awe',
    description: 'Coordinated strikes on key infrastructure',
  },
  4: {
    id: 4,
    name: 'Occupation',
    description: 'Territory control and resistance suppression',
  },
  5: {
    id: 5,
    name: 'Consolidation',
    description: 'Final conquest and planetary control',
  },
};

// Game time tracking
export interface GameTime {
  elapsedMs: number; // Total milliseconds since game start
  day: number; // Current day (1-indexed)
  hour: number; // Hour of day (0-23)
  minute: number; // Minute of hour (0-59)
}

// Game run state
export type GameRunState = 'running' | 'paused' | 'game_over_win' | 'game_over_loss';

// Speed multiplier presets
export type SpeedMultiplier = 1 | 100 | 500 | 1440;

export const SPEED_PRESETS: SpeedMultiplier[] = [1, 100, 500, 1440];

export const SPEED_LABELS: Record<SpeedMultiplier, string> = {
  1: '1x',
  100: '100x',
  500: '500x',
  1440: '24h/s',
};

// Game statistics tracking
export interface GameStats {
  locationsAnalyzed: number;
  locationsNeutralized: number;
  locationsOccupied: number;
  nationsDefeated: number;
  totalCasualties: number;
  dronesLost: number;
  energySpent: number;
  kineticRodsUsed: number;
}

export const DEFAULT_GAME_STATS: GameStats = {
  locationsAnalyzed: 0,
  locationsNeutralized: 0,
  locationsOccupied: 0,
  nationsDefeated: 0,
  totalCasualties: 0,
  dronesLost: 0,
  energySpent: 0,
  kineticRodsUsed: 0,
};

// Serializable game state for save/load
export interface GameState {
  version: number;
  savedAt: number; // Timestamp
  phase: GamePhaseId;
  runState: GameRunState;
  time: GameTime;
  resources: FleetResources;
  stats: GameStats;
  worldState: {
    locations: Record<string, LocationSaveState>;
    nations: Record<string, NationSaveState>;
  };
}

// Minimal location state for saves
export interface LocationSaveState {
  status: string;
  controlledBy: string;
  stability: number;
}

// Minimal nation state for saves
export interface NationSaveState {
  government: string;
  militaryStrength: number;
  stability: number;
  resistance: number;
  relations: string;
}

export const GAME_STATE_VERSION = 1;
