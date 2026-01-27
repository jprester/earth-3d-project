/**
 * Game loop with time management
 * 1 real second = 1 game minute at 1x speed (realistic pacing)
 */

import { eventBus } from '../core/EventBus';
import type { GameTime, SpeedMultiplier } from './types';
import { SPEED_PRESETS } from './types';

// Time constants
// At 1x speed: 1 real second = 1 game minute
// So 1 real minute = 1 game hour, 1 real hour = ~2.5 game days
const MS_PER_GAME_MINUTE = 1000; // 1 second real time = 1 game minute at 1x
const MS_PER_GAME_HOUR = MS_PER_GAME_MINUTE * 60; // 60 seconds real time = 1 game hour
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export interface GameLoopOptions {
  initialSpeedMultiplier?: SpeedMultiplier;
}

export class GameLoop {
  private isRunning: boolean = false;
  private speedMultiplier: SpeedMultiplier;
  private gameTime: GameTime;
  private lastTickTime: number = 0;
  private animationFrameId: number | null = null;

  constructor(options: GameLoopOptions = {}) {
    this.speedMultiplier = options.initialSpeedMultiplier ?? 1;
    this.gameTime = {
      elapsedMs: 0,
      day: 1,
      hour: 0,
      minute: 0,
    };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTickTime = performance.now();
    this.tick();

    eventBus.emit('game:started', { time: { ...this.gameTime } });
  }

  /**
   * Pause the game loop
   */
  pause(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    eventBus.emit('game:paused', { time: { ...this.gameTime } });
  }

  /**
   * Resume the game loop
   */
  resume(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTickTime = performance.now();
    this.tick();

    eventBus.emit('game:resumed', { time: { ...this.gameTime } });
  }

  /**
   * Stop the game loop completely
   */
  stop(): void {
    this.pause();
    eventBus.emit('game:stopped', { time: { ...this.gameTime } });
  }

  /**
   * Main tick function - called every animation frame
   */
  private tick(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const realDeltaMs = currentTime - this.lastTickTime;
    this.lastTickTime = currentTime;

    // Calculate game time delta with speed multiplier
    const gameDeltaMs = realDeltaMs * this.speedMultiplier;

    // Update game time
    this.updateGameTime(gameDeltaMs);

    // Emit tick event
    eventBus.emit('game:tick', {
      deltaMs: gameDeltaMs,
      time: { ...this.gameTime },
    });

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  /**
   * Update game time and emit hour/day change events
   */
  private updateGameTime(deltaMs: number): void {
    const previousHour = this.gameTime.hour;
    const previousDay = this.gameTime.day;

    // Add delta to elapsed time
    this.gameTime.elapsedMs += deltaMs;

    // Convert elapsed ms to time components
    // Total game hours = elapsedMs / MS_PER_GAME_HOUR
    const totalGameMinutes = (this.gameTime.elapsedMs / MS_PER_GAME_HOUR) * MINUTES_PER_HOUR;
    const totalGameHours = Math.floor(totalGameMinutes / MINUTES_PER_HOUR);

    this.gameTime.minute = Math.floor(totalGameMinutes % MINUTES_PER_HOUR);
    this.gameTime.hour = totalGameHours % HOURS_PER_DAY;
    this.gameTime.day = Math.floor(totalGameHours / HOURS_PER_DAY) + 1;

    // Emit hour changed event
    if (this.gameTime.hour !== previousHour) {
      eventBus.emit('game:hourChanged', {
        time: { ...this.gameTime },
        previousHour,
      });
    }

    // Emit day changed event
    if (this.gameTime.day !== previousDay) {
      eventBus.emit('game:dayChanged', {
        time: { ...this.gameTime },
        previousDay,
      });
    }
  }

  /**
   * Set speed multiplier
   */
  setSpeedMultiplier(multiplier: SpeedMultiplier): void {
    if (multiplier === this.speedMultiplier) return;

    const previousMultiplier = this.speedMultiplier;
    this.speedMultiplier = multiplier;

    eventBus.emit('game:speedChanged', {
      multiplier,
      previousMultiplier,
    });
  }

  /**
   * Cycle to next speed preset
   */
  cycleSpeed(): SpeedMultiplier {
    const currentIndex = SPEED_PRESETS.indexOf(this.speedMultiplier);
    const nextIndex = (currentIndex + 1) % SPEED_PRESETS.length;
    const nextSpeed = SPEED_PRESETS[nextIndex];
    this.setSpeedMultiplier(nextSpeed);
    return nextSpeed;
  }

  /**
   * Get current game time
   */
  getGameTime(): GameTime {
    return { ...this.gameTime };
  }

  /**
   * Get current speed multiplier
   */
  getSpeedMultiplier(): SpeedMultiplier {
    return this.speedMultiplier;
  }

  /**
   * Check if game loop is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Restore time from saved state
   */
  restoreTime(time: GameTime): void {
    this.gameTime = { ...time };
    eventBus.emit('game:timeRestored', { time: { ...this.gameTime } });
  }

  /**
   * Get formatted time string (HH:MM)
   */
  getFormattedTime(): string {
    const hour = this.gameTime.hour.toString().padStart(2, '0');
    const minute = this.gameTime.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
  }
}
