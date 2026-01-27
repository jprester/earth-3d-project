/**
 * ScenarioEngine - Runs scripted invasion scenarios
 *
 * Listens to game time and triggers events when their time arrives.
 * Emits events for UI components to react to.
 */

import { eventBus } from '../core/EventBus';
import type {
  Scenario,
  ScenarioEvent,
  ScenarioState,
  ScenarioTime,
  GameTime,
} from './types';

export interface ScenarioEngineOptions {
  onEventTriggered?: (event: ScenarioEvent) => void;
  onScenarioComplete?: () => void;
}

export class ScenarioEngine {
  private scenario: Scenario | null = null;
  private state: ScenarioState | null = null;
  private options: ScenarioEngineOptions;
  private pendingEvents: ScenarioEvent[] = [];

  constructor(options: ScenarioEngineOptions = {}) {
    this.options = options;

    // Subscribe to game time updates
    eventBus.on('game:tick', this.handleTick.bind(this));
  }

  /**
   * Load a scenario and prepare for playback
   */
  loadScenario(scenario: Scenario): void {
    this.scenario = scenario;
    this.state = {
      scenarioId: scenario.id,
      currentTime: 0,
      completedEventIds: new Set(),
      isComplete: false,
    };

    // Sort events by time and store as pending
    this.pendingEvents = [...scenario.events].sort((a, b) => a.time - b.time);

    console.log(`Scenario loaded: "${scenario.name}" with ${scenario.events.length} events`);

    eventBus.emit('scenario:loaded', {
      scenarioId: scenario.id,
      name: scenario.name,
      totalEvents: scenario.events.length,
    });
  }

  /**
   * Handle game tick - check for events to trigger
   */
  private handleTick({ time }: { time: GameTime }): void {
    if (!this.scenario || !this.state || this.state.isComplete) return;

    // Convert game time to scenario time (hours since start)
    const scenarioTime = this.gameTimeToScenarioTime(time);
    this.state.currentTime = scenarioTime;

    // Check for events that should trigger
    while (this.pendingEvents.length > 0) {
      const nextEvent = this.pendingEvents[0];

      if (nextEvent.time <= scenarioTime) {
        // Remove from pending
        this.pendingEvents.shift();

        // Trigger the event
        this.triggerEvent(nextEvent, scenarioTime);
      } else {
        // No more events ready
        break;
      }
    }

    // Check if scenario is complete
    if (this.pendingEvents.length === 0 && !this.state.isComplete) {
      this.completeScenario();
    }
  }

  /**
   * Convert GameTime to scenario hours
   */
  private gameTimeToScenarioTime(time: GameTime): ScenarioTime {
    // Day 1, Hour 0 = scenario time 0
    return (time.day - 1) * 24 + time.hour + (time.minute / 60);
  }

  /**
   * Trigger a scenario event
   */
  private triggerEvent(event: ScenarioEvent, currentTime: ScenarioTime): void {
    if (!this.state) return;

    console.log(`[${this.formatTime(currentTime)}] Event: ${event.type} - ${event.alienMessage || event.newsHeadline || event.id}`);

    // Mark as completed
    this.state.completedEventIds.add(event.id);

    // Emit event for other systems to react
    eventBus.emit('scenario:eventTriggered', {
      event,
      scenarioTime: currentTime,
    });

    // Callback
    this.options.onEventTriggered?.(event);
  }

  /**
   * Mark scenario as complete
   */
  private completeScenario(): void {
    if (!this.state || !this.scenario) return;

    this.state.isComplete = true;

    console.log(`Scenario "${this.scenario.name}" complete!`);

    eventBus.emit('scenario:complete', {
      scenarioId: this.scenario.id,
      totalEvents: this.scenario.events.length,
      duration: this.state.currentTime,
    });

    this.options.onScenarioComplete?.();
  }

  /**
   * Format scenario time for display
   */
  private formatTime(hours: ScenarioTime): string {
    const day = Math.floor(hours / 24) + 1;
    const hour = Math.floor(hours % 24);
    const minute = Math.floor((hours % 1) * 60);
    return `Day ${day} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * Get current scenario state
   */
  getState(): ScenarioState | null {
    return this.state ? { ...this.state, completedEventIds: new Set(this.state.completedEventIds) } : null;
  }

  /**
   * Get loaded scenario
   */
  getScenario(): Scenario | null {
    return this.scenario;
  }

  /**
   * Get progress (0-1)
   */
  getProgress(): number {
    if (!this.scenario || !this.state) return 0;
    return this.state.completedEventIds.size / this.scenario.events.length;
  }

  /**
   * Get upcoming events (next N)
   */
  getUpcomingEvents(count: number = 3): ScenarioEvent[] {
    return this.pendingEvents.slice(0, count);
  }

  /**
   * Reset scenario to beginning
   */
  reset(): void {
    if (this.scenario) {
      this.loadScenario(this.scenario);
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.scenario = null;
    this.state = null;
    this.pendingEvents = [];
  }
}
