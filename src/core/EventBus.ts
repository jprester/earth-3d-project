/**
 * Event bus for decoupled communication between game systems
 */

import type { Coordinates, CameraLevelName } from '../types';

// Define all game events with their payload types
export interface GameEvents {
  'camera:zoom': { level: CameraLevelName; distance: number };
  'camera:focus': { coordinates: Coordinates; locationId?: string };
  'marker:hover': { locationId: string | null };
  'marker:select': { locationId: string | null };
  'location:click': { locationId: string; coordinates: Coordinates };
  'globe:click': { coordinates: Coordinates };
}

export type EventCallback<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback<unknown>>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback<unknown>);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event for a single emission only
   */
  once<K extends keyof GameEvents>(
    event: K,
    callback: EventCallback<GameEvents[K]>
  ): void {
    const wrappedCallback: EventCallback<GameEvents[K]> = (payload) => {
      this.off(event, wrappedCallback);
      callback(payload);
    };
    this.on(event, wrappedCallback);
  }

  /**
   * Remove all listeners (for cleanup)
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get the number of listeners for an event (useful for debugging)
   */
  listenerCount(event: keyof GameEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Singleton instance for global access
export const eventBus = new EventBus();
