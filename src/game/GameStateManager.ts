/**
 * Game state manager with save/load functionality
 */

import { eventBus } from '../core/EventBus';
import type { WorldData } from '../world/WorldData';
import type {
  GameState,
  GamePhaseId,
  GameRunState,
  GameTime,
  GameStats,
  FleetResources,
  LocationSaveState,
  NationSaveState,
} from './types';
import {
  GAME_STATE_VERSION,
  GAME_PHASES,
  DEFAULT_GAME_STATS,
} from './types';

const SAVE_KEY_PREFIX = 'hegemony_save_';
const DEFAULT_SLOT = 'autosave';

export interface GameStateManagerOptions {
  worldData: WorldData;
}

export class GameStateManager {
  private worldData: WorldData;
  private currentPhase: GamePhaseId = 1;
  private runState: GameRunState = 'paused';
  private stats: GameStats;

  constructor(options: GameStateManagerOptions) {
    this.worldData = options.worldData;
    this.stats = { ...DEFAULT_GAME_STATS };
  }

  /**
   * Get current game phase
   */
  getCurrentPhase(): GamePhaseId {
    return this.currentPhase;
  }

  /**
   * Get current phase info
   */
  getCurrentPhaseInfo() {
    return GAME_PHASES[this.currentPhase];
  }

  /**
   * Set game phase
   */
  setPhase(phase: GamePhaseId): void {
    if (phase === this.currentPhase) return;

    const previousPhase = this.currentPhase;
    this.currentPhase = phase;

    eventBus.emit('game:phaseChanged', { phase, previousPhase });
  }

  /**
   * Get current run state
   */
  getRunState(): GameRunState {
    return this.runState;
  }

  /**
   * Set run state
   */
  setRunState(state: GameRunState): void {
    if (state === this.runState) return;

    const previousState = this.runState;
    this.runState = state;

    eventBus.emit('game:runStateChanged', { state, previousState });
  }

  /**
   * Get game stats
   */
  getStats(): GameStats {
    return { ...this.stats };
  }

  /**
   * Update game stats
   */
  updateStats(updates: Partial<GameStats>): void {
    this.stats = { ...this.stats, ...updates };
    eventBus.emit('game:statsUpdated', { stats: { ...this.stats } });
  }

  /**
   * Increment a stat
   */
  incrementStat(stat: keyof GameStats, amount: number = 1): void {
    this.stats[stat] += amount;
    eventBus.emit('game:statsUpdated', { stats: { ...this.stats } });
  }

