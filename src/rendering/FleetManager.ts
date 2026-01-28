/**
 * FleetManager - Manages alien fleet and Earth satellites in orbit
 *
 * Creates and animates ships using simple Three.js primitives.
 */

import * as THREE from 'three';
import { EARTH_RADIUS } from '../world/GeoUtils';

// Orbit altitudes (in Earth radii units)
const ORBIT = {
  LOW: EARTH_RADIUS * 1.15,      // Low orbit - kinetic platforms
  MID: EARTH_RADIUS * 1.4,       // Mid orbit - cruisers, drone carriers
  HIGH: EARTH_RADIUS * 2.0,      // High orbit - command carrier
  GEO: EARTH_RADIUS * 3.0,       // Geostationary - satellites
};

// Ship type definitions
type AlienShipType = 'command_carrier' | 'strike_cruiser' | 'kinetic_platform' | 'drone_carrier';
type SatelliteType = 'iss' | 'gps' | 'military';

export interface OrbitalObjectInfo {
  name: string;
  description: string;
  category: 'alien' | 'human';
  status: 'active' | 'disabled' | 'destroyed';
  capabilities?: string[];
  operator?: string;
  orbitType?: string;
}

export interface OrbitalObject {
  id: string;
  mesh: THREE.Group;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  orbitInclination: number;
  type: AlienShipType | SatelliteType;
  info: OrbitalObjectInfo;
}

interface ShipConfig {
  type: AlienShipType;
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  initialAngle: number;
}

interface SatelliteConfig {
  type: SatelliteType;
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  initialAngle: number;
}

export class FleetManager {
  private scene: THREE.Scene;
  private fleetGroup: THREE.Group;
  private ships: Map<string, OrbitalObject> = new Map();
  private satellites: Map<string, OrbitalObject> = new Map();

  // Ship glow color
  private readonly ALIEN_GLOW = 0x00ff88;
  private readonly ALIEN_HULL = 0x1a3a2a;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.fleetGroup = new THREE.Group();
    this.fleetGroup.name = 'AlienFleet';
    this.scene.add(this.fleetGroup);

