/**
 * Resource manager for tracking fleet resources
 */

import { eventBus } from '../core/EventBus';
import type {
  FleetResources,
  ResourceType,
  ResourceCost,
  AffordabilityResult,
  ResourceChange,
} from './types';
import { DEFAULT_FLEET_RESOURCES } from './types';

export class ResourceManager {
  private resources: FleetResources;
  private boundOnHourChanged: () => void;

  constructor(initialResources?: Partial<FleetResources>) {
    // Deep clone default resources and merge with initial
    this.resources = this.cloneResources(DEFAULT_FLEET_RESOURCES);

    if (initialResources) {
      for (const key of Object.keys(initialResources) as ResourceType[]) {
        if (initialResources[key]) {
          this.resources[key] = { ...this.resources[key], ...initialResources[key] };
        }
      }
    }

    // Bind hour change listener for regeneration
    this.boundOnHourChanged = this.onHourChanged.bind(this);
    eventBus.on('game:hourChanged', this.boundOnHourChanged);
  }

  /**
   * Deep clone resources object
   */
  private cloneResources(resources: FleetResources): FleetResources {
    return {
      energy: { ...resources.energy },
      kineticRods: { ...resources.kineticRods },
      drones: { ...resources.drones },
      personnel: { ...resources.personnel },
    };
  }

  /**
   * Handle hour change - regenerate resources
   */
  private onHourChanged(): void {
    const changes: ResourceChange[] = [];

    for (const type of Object.keys(this.resources) as ResourceType[]) {
      const resource = this.resources[type];

      if (resource.regenPerHour > 0 && resource.current < resource.max) {
        const previousValue = resource.current;
        const newValue = Math.min(resource.current + resource.regenPerHour, resource.max);
        const delta = newValue - previousValue;

        if (delta > 0) {
          resource.current = newValue;
          changes.push({
            type,
            previousValue,
            newValue,
            delta,
            reason: 'regeneration',
          });
        }
      }
    }

    if (changes.length > 0) {
      eventBus.emit('resources:regenerated', { changes });
      eventBus.emit('resources:changed', {
        resources: this.cloneResources(this.resources),
        changes,
      });
    }
  }

  /**
   * Check if a cost can be afforded
   */
  canAfford(cost: ResourceCost): AffordabilityResult {
    const missing: ResourceCost = {};
    let canAfford = true;

    for (const type of Object.keys(cost) as ResourceType[]) {
      const required = cost[type];
      if (required && required > 0) {
        const available = this.resources[type].current;
        if (available < required) {
          canAfford = false;
          missing[type] = required - available;
        }
      }
    }

    return { canAfford, missing };
  }

  /**
   * Spend resources if affordable
   */
  spend(cost: ResourceCost, reason: string = 'action'): boolean {
    const affordability = this.canAfford(cost);

    if (!affordability.canAfford) {
      eventBus.emit('resources:insufficientFunds', {
        required: cost,
        available: this.cloneResources(this.resources),
      });
      return false;
    }

    const changes: ResourceChange[] = [];

    for (const type of Object.keys(cost) as ResourceType[]) {
      const amount = cost[type];
      if (amount && amount > 0) {
        const previousValue = this.resources[type].current;
        const newValue = previousValue - amount;

        this.resources[type].current = newValue;
        changes.push({
          type,
          previousValue,
          newValue,
          delta: -amount,
          reason,
        });
      }
    }

    eventBus.emit('resources:spent', { cost, reason });
    eventBus.emit('resources:changed', {
      resources: this.cloneResources(this.resources),
      changes,
    });

    return true;
  }

  /**
   * Add resources (from captures, events, etc.)
   */
  add(gains: Partial<Record<ResourceType, number>>, reason: string = 'gain'): void {
    const changes: ResourceChange[] = [];

    for (const type of Object.keys(gains) as ResourceType[]) {
      const amount = gains[type];
      if (amount && amount > 0) {
        const resource = this.resources[type];
        const previousValue = resource.current;
        const newValue = Math.min(previousValue + amount, resource.max);
        const actualDelta = newValue - previousValue;

        if (actualDelta > 0) {
          resource.current = newValue;
          changes.push({
            type,
            previousValue,
            newValue,
            delta: actualDelta,
            reason,
          });
        }
      }
    }

    if (changes.length > 0) {
      eventBus.emit('resources:gained', { gains, reason });
      eventBus.emit('resources:changed', {
        resources: this.cloneResources(this.resources),
        changes,
      });
    }
  }

  /**
   * Get current value of a specific resource
   */
  getResource(type: ResourceType): number {
    return this.resources[type].current;
  }

  /**
   * Get all resources (readonly clone)
   */
  getResources(): FleetResources {
    return this.cloneResources(this.resources);
  }

  /**
   * Set resources from saved state
   */
  setResources(resources: FleetResources): void {
    this.resources = this.cloneResources(resources);
    eventBus.emit('resources:changed', {
      resources: this.cloneResources(this.resources),
      changes: [],
    });
  }

  /**
   * Reset to default resources
   */
  reset(): void {
    this.resources = this.cloneResources(DEFAULT_FLEET_RESOURCES);
    eventBus.emit('resources:changed', {
      resources: this.cloneResources(this.resources),
      changes: [],
    });
  }

  /**
   * Cleanup
   */
  dispose(): void {
    eventBus.off('game:hourChanged', this.boundOnHourChanged);
  }
}
