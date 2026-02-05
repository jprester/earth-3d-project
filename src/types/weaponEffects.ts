/**
 * Types for weapon visual effects
 */

import type { Coordinates } from './world';

// Types of weapon projectiles
export type WeaponType = 'kinetic_rod' | 'plasma_missile' | 'beam';

// Weapon effect importance determines visual intensity
export type EffectImportance = 'minor' | 'major' | 'critical';

// Active projectile in flight
export interface Projectile {
  id: string;
  type: WeaponType;
  originShipId: string;
  targetLocationId: string;
  targetCoordinates: Coordinates;
  startTime: number;
  duration: number; // ms to reach target
  importance: EffectImportance;
}

// Active explosion at impact point
export interface Explosion {
  id: string;
  targetLocationId: string;
  position: { x: number; y: number; z: number };
  startTime: number;
  duration: number;
  importance: EffectImportance;
  phase: 'expanding' | 'fading';
}

// Persistent impact mark on surface
export interface ImpactMark {
  id: string;
  targetLocationId: string;
  position: { x: number; y: number; z: number };
  createdAt: number;
  importance: EffectImportance;
}

// Configuration for the effects manager
export interface WeaponEffectsConfig {
  projectileDuration: number; // Base ms for projectile to reach target
  explosionDuration: number;  // ms for explosion animation
  impactMarkLifetime: number; // ms before impact marks fade (0 = permanent)
}

// Default configuration
export const DEFAULT_WEAPON_EFFECTS_CONFIG: WeaponEffectsConfig = {
  projectileDuration: 2000,  // 2 seconds base travel time
  explosionDuration: 1500,   // 1.5 second explosion
  impactMarkLifetime: 0,     // Permanent by default
};
