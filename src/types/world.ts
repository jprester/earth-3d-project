/**
 * World data types for strategic locations and nations
 */

// Geographic coordinates
export interface Coordinates {
  lat: number; // -90 to 90
  lng: number; // -180 to 180
}

// Location types matching game design
export type LocationType =
  | 'capital'
  | 'major_city'
  | 'city'
  | 'military_base'
  | 'nuclear_silo'
  | 'naval_base'
  | 'air_base'
  | 'command_center'
  | 'power_plant'
  | 'comm_hub';

// Location status for fog of war and game state
export type LocationStatus =
  | 'unknown'
  | 'detected'
  | 'analyzed'
  | 'targeted'
  | 'neutralized'
  | 'occupied'
  | 'contested';

// Strategic location definition (from JSON data)
export interface StrategicLocation {
  id: string;
  name: string;
  type: LocationType;
  coordinates: Coordinates;
  nation: string;
  population?: number;
  defenseRating?: number;
  nuclearCapacity?: number;
  gridCapacity?: number;
}

// Runtime location state (extends base with dynamic data)
export interface LocationState extends StrategicLocation {
  status: LocationStatus;
  controlledBy: 'human' | 'alien' | 'contested' | 'destroyed';
  stability: number;
  garrison?: string;
}

// Government status for nations
export type GovernmentStatus =
  | 'functional'
  | 'degraded'
  | 'collapsed'
  | 'occupied'
  | 'puppet';

// Nation definition (from JSON data)
export interface Nation {
  id: string;
  name: string;
  isNuclear: boolean;
  initialMilitaryStrength: number;
}

// Runtime nation state (extends base with dynamic data)
export interface NationState extends Nation {
  government: GovernmentStatus;
  militaryStrength: number;
  resistance: number;
  stability: number;
  relations: 'hostile' | 'resistant' | 'neutral' | 'collaborating';
}
