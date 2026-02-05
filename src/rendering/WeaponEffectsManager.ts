/**
 * WeaponEffectsManager - Manages visual weapon effects (projectiles, explosions, impact marks)
 *
 * Subscribes to scenario events and renders:
 * - Kinetic rods / missiles traveling from ships to surface
 * - Explosions at impact points
 * - Persistent impact marks showing damage
 */

import * as THREE from 'three';
import { EARTH_RADIUS, latLngToVector3 } from '../world/GeoUtils';
import type { FleetManager, OrbitalObject } from './FleetManager';
import type { Coordinates } from '../types/world';
import type {
  Projectile,
  Explosion,
  ImpactMark,
  WeaponEffectsConfig,
  WeaponType,
  EffectImportance,
} from '../types/weaponEffects';
import { DEFAULT_WEAPON_EFFECTS_CONFIG } from '../types/weaponEffects';

// Visual constants
const COLORS = {
  projectile: {
    kinetic_rod: 0xff4400,    // Orange-red for kinetic
    plasma_missile: 0x00ff88, // Green plasma
    beam: 0xff00ff,           // Magenta beam
  },
  explosion: {
    core: 0xffff00,           // Yellow core
    outer: 0xff4400,          // Orange outer
    shockwave: 0xffffff,      // White shockwave ring
  },
  impact: {
    minor: 0x884400,          // Brown scar
    major: 0xaa2200,          // Dark red
    critical: 0x220000,       // Near black (devastation)
  },
};

// Size multipliers based on importance
const IMPORTANCE_SCALE = {
  minor: 0.6,
  major: 1.0,
  critical: 1.5,
};

interface ActiveProjectile extends Projectile {
  mesh: THREE.Group;
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
}

interface ActiveExplosion extends Explosion {
  meshes: {
    core: THREE.Mesh;
    outer: THREE.Mesh;
    shockwave: THREE.Mesh;
  };
}

interface ActiveImpactMark extends ImpactMark {
  mesh: THREE.Mesh;
}

export class WeaponEffectsManager {
  private scene: THREE.Scene;
  private fleetManager: FleetManager;
  private config: WeaponEffectsConfig;

  // Effect containers
  private effectsGroup: THREE.Group;
  private projectiles: Map<string, ActiveProjectile> = new Map();
  private explosions: Map<string, ActiveExplosion> = new Map();
  private impactMarks: Map<string, ActiveImpactMark> = new Map();

  // Shared geometries and materials (for performance)
  private projectileGeometry: THREE.CylinderGeometry;
  private projectileTrailGeometry: THREE.ConeGeometry;
  private explosionCoreGeometry: THREE.SphereGeometry;
  private explosionOuterGeometry: THREE.SphereGeometry;
  private shockwaveGeometry: THREE.RingGeometry;
  private impactMarkGeometry: THREE.CircleGeometry;

  // ID counter
  private nextId = 0;

