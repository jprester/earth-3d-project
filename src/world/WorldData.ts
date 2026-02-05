/**
 * World data state management
 */

import type {
  StrategicLocation,
  LocationState,
  LocationStatus,
  LocationType,
  Nation,
  NationState,
  Coordinates,
} from '../types';
import { greatCircleDistance } from './GeoUtils';

/**
 * Convert a StrategicLocation to LocationState with default runtime values
 */
function initLocationState(location: StrategicLocation): LocationState {
  return {
    ...location,
    status: 'analyzed',
    controlledBy: 'human',
    stability: 100,
  };
}

/**
 * Convert a Nation to NationState with default runtime values
 */
function initNationState(nation: Nation): NationState {
  return {
    ...nation,
    government: 'functional',
    militaryStrength: nation.initialMilitaryStrength,
    resistance: 0,
    stability: 100,
    relations: 'hostile',
  };
}

export class WorldData {
  private locations: Map<string, LocationState>;
  private nations: Map<string, NationState>;

  constructor() {
    this.locations = new Map();
    this.nations = new Map();
  }

  /**
   * Initialize with loaded data
   */
  initialize(locations: StrategicLocation[], nations: Nation[]): void {
    this.locations.clear();
    this.nations.clear();

    for (const location of locations) {
      this.locations.set(location.id, initLocationState(location));
    }

    for (const nation of nations) {
      this.nations.set(nation.id, initNationState(nation));
    }
  }

  /**
   * Get location by ID
   */
  getLocation(id: string): LocationState | undefined {
    return this.locations.get(id);
  }

  /**
   * Get all locations
   */
  getAllLocations(): LocationState[] {
    return Array.from(this.locations.values());
  }

  /**
   * Get locations by type
   */
  getLocationsByType(type: LocationType): LocationState[] {
    return this.getAllLocations().filter((loc) => loc.type === type);
  }

  /**
   * Get locations by status
   */
  getLocationsByStatus(status: LocationStatus): LocationState[] {
    return this.getAllLocations().filter((loc) => loc.status === status);
  }

  /**
   * Get locations by nation
   */
  getLocationsByNation(nationId: string): LocationState[] {
    return this.getAllLocations().filter((loc) => loc.nation === nationId);
  }

  /**
   * Get locations within radius of a point
   */
  getLocationsInRadius(center: Coordinates, radiusKm: number): LocationState[] {
    return this.getAllLocations().filter((loc) => {
      const distance = greatCircleDistance(center, loc.coordinates);
      return distance <= radiusKm;
    });
  }

  /**
   * Get locations by control status
   */
  getLocationsByControl(
    control: 'human' | 'alien' | 'contested' | 'destroyed'
  ): LocationState[] {
    return this.getAllLocations().filter((loc) => loc.controlledBy === control);
  }

  /**
   * Get nation by ID
   */
  getNation(id: string): NationState | undefined {
    return this.nations.get(id);
  }

  /**
   * Get all nations
   */
  getAllNations(): NationState[] {
    return Array.from(this.nations.values());
  }

  /**
   * Get nuclear-capable nations
   */
  getNuclearNations(): NationState[] {
    return this.getAllNations().filter((nation) => nation.isNuclear);
  }

  /**
   * Update location state
   */
  updateLocation(id: string, updates: Partial<LocationState>): void {
    const location = this.locations.get(id);
    if (location) {
      Object.assign(location, updates);
    }
  }

  /**
   * Update nation state
   */
  updateNation(id: string, updates: Partial<NationState>): void {
    const nation = this.nations.get(id);
    if (nation) {
      Object.assign(nation, updates);
    }
  }

  /**
   * Get total nuclear capacity across all locations
   */
  getTotalNuclearCapacity(): number {
    return this.getAllLocations().reduce((total, loc) => {
      return total + (loc.nuclearCapacity ?? 0);
    }, 0);
  }

  /**
   * Get remaining nuclear capacity (not neutralized)
   */
  getRemainingNuclearCapacity(): number {
    return this.getAllLocations()
      .filter((loc) => loc.status !== 'neutralized' && loc.controlledBy !== 'alien')
      .reduce((total, loc) => {
        return total + (loc.nuclearCapacity ?? 0);
      }, 0);
  }

  /**
   * Get statistics about current world state
   */
  getStatistics(): {
    totalLocations: number;
    byStatus: Record<LocationStatus, number>;
    byControl: Record<string, number>;
    nuclearCapacity: { total: number; remaining: number };
  } {
    const allLocations = this.getAllLocations();

    const byStatus: Record<LocationStatus, number> = {
      unknown: 0,
      detected: 0,
      analyzed: 0,
      targeted: 0,
      neutralized: 0,
      occupied: 0,
      contested: 0,
    };

    const byControl: Record<string, number> = {
      human: 0,
      alien: 0,
      contested: 0,
      destroyed: 0,
    };

    for (const loc of allLocations) {
      byStatus[loc.status]++;
      byControl[loc.controlledBy]++;
    }

    return {
      totalLocations: allLocations.length,
      byStatus,
      byControl,
      nuclearCapacity: {
        total: this.getTotalNuclearCapacity(),
        remaining: this.getRemainingNuclearCapacity(),
      },
    };
  }
}