    this.initializeFleet();
    this.initializeSatellites();
  }

  /**
   * Initialize the alien fleet
   */
  private initializeFleet(): void {
    // Command Carrier - 1 large ship in high orbit
    this.createShip({
      type: 'command_carrier',
      orbitRadius: ORBIT.HIGH,
      orbitSpeed: 0.02,
      orbitInclination: 0.1,
      initialAngle: 0,
    });

    // Strike Cruisers - 4 medium ships in mid orbit
    for (let i = 0; i < 4; i++) {
      this.createShip({
        type: 'strike_cruiser',
        orbitRadius: ORBIT.MID + (Math.random() * 0.2 - 0.1),
        orbitSpeed: 0.05 + Math.random() * 0.02,
        orbitInclination: Math.random() * 0.5 - 0.25,
        initialAngle: (Math.PI * 2 * i) / 4 + Math.random() * 0.3,
      });
    }

    // Kinetic Platforms - 5 small platforms in low orbit
    for (let i = 0; i < 5; i++) {
      this.createShip({
        type: 'kinetic_platform',
        orbitRadius: ORBIT.LOW + (Math.random() * 0.1),
        orbitSpeed: 0.08 + Math.random() * 0.02,
        orbitInclination: Math.random() * 0.3 - 0.15,
        initialAngle: (Math.PI * 2 * i) / 5,
      });
    }

    // Drone Carriers - 2 medium ships
    for (let i = 0; i < 2; i++) {
      this.createShip({
        type: 'drone_carrier',
        orbitRadius: ORBIT.MID * 1.1,
        orbitSpeed: 0.04,
        orbitInclination: 0.2 * (i === 0 ? 1 : -1),
        initialAngle: Math.PI * i,
      });
    }
  }

  /**
   * Initialize Earth satellites
   */
  private initializeSatellites(): void {
    // ISS - visible space station
    this.createSatellite({
      type: 'iss',
      orbitRadius: ORBIT.LOW * 0.95,
      orbitSpeed: 0.15,
      orbitInclination: 0.4,
      initialAngle: 2.5,
    });

    // GPS satellites - small dots
    for (let i = 0; i < 8; i++) {
      this.createSatellite({
        type: 'gps',
        orbitRadius: ORBIT.MID * 0.9 + Math.random() * 0.1,
        orbitSpeed: 0.03 + Math.random() * 0.01,
        orbitInclination: Math.random() * 0.6 - 0.3,
        initialAngle: (Math.PI * 2 * i) / 8,
      });
    }

    // Military satellites
    for (let i = 0; i < 3; i++) {
      this.createSatellite({
        type: 'military',
        orbitRadius: ORBIT.LOW * 1.05,
        orbitSpeed: 0.1,
        orbitInclination: 0.8 * (i - 1),
        initialAngle: (Math.PI * 2 * i) / 3,
      });
    }
  }

  /**
   * Create an alien ship
   */
  private createShip(config: ShipConfig): void {
    const id = `${config.type}-${this.ships.size}`;
    let mesh: THREE.Group;
    let info: OrbitalObjectInfo;

    switch (config.type) {
      case 'command_carrier':
        mesh = this.createCommandCarrier();
        info = {
          name: 'Nexus Prime',
          description: 'Fleet command vessel. Coordinates all invasion operations and serves as primary communications hub.',
          category: 'alien',
          status: 'active',
          capabilities: ['Fleet Command', 'Long-range Communications', 'Strategic Planning', 'Drone Coordination'],
          orbitType: 'High Orbit',
        };
        break;
      case 'strike_cruiser':
        mesh = this.createStrikeCruiser();
        info = {
          name: `Strike Cruiser ${String.fromCharCode(65 + this.ships.size)}`,
          description: 'Fast attack vessel optimized for surgical strikes against hardened targets.',
          category: 'alien',
          status: 'active',
          capabilities: ['Precision Strikes', 'Atmospheric Entry', 'Point Defense'],
          orbitType: 'Mid Orbit',
        };
        break;
      case 'kinetic_platform':
        mesh = this.createKineticPlatform();
        info = {
          name: `Kinetic Platform ${this.ships.size + 1}`,
          description: 'Orbital weapons platform capable of delivering kinetic bombardment to surface targets.',
          category: 'alien',
          status: 'active',
          capabilities: ['Kinetic Bombardment', 'Surface Suppression'],
          orbitType: 'Low Orbit',
        };
        break;
      case 'drone_carrier':
        mesh = this.createDroneCarrier();
        info = {
          name: `Hive Ship ${this.ships.size > 10 ? 'Beta' : 'Alpha'}`,
          description: 'Drone deployment vessel. Houses thousands of autonomous attack and reconnaissance drones.',
          category: 'alien',
          status: 'active',
          capabilities: ['Drone Deployment', 'Swarm Coordination', 'Reconnaissance'],
          orbitType: 'Mid Orbit',
        };
        break;
    }

    // Store ID on mesh for raycasting
    mesh.userData.orbitalId = id;
    mesh.userData.orbitalType = 'ship';

    this.fleetGroup.add(mesh);

    this.ships.set(id, {
      id,
      mesh,
      orbitRadius: config.orbitRadius,
      orbitSpeed: config.orbitSpeed,
      orbitAngle: config.initialAngle,
      orbitInclination: config.orbitInclination,
      type: config.type,
      info,
    });
  }

  /**
   * Create a satellite
   */
  private createSatellite(config: SatelliteConfig): void {
    const id = `${config.type}-${this.satellites.size}`;
    let mesh: THREE.Group;
    let info: OrbitalObjectInfo;

    switch (config.type) {
      case 'iss':
        mesh = this.createISS();
        info = {
          name: 'International Space Station',
          description: 'Multinational research facility in low Earth orbit. Crew evacuated at invasion onset.',
          category: 'human',
          status: 'active',
          operator: 'NASA / Roscosmos / ESA / JAXA',
          capabilities: ['Scientific Research', 'Earth Observation'],
          orbitType: 'Low Earth Orbit (LEO)',
        };
        break;
      case 'gps':
        mesh = this.createGPSSatellite();
        info = {
          name: `GPS Satellite ${this.satellites.size + 1}`,
          description: 'Global Positioning System satellite providing navigation services worldwide.',
          category: 'human',
          status: 'active',
          operator: 'US Space Force',
          capabilities: ['Navigation', 'Timing Services'],
          orbitType: 'Medium Earth Orbit (MEO)',
        };
        break;
      case 'military':
        mesh = this.createMilitarySatellite();
        info = {
          name: `KEYHOLE-${12 + this.satellites.size}`,
          description: 'Classified reconnaissance satellite. Provides real-time imagery intelligence.',
          category: 'human',
          status: 'active',
          operator: 'NRO (Classified)',
          capabilities: ['Imagery Intelligence', 'Signal Monitoring'],
          orbitType: 'Low Earth Orbit (LEO)',
        };
        break;
    }

    // Store ID on mesh for raycasting
    mesh.userData.orbitalId = id;
    mesh.userData.orbitalType = 'satellite';

    this.fleetGroup.add(mesh);

    this.satellites.set(id, {
      id,
      mesh,
      orbitRadius: config.orbitRadius,
      orbitSpeed: config.orbitSpeed,
      orbitAngle: config.initialAngle,
      orbitInclination: config.orbitInclination,
      type: config.type,
      info,
    });
  }

  // ============ ALIEN SHIP GEOMETRIES ============

  /**
   * Command Carrier - Large elongated octahedron with details
   */
  private createCommandCarrier(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'CommandCarrier';

    // Main hull - elongated octahedron
    const hullGeom = new THREE.OctahedronGeometry(0.15, 0);
    hullGeom.scale(1, 0.4, 2.5);
    const hullMat = new THREE.MeshStandardMaterial({
      color: this.ALIEN_HULL,
      metalness: 0.8,
      roughness: 0.3,
      emissive: this.ALIEN_GLOW,
      emissiveIntensity: 0.1,
    });
    const hull = new THREE.Mesh(hullGeom, hullMat);
    group.add(hull);

    // Engine glow at rear
    const engineGeom = new THREE.SphereGeometry(0.04, 8, 8);
    const engineMat = new THREE.MeshBasicMaterial({
      color: this.ALIEN_GLOW,
      transparent: true,
      opacity: 0.8,
    });
    const engine1 = new THREE.Mesh(engineGeom, engineMat);
    engine1.position.set(0, 0, -0.35);
    group.add(engine1);

    const engine2 = engine1.clone();
    engine2.position.set(0.05, 0, -0.32);
    group.add(engine2);

    const engine3 = engine1.clone();
    engine3.position.set(-0.05, 0, -0.32);
    group.add(engine3);

    // Bridge/command section
    const bridgeGeom = new THREE.OctahedronGeometry(0.03, 0);
    const bridgeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.9,
    });
    const bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(0, 0.05, 0.2);
    group.add(bridge);

    return group;
  }

  /**
   * Strike Cruiser - Wedge/chevron shape
   */
  private createStrikeCruiser(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'StrikeCruiser';

    // Main hull - cone stretched into wedge
    const hullGeom = new THREE.ConeGeometry(0.06, 0.2, 4);
    hullGeom.rotateX(Math.PI / 2);
    hullGeom.rotateY(Math.PI / 4);
    const hullMat = new THREE.MeshStandardMaterial({
      color: this.ALIEN_HULL,
      metalness: 0.7,
      roughness: 0.4,
      emissive: this.ALIEN_GLOW,
      emissiveIntensity: 0.15,
    });
    const hull = new THREE.Mesh(hullGeom, hullMat);
    group.add(hull);

    // Engine glow
    const engineGeom = new THREE.SphereGeometry(0.015, 6, 6);
    const engineMat = new THREE.MeshBasicMaterial({
      color: this.ALIEN_GLOW,
      transparent: true,
      opacity: 0.9,
    });
    const engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.set(0, 0, -0.1);
    group.add(engine);

    return group;
  }

  /**
   * Kinetic Platform - Cylinder with rings (orbital weapon)
   */
  private createKineticPlatform(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'KineticPlatform';

    // Main body - cylinder
    const bodyGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.ALIEN_HULL,
      metalness: 0.9,
      roughness: 0.2,
      emissive: this.ALIEN_GLOW,
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // Ring around middle
    const ringGeom = new THREE.TorusGeometry(0.025, 0.004, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.ALIEN_GLOW,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  /**
   * Drone Carrier - Hexagonal disc
   */
  private createDroneCarrier(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'DroneCarrier';

    // Main body - hexagonal cylinder (flat)
    const bodyGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 6);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.ALIEN_HULL,
      metalness: 0.6,
      roughness: 0.5,
      emissive: this.ALIEN_GLOW,
      emissiveIntensity: 0.1,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Center hangar bay glow
    const bayGeom = new THREE.CircleGeometry(0.04, 6);
    const bayMat = new THREE.MeshBasicMaterial({
      color: this.ALIEN_GLOW,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const bay = new THREE.Mesh(bayGeom, bayMat);
    bay.position.z = 0.011;
    group.add(bay);

    return group;
  }

  // ============ SATELLITE GEOMETRIES ============

  /**
   * ISS - Simple cross shape with solar panels
   */
  private createISS(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'ISS';

    // Main module
    const moduleGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8);
    const moduleMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.5,
      roughness: 0.5,
    });
    const module = new THREE.Mesh(moduleGeom, moduleMat);
    module.rotation.z = Math.PI / 2;
    group.add(module);

    // Solar panels
    const panelGeom = new THREE.BoxGeometry(0.06, 0.002, 0.015);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x334488,
      metalness: 0.8,
      roughness: 0.3,
    });

    const panel1 = new THREE.Mesh(panelGeom, panelMat);
    panel1.position.set(0, 0.02, 0);
    group.add(panel1);

    const panel2 = new THREE.Mesh(panelGeom, panelMat);
    panel2.position.set(0, -0.02, 0);
    group.add(panel2);

    return group;
  }

  /**
   * GPS Satellite - Small dot
   */
  private createGPSSatellite(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'GPSSatellite';

    const dotGeom = new THREE.SphereGeometry(0.008, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.8,
    });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    group.add(dot);

    return group;
  }

  /**
   * Military Satellite - Small box with antenna
   */
  private createMilitarySatellite(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MilitarySatellite';

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.015, 0.01, 0.015);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.7,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // Solar panel
    const panelGeom = new THREE.BoxGeometry(0.03, 0.002, 0.01);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x223366,
      metalness: 0.8,
      roughness: 0.3,
    });
    const panel = new THREE.Mesh(panelGeom, panelMat);
    panel.position.y = 0.008;
    group.add(panel);

    return group;
  }

  /**
   * Update all orbital objects (call in animation loop)
   */
  update(deltaTime: number, speedMultiplier: number = 1): void {
    const dt = deltaTime * speedMultiplier * 0.001; // Convert to seconds, apply speed

    // Update ships
    for (const ship of this.ships.values()) {
      ship.orbitAngle += ship.orbitSpeed * dt;
      this.updateOrbitalPosition(ship);

      // Slight rotation of the ship itself
      ship.mesh.rotation.y += dt * 0.5;
    }

    // Update satellites
    for (const sat of this.satellites.values()) {
      sat.orbitAngle += sat.orbitSpeed * dt;
      this.updateOrbitalPosition(sat);
    }
  }

  /**
   * Update position of an orbital object
   */
  private updateOrbitalPosition(obj: OrbitalObject): void {
    const x = Math.cos(obj.orbitAngle) * obj.orbitRadius;
    const z = Math.sin(obj.orbitAngle) * obj.orbitRadius;
    const y = Math.sin(obj.orbitAngle * 2) * obj.orbitRadius * Math.sin(obj.orbitInclination);

    obj.mesh.position.set(x, y, z);

    // Orient ship to face direction of travel
    obj.mesh.lookAt(
      x - Math.sin(obj.orbitAngle),
      y,
      z + Math.cos(obj.orbitAngle)
    );
  }

  /**
   * Get a ship by ID
   */
  getShip(id: string): OrbitalObject | undefined {
    return this.ships.get(id);
  }

  /**
   * Get the command carrier
   */
  getCommandCarrier(): OrbitalObject | undefined {
    for (const ship of this.ships.values()) {
      if (ship.type === 'command_carrier') {
        return ship;
      }
    }
    return undefined;
  }

  /**
   * Destroy a satellite (for scenario events)
   */
  destroySatellite(id: string): void {
    const sat = this.satellites.get(id);
    if (sat) {
      this.fleetGroup.remove(sat.mesh);
      sat.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      this.satellites.delete(id);
    }
  }

  /**
   * Get orbital object by ID (ship or satellite)
   */
  getOrbitalObject(id: string): OrbitalObject | undefined {
    return this.ships.get(id) || this.satellites.get(id);
  }

  /**
   * Get all orbital meshes for raycasting
   */
  getAllMeshes(): THREE.Group[] {
    const meshes: THREE.Group[] = [];
    for (const ship of this.ships.values()) {
      meshes.push(ship.mesh);
    }
    for (const sat of this.satellites.values()) {
      meshes.push(sat.mesh);
    }
    return meshes;
  }

  /**
   * Find orbital object from raycast intersection
   */
  getObjectFromIntersection(intersectedObject: THREE.Object3D): OrbitalObject | null {
    // Walk up the hierarchy to find the group with orbital data
    let current: THREE.Object3D | null = intersectedObject;
    while (current) {
      if (current.userData.orbitalId) {
        const id = current.userData.orbitalId as string;
        return this.getOrbitalObject(id) || null;
      }
      current = current.parent;
    }
    return null;
  }

  /**
   * Get the fleet group for raycasting
   */
  getFleetGroup(): THREE.Group {
    return this.fleetGroup;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    // Dispose all ships
    for (const ship of this.ships.values()) {
      ship.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
    this.ships.clear();

    // Dispose all satellites
    for (const sat of this.satellites.values()) {
      sat.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    }
    this.satellites.clear();

    // Remove group from scene
    this.scene.remove(this.fleetGroup);
  }
}