  /**
   * Save game to localStorage
   */
  saveGame(gameTime: GameTime, resources: FleetResources, slot: string = DEFAULT_SLOT): boolean {
    try {
      // Serialize world state
      const worldState = this.serializeWorldState();

      const state: GameState = {
        version: GAME_STATE_VERSION,
        savedAt: Date.now(),
        phase: this.currentPhase,
        runState: this.runState,
        time: gameTime,
        resources,
        stats: { ...this.stats },
        worldState,
      };

      const key = SAVE_KEY_PREFIX + slot;
      localStorage.setItem(key, JSON.stringify(state));

      eventBus.emit('game:saved', { slot, timestamp: state.savedAt });
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game from localStorage
   */
  loadGame(slot: string = DEFAULT_SLOT): GameState | null {
    try {
      const key = SAVE_KEY_PREFIX + slot;
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const state = JSON.parse(data) as GameState;

      // Version check
      if (state.version !== GAME_STATE_VERSION) {
        console.warn('Save game version mismatch, may have compatibility issues');
      }

      // Restore state
      this.currentPhase = state.phase;
      this.runState = state.runState;
      this.stats = { ...state.stats };

      // Restore world state
      this.restoreWorldState(state.worldState);

      eventBus.emit('game:loaded', { slot, time: state.time });
      return state;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if a save exists
   */
  hasSaveGame(slot: string = DEFAULT_SLOT): boolean {
    const key = SAVE_KEY_PREFIX + slot;
    return localStorage.getItem(key) !== null;
  }

  /**
   * Delete a save
   */
  deleteSave(slot: string = DEFAULT_SLOT): void {
    const key = SAVE_KEY_PREFIX + slot;
    localStorage.removeItem(key);
  }

  /**
   * Get list of all save slots
   */
  getSaveSlots(): string[] {
    const slots: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SAVE_KEY_PREFIX)) {
        slots.push(key.slice(SAVE_KEY_PREFIX.length));
      }
    }
    return slots;
  }

  /**
   * Reset game state
   */
  reset(): void {
    this.currentPhase = 1;
    this.runState = 'paused';
    this.stats = { ...DEFAULT_GAME_STATS };
    eventBus.emit('game:reset', {});
  }

  /**
   * Serialize world state for saving
   */
  private serializeWorldState(): {
    locations: Record<string, LocationSaveState>;
    nations: Record<string, NationSaveState>;
  } {
    const locations: Record<string, LocationSaveState> = {};
    const nations: Record<string, NationSaveState> = {};

    // Serialize locations
    for (const location of this.worldData.getAllLocations()) {
      locations[location.id] = {
        status: location.status,
        controlledBy: location.controlledBy,
        stability: location.stability,
      };
    }

    // Serialize nations
    for (const nation of this.worldData.getAllNations()) {
      nations[nation.id] = {
        government: nation.government,
        militaryStrength: nation.militaryStrength,
        stability: nation.stability,
        resistance: nation.resistance,
        relations: nation.relations,
      };
    }

    return { locations, nations };
  }

  /**
   * Restore world state from save
   */
  private restoreWorldState(worldState: {
    locations: Record<string, LocationSaveState>;
    nations: Record<string, NationSaveState>;
  }): void {
    // Restore locations
    for (const [id, state] of Object.entries(worldState.locations)) {
      const location = this.worldData.getLocation(id);
      if (location) {
        location.status = state.status as typeof location.status;
        location.controlledBy = state.controlledBy as typeof location.controlledBy;
        location.stability = state.stability;
      }
    }

    // Restore nations
    for (const [id, state] of Object.entries(worldState.nations)) {
      const nation = this.worldData.getNation(id);
      if (nation) {
        nation.government = state.government as typeof nation.government;
        nation.militaryStrength = state.militaryStrength;
        nation.stability = state.stability;
        nation.resistance = state.resistance;
        nation.relations = state.relations as typeof nation.relations;
      }
    }
  }

  /**
   * Check if phase should transition based on world state
   * (Can be expanded with more complex logic)
   */
  checkPhaseTransition(): GamePhaseId | null {
    const locations = this.worldData.getAllLocations();
    const nations = this.worldData.getAllNations();

    const analyzedCount = locations.filter((l) => l.status !== 'unknown').length;
    const neutralizedCount = locations.filter(
      (l) => l.status === 'neutralized' || l.status === 'occupied'
    ).length;
    const occupiedCount = locations.filter((l) => l.status === 'occupied').length;
    const defeatedNations = nations.filter((n) => n.government === 'collapsed' || n.government === 'occupied').length;

    // Phase transition conditions
    if (this.currentPhase === 1 && analyzedCount >= 10) {
      return 2; // Move to Infiltration
    }
    if (this.currentPhase === 2 && neutralizedCount >= 5) {
      return 3; // Move to Shock & Awe
    }
    if (this.currentPhase === 3 && occupiedCount >= 10) {
      return 4; // Move to Occupation
    }
    if (this.currentPhase === 4 && defeatedNations >= nations.length * 0.75) {
      return 5; // Move to Consolidation
    }

    return null;
  }

  /**
   * Check win/loss conditions
   */
  checkGameOver(): GameRunState | null {
    const nations = this.worldData.getAllNations();
    const defeatedNations = nations.filter((n) => n.government === 'collapsed' || n.government === 'occupied').length;

    // Win condition: All nations defeated
    if (defeatedNations === nations.length) {
      return 'game_over_win';
    }

    // Loss conditions could be added here
    // e.g., if alien resources drop to zero, if too much time passes, etc.

    return null;
  }
}