  constructor(
    scene: THREE.Scene,
    fleetManager: FleetManager,
    config: Partial<WeaponEffectsConfig> = {}
  ) {
    this.scene = scene;
    this.fleetManager = fleetManager;
    this.config = { ...DEFAULT_WEAPON_EFFECTS_CONFIG, ...config };

    // Create effects group
    this.effectsGroup = new THREE.Group();
    this.effectsGroup.name = 'WeaponEffects';
    this.scene.add(this.effectsGroup);

    // Initialize shared geometries
    this.projectileGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6);
    this.projectileTrailGeometry = new THREE.ConeGeometry(0.015, 0.08, 6);
    this.explosionCoreGeometry = new THREE.SphereGeometry(0.03, 12, 12);
    this.explosionOuterGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    this.shockwaveGeometry = new THREE.RingGeometry(0.02, 0.12, 32);
    this.impactMarkGeometry = new THREE.CircleGeometry(0.05, 16);
  }

  /**
   * Fire a weapon effect from orbit to a surface location
   */
  fireWeapon(
    targetLocationId: string,
    targetCoordinates: Coordinates,
    importance: EffectImportance = 'major',
    weaponType: WeaponType = 'kinetic_rod'
  ): string {
    const id = `projectile-${this.nextId++}`;

    // Find the nearest appropriate ship to fire from
    const originShip = this.findFiringShip(targetCoordinates, weaponType);
    if (!originShip) {
      console.warn('No suitable ship found to fire weapon');
      return id;
    }

    // Calculate positions
    const startPosition = originShip.mesh.position.clone();
    const endPosition = latLngToVector3(targetCoordinates, EARTH_RADIUS, 0.01);

    // Create projectile mesh
    const mesh = this.createProjectileMesh(weaponType, importance);
    mesh.position.copy(startPosition);
    this.effectsGroup.add(mesh);

    // Store projectile data
    const projectile: ActiveProjectile = {
      id,
      type: weaponType,
      originShipId: originShip.id,
      targetLocationId,
      targetCoordinates,
      startTime: performance.now(),
      duration: this.config.projectileDuration / IMPORTANCE_SCALE[importance],
      importance,
      mesh,
      startPosition,
      endPosition,
    };

    this.projectiles.set(id, projectile);
    return id;
  }

  /**
   * Create explosion at a location (can be called directly or after projectile impact)
   */
  createExplosion(
    targetLocationId: string,
    targetCoordinates: Coordinates,
    importance: EffectImportance = 'major'
  ): string {
    const id = `explosion-${this.nextId++}`;
    const position = latLngToVector3(targetCoordinates, EARTH_RADIUS, 0.02);

    const scale = IMPORTANCE_SCALE[importance];

    // Create explosion core (bright center)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.explosion.core,
      transparent: true,
      opacity: 1,
    });
    const core = new THREE.Mesh(this.explosionCoreGeometry, coreMaterial);
    core.position.copy(position);
    core.scale.setScalar(scale * 0.5);

    // Create outer explosion (expanding fireball)
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.explosion.outer,
      transparent: true,
      opacity: 0.7,
    });
    const outer = new THREE.Mesh(this.explosionOuterGeometry, outerMaterial);
    outer.position.copy(position);
    outer.scale.setScalar(scale * 0.3);

    // Create shockwave ring
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.explosion.shockwave,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const shockwave = new THREE.Mesh(this.shockwaveGeometry, shockwaveMaterial);
    shockwave.position.copy(position);
    // Orient shockwave to face outward from Earth center
    shockwave.lookAt(0, 0, 0);
    shockwave.rotateX(Math.PI); // Flip to face away from center
    shockwave.scale.setScalar(scale * 0.5);

    this.effectsGroup.add(core);
    this.effectsGroup.add(outer);
    this.effectsGroup.add(shockwave);

    const explosion: ActiveExplosion = {
      id,
      targetLocationId,
      position: { x: position.x, y: position.y, z: position.z },
      startTime: performance.now(),
      duration: this.config.explosionDuration,
      importance,
      phase: 'expanding',
      meshes: { core, outer, shockwave },
    };

    this.explosions.set(id, explosion);
    return id;
  }

  /**
   * Create a persistent impact mark on the surface
   */
  createImpactMark(
    targetLocationId: string,
    targetCoordinates: Coordinates,
    importance: EffectImportance = 'major'
  ): string {
    // Check if there's already an impact mark for this location
    for (const mark of this.impactMarks.values()) {
      if (mark.targetLocationId === targetLocationId) {
        // Upgrade importance if new attack is more severe
        if (IMPORTANCE_SCALE[importance] > IMPORTANCE_SCALE[mark.importance]) {
          mark.importance = importance;
          const material = mark.mesh.material as THREE.MeshBasicMaterial;
          material.color.setHex(COLORS.impact[importance]);
          mark.mesh.scale.setScalar(IMPORTANCE_SCALE[importance]);
        }
        return mark.id;
      }
    }

    const id = `impact-${this.nextId++}`;
    const position = latLngToVector3(targetCoordinates, EARTH_RADIUS, 0.005);

    const material = new THREE.MeshBasicMaterial({
      color: COLORS.impact[importance],
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(this.impactMarkGeometry, material);
    mesh.position.copy(position);
    // Orient to lay flat on surface (face outward from center)
    mesh.lookAt(0, 0, 0);
    mesh.rotateX(Math.PI); // Flip to face away from center
    mesh.scale.setScalar(IMPORTANCE_SCALE[importance]);

    this.effectsGroup.add(mesh);

    const impactMark: ActiveImpactMark = {
      id,
      targetLocationId,
      position: { x: position.x, y: position.y, z: position.z },
      createdAt: performance.now(),
      importance,
      mesh,
    };

    this.impactMarks.set(id, impactMark);
    return id;
  }

  /**
   * Update all active effects (call in animation loop)
   */
  update(speedMultiplier: number = 1): void {
    const now = performance.now();

    // Update projectiles
    for (const [id, projectile] of this.projectiles) {
      const elapsed = (now - projectile.startTime) * speedMultiplier;
      const progress = Math.min(elapsed / projectile.duration, 1);

      if (progress >= 1) {
        // Projectile reached target - create explosion and impact mark
        this.effectsGroup.remove(projectile.mesh);
        this.disposeProjectileMesh(projectile.mesh);
        this.projectiles.delete(id);

        // Trigger explosion and impact
        this.createExplosion(
          projectile.targetLocationId,
          projectile.targetCoordinates,
          projectile.importance
        );
        this.createImpactMark(
          projectile.targetLocationId,
          projectile.targetCoordinates,
          projectile.importance
        );
      } else {
        // Animate projectile along path with slight arc
        this.updateProjectilePosition(projectile, progress);
      }
    }

    // Update explosions
    for (const [id, explosion] of this.explosions) {
      const elapsed = (now - explosion.startTime) * speedMultiplier;
      const progress = Math.min(elapsed / explosion.duration, 1);

      if (progress >= 1) {
        // Explosion complete - remove meshes
        this.effectsGroup.remove(explosion.meshes.core);
        this.effectsGroup.remove(explosion.meshes.outer);
        this.effectsGroup.remove(explosion.meshes.shockwave);
        this.disposeExplosionMeshes(explosion.meshes);
        this.explosions.delete(id);
      } else {
        // Animate explosion
        this.updateExplosion(explosion, progress);
      }
    }

    // Update impact marks (fade if lifetime is set)
    if (this.config.impactMarkLifetime > 0) {
      for (const [id, mark] of this.impactMarks) {
        const age = now - mark.createdAt;
        if (age > this.config.impactMarkLifetime) {
          this.effectsGroup.remove(mark.mesh);
          (mark.mesh.material as THREE.Material).dispose();
          this.impactMarks.delete(id);
        } else {
          // Fade out in last 20% of lifetime
          const fadeStart = this.config.impactMarkLifetime * 0.8;
          if (age > fadeStart) {
            const fadeProgress = (age - fadeStart) / (this.config.impactMarkLifetime * 0.2);
            (mark.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - fadeProgress);
          }
        }
      }
    }
  }

  /**
   * Find the best ship to fire from based on position and weapon type
   */
  private findFiringShip(targetCoords: Coordinates, weaponType: WeaponType): OrbitalObject | null {
    const targetPos = latLngToVector3(targetCoords, EARTH_RADIUS);
    let bestShip: OrbitalObject | null = null;
    let bestScore = Infinity;

    // Get ships that can fire the weapon type
    const validTypes = this.getValidShipTypes(weaponType);

    // Check all ships
    const allMeshes = this.fleetManager.getAllMeshes();
    for (const mesh of allMeshes) {
      const orbitalId = mesh.userData.orbitalId as string;
      if (!orbitalId || mesh.userData.orbitalType !== 'ship') continue;

      const ship = this.fleetManager.getOrbitalObject(orbitalId);
      if (!ship || !validTypes.includes(ship.type as string)) continue;

      // Score based on distance and whether ship is on visible side
      const distance = mesh.position.distanceTo(targetPos);
      const dotProduct = mesh.position.clone().normalize().dot(targetPos.clone().normalize());

      // Prefer ships on the same hemisphere as target (dot product > 0)
      const visibilityBonus = dotProduct > 0 ? 0 : 2;
      const score = distance + visibilityBonus;

      if (score < bestScore) {
        bestScore = score;
        bestShip = ship;
      }
    }

    return bestShip;
  }

  /**
   * Get ship types that can fire a weapon type
   */
  private getValidShipTypes(weaponType: WeaponType): string[] {
    switch (weaponType) {
      case 'kinetic_rod':
        return ['kinetic_platform', 'strike_cruiser'];
      case 'plasma_missile':
        return ['strike_cruiser', 'drone_carrier', 'command_carrier'];
      case 'beam':
        return ['command_carrier'];
      default:
        return ['kinetic_platform', 'strike_cruiser'];
    }
  }

  /**
   * Create projectile mesh
   */
  private createProjectileMesh(type: WeaponType, importance: EffectImportance): THREE.Group {
    const group = new THREE.Group();
    const scale = IMPORTANCE_SCALE[importance];
    const color = COLORS.projectile[type];

    // Main projectile body
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const body = new THREE.Mesh(this.projectileGeometry, bodyMaterial);
    body.scale.setScalar(scale);
    group.add(body);

    // Trail/glow
    const trailMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
    });
    const trail = new THREE.Mesh(this.projectileTrailGeometry, trailMaterial);
    trail.scale.setScalar(scale);
    trail.position.y = -0.05 * scale;
    trail.rotation.x = Math.PI; // Point backward
    group.add(trail);

    // Point light for glow effect
    const light = new THREE.PointLight(color, 0.5 * scale, 0.5);
    group.add(light);

    return group;
  }

  /**
   * Update projectile position along curved path
   */
  private updateProjectilePosition(projectile: ActiveProjectile, progress: number): void {
    const { mesh, startPosition, endPosition } = projectile;

    // Ease-in curve for acceleration feel
    const easedProgress = this.easeInQuad(progress);

    // Interpolate position
    const currentPos = new THREE.Vector3().lerpVectors(startPosition, endPosition, easedProgress);

    // Add slight arc (bulge outward from Earth)
    const midHeight = 0.3 * Math.sin(progress * Math.PI);
    const outwardDir = currentPos.clone().normalize();
    currentPos.addScaledVector(outwardDir, midHeight);

    mesh.position.copy(currentPos);

    // Orient projectile to face direction of travel
    const nextProgress = Math.min(progress + 0.01, 1);
    const nextPos = new THREE.Vector3().lerpVectors(startPosition, endPosition, nextProgress);
    mesh.lookAt(nextPos);
    mesh.rotateX(Math.PI / 2); // Align cylinder with direction
  }

  /**
   * Update explosion animation
   */
  private updateExplosion(explosion: ActiveExplosion, progress: number): void {
    const { meshes, importance } = explosion;
    const scale = IMPORTANCE_SCALE[importance];

    // Phase 1: Expand (0-0.4)
    // Phase 2: Hold (0.4-0.6)
    // Phase 3: Fade (0.6-1.0)

    if (progress < 0.4) {
      // Expanding
      const expandProgress = progress / 0.4;
      const easedExpand = this.easeOutQuad(expandProgress);

      meshes.core.scale.setScalar(scale * (0.5 + easedExpand * 0.5));
      meshes.outer.scale.setScalar(scale * (0.3 + easedExpand * 1.2));
      meshes.shockwave.scale.setScalar(scale * (0.5 + easedExpand * 2));

      (meshes.core.material as THREE.MeshBasicMaterial).opacity = 1;
      (meshes.outer.material as THREE.MeshBasicMaterial).opacity = 0.7;
      (meshes.shockwave.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - expandProgress * 0.5);
    } else if (progress < 0.6) {
      // Hold
      meshes.core.scale.setScalar(scale);
      meshes.outer.scale.setScalar(scale * 1.5);
      meshes.shockwave.scale.setScalar(scale * 2.5);
      (meshes.shockwave.material as THREE.MeshBasicMaterial).opacity = 0.25;
    } else {
      // Fading
      const fadeProgress = (progress - 0.6) / 0.4;
      const opacity = 1 - fadeProgress;

      (meshes.core.material as THREE.MeshBasicMaterial).opacity = opacity;
      (meshes.outer.material as THREE.MeshBasicMaterial).opacity = 0.7 * opacity;
      (meshes.shockwave.material as THREE.MeshBasicMaterial).opacity = 0.25 * opacity;

      // Continue expanding slightly while fading
      meshes.outer.scale.setScalar(scale * (1.5 + fadeProgress * 0.5));
      meshes.shockwave.scale.setScalar(scale * (2.5 + fadeProgress));
    }
  }

  /**
   * Easing functions
   */
  private easeInQuad(t: number): number {
    return t * t;
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  /**
   * Dispose projectile mesh resources
   */
  private disposeProjectileMesh(mesh: THREE.Group): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      if (child instanceof THREE.PointLight) {
        child.dispose();
      }
    });
  }

  /**
   * Dispose explosion mesh resources
   */
  private disposeExplosionMeshes(meshes: { core: THREE.Mesh; outer: THREE.Mesh; shockwave: THREE.Mesh }): void {
    (meshes.core.material as THREE.Material).dispose();
    (meshes.outer.material as THREE.Material).dispose();
    (meshes.shockwave.material as THREE.Material).dispose();
  }

  /**
   * Get the effects group for adding to scene
   */
  getEffectsGroup(): THREE.Group {
    return this.effectsGroup;
  }

  /**
   * Check if there are any active effects
   */
  hasActiveEffects(): boolean {
    return this.projectiles.size > 0 || this.explosions.size > 0;
  }

  /**
   * Get count of impact marks
   */
  getImpactMarkCount(): number {
    return this.impactMarks.size;
  }

  /**
   * Clear all effects
   */
  clearAll(): void {
    // Clear projectiles
    for (const projectile of this.projectiles.values()) {
      this.effectsGroup.remove(projectile.mesh);
      this.disposeProjectileMesh(projectile.mesh);
    }
    this.projectiles.clear();

    // Clear explosions
    for (const explosion of this.explosions.values()) {
      this.effectsGroup.remove(explosion.meshes.core);
      this.effectsGroup.remove(explosion.meshes.outer);
      this.effectsGroup.remove(explosion.meshes.shockwave);
      this.disposeExplosionMeshes(explosion.meshes);
    }
    this.explosions.clear();

    // Clear impact marks
    for (const mark of this.impactMarks.values()) {
      this.effectsGroup.remove(mark.mesh);
      (mark.mesh.material as THREE.Material).dispose();
    }
    this.impactMarks.clear();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.clearAll();

    // Dispose shared geometries
    this.projectileGeometry.dispose();
    this.projectileTrailGeometry.dispose();
    this.explosionCoreGeometry.dispose();
    this.explosionOuterGeometry.dispose();
    this.shockwaveGeometry.dispose();
    this.impactMarkGeometry.dispose();

    // Remove from scene
    this.scene.remove(this.effectsGroup);
  }
}
