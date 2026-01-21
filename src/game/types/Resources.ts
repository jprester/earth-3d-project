/**
 * Fleet resource type definitions
 */

// Resource types available to the alien fleet
export type ResourceType = 'energy' | 'kineticRods' | 'drones' | 'personnel';

// Individual resource definition
export interface Resource {
  current: number;
  max: number;
  regenPerHour: number; // Amount regenerated per game hour
  displayName: string;
  icon: string;
  color: string;
}

// All fleet resources
export interface FleetResources {
  energy: Resource;
  kineticRods: Resource;
  drones: Resource;
  personnel: Resource;
}

// Default starting resources
export const DEFAULT_FLEET_RESOURCES: FleetResources = {
  energy: {
    current: 1000,
    max: 1000,
    regenPerHour: 10,
    displayName: 'Energy',
    icon: '⚡',
    color: '#00ffff',
  },
  kineticRods: {
    current: 50,
    max: 100,
    regenPerHour: 0.5,
    displayName: 'Kinetic Rods',
    icon: '🎯',
    color: '#ff4444',
  },
  drones: {
    current: 200,
    max: 500,
    regenPerHour: 2,
    displayName: 'Drones',
    icon: '🛸',
    color: '#88ff88',
  },
  personnel: {
    current: 1000,
    max: 2000,
    regenPerHour: 1,
    displayName: 'Personnel',
    icon: '👽',
    color: '#ffaa00',
  },
};

// Cost definition for actions
export interface ResourceCost {
  energy?: number;
  kineticRods?: number;
  drones?: number;
  personnel?: number;
}

// Result of affordability check
export interface AffordabilityResult {
  canAfford: boolean;
  missing: ResourceCost;
}

// Resource change event payload
export interface ResourceChange {
  type: ResourceType;
  previousValue: number;
  newValue: number;
  delta: number;
  reason: string;
}
