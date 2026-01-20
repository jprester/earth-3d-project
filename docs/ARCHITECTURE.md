# Technical Architecture

## Technology Stack

- **Runtime:** Browser (modern Chrome, Firefox, Safari, Edge)
- **Language:** TypeScript
- **3D Engine:** Three.js
- **Animation:** GSAP (camera, UI transitions)
- **UI:** HTML/CSS overlay (not WebGL UI) for accessibility and flexibility
- **State Management:** Custom event-driven system (no heavy framework needed)
- **Build:** Vite

---

## Project Structure

```
src/
├── core/
│   ├── Game.ts                 # Main game controller
│   ├── GameState.ts            # Serializable game state
│   ├── TimeController.ts       # Simulation speed, turn management
│   ├── EventBus.ts             # Pub/sub for game events
│   └── SaveSystem.ts           # Save/load functionality
│
├── world/
│   ├── Earth.ts                # Earth mesh + data layer attachment
│   ├── Moon.ts                 # Moon (visual only, no gameplay)
│   ├── OrbitalSpace.ts         # Fleet positioning grid in orbit
│   ├── WorldData.ts            # All strategic locations, nations
│   ├── WorldDataLoader.ts      # Load from JSON/generate procedurally
│   └── GeoUtils.ts             # lat/lng ↔ Vector3, great circles, etc.
│
├── entities/
│   ├── Entity.ts               # Base entity class
│   ├── Fleet.ts                # Alien fleet aggregate
│   ├── Ship.ts                 # Individual ship (carrier, bombardment, etc.)
│   ├── DroneSwarm.ts           # Reconnaissance unit (particle system)
│   ├── StrikeTeam.ts           # Special operations unit
│   ├── GroundForce.ts          # Occupation army
│   ├── MilitaryBase.ts         # Human military installation
│   ├── City.ts                 # Population center
│   └── ResistanceCell.ts       # Insurgent group
│
├── systems/
│   ├── IntelSystem.ts          # Fog of war, intel gathering/decay
│   ├── CombatSystem.ts         # Strike resolution, combat math
│   ├── ResistanceSystem.ts     # Human response simulation
│   ├── ResourceSystem.ts       # Fleet resource tracking
│   ├── RegionSystem.ts         # Regional control, stability
│   └── PhaseSystem.ts          # Phase transitions, objectives
│
├── rendering/
│   ├── SceneManager.ts         # Three.js scene setup
│   ├── CameraController.ts     # Orbital camera, zoom levels
│   ├── MarkerRenderer.ts       # Strategic location markers on globe
│   ├── OverlayRenderer.ts      # Data visualization layers
│   ├── ConnectionRenderer.ts   # Lines between related points
│   ├── EffectsManager.ts       # EMP waves, explosions, etc.
│   └── Shaders/                # Custom shaders
│       ├── atmosphere.glsl     # Earth atmosphere glow
│       ├── hologram.glsl       # UI element effects
│       └── pulse.glsl          # EMP/strike effects
│
├── ui/
│   ├── UIManager.ts            # HTML overlay controller
│   ├── Sidebar.ts              # Strategic briefing panel
│   ├── ActionBar.ts            # Bottom action queue
│   ├── Tooltip.ts              # Hover information
│   ├── Modal.ts                # Detail panels, mission planning
│   ├── SelectionManager.ts     # Click/hover detection
│   └── components/             # Reusable UI components
│       ├── ResourceBar.ts
│       ├── MissionCard.ts
│       └── IntelReport.ts
│
├── data/
│   ├── locations.json          # Strategic locations database
│   ├── nations.json            # Nation definitions
│   ├── ships.json              # Ship type stats
│   └── events.json             # Scripted events/flavor text
│
├── types/
│   ├── index.ts                # Shared type definitions
│   ├── entities.ts             # Entity interfaces
│   ├── world.ts                # World data types
│   └── events.ts               # Event payload types
│
└── main.ts                     # Entry point
```

---

## Core Classes

### Game.ts

Central controller. Owns all systems, manages game loop.

```typescript
class Game {
  private state: GameState;
  private systems: {
    intel: IntelSystem;
    combat: CombatSystem;
    resistance: ResistanceSystem;
    resources: ResourceSystem;
    regions: RegionSystem;
    phases: PhaseSystem;
  };
  private renderer: SceneManager;
  private ui: UIManager;
  private time: TimeController;
  private events: EventBus;
  
  constructor(container: HTMLElement);
  
  start(): void;
  pause(): void;
  update(deltaTime: number): void;
  
  // Actions
  planMission(mission: Mission): void;
  executeTurn(): void;
  
  // Serialization
  save(): string;
  load(saveData: string): void;
}
```

### GameState.ts

Pure data, fully serializable. No methods, no references to Three.js objects.

```typescript
interface GameState {
  turn: number;
  phase: GamePhase;
  
  // Resources
  resources: {
    energy: number;
    kineticRods: number;
    drones: number;
    personnel: number;
  };
  
  // World state
  locations: Map<string, LocationState>;
  nations: Map<string, NationState>;
  
  // Entities
  fleet: FleetState;
  missions: Mission[];
  
  // Intel
  intel: Map<string, IntelEntry>;
  
  // Metrics
  metrics: {
    humanCasualties: number;
    hegemonyCasualties: number;
    infrastructureDestroyed: number;
    turnsElapsed: number;
  };
}
```

### TimeController.ts

Manages simulation time, turns, and phase transitions.

```typescript
class TimeController {
  private game: Game;
  private speed: number = 1;
  private paused: boolean = true;
  private turnDuration: number = 1000; // ms per turn at 1x
  
  setSpeed(multiplier: number): void;
  pause(): void;
  resume(): void;
  
  // Called each frame
  update(deltaTime: number): void;
  
  // Turn management
  private advanceTurn(): void;
  private checkPhaseTransition(): void;
}
```

### EventBus.ts

Decouples systems. Events include:

- `turn:advance` - New turn started
- `phase:change` - Phase transition
- `mission:complete` - Mission resolved
- `intel:discovered` - New intel gathered
- `alert:nuclear` - Nuclear launch detected
- `location:status` - Location status changed
- `selection:change` - Player selected something

```typescript
class EventBus {
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, payload?: any): void;
}
```

---

## World Data Structure

### Strategic Locations

```typescript
interface StrategicLocation {
  id: string;
  name: string;
  type: LocationType;
  coordinates: { lat: number; lng: number };
  nation: string;
  
  // Type-specific properties
  population?: number;          // Cities
  defenseRating?: number;       // Military
  nuclearCapacity?: number;     // Silos
  gridCapacity?: number;        // Power infrastructure
  
  // Dynamic state
  status: LocationStatus;
  controlledBy: 'human' | 'alien' | 'contested' | 'destroyed';
  stability: number;
  garrison?: string;            // Occupying force ID
}

type LocationType = 
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

type LocationStatus =
  | 'unknown'      // Not yet discovered
  | 'detected'     // Exists but details unknown
  | 'analyzed'     // Full intel
  | 'targeted'     // Strike planned
  | 'neutralized'  // Destroyed/disabled
  | 'occupied'     // Under Hegemony control
  | 'contested';   // Active conflict
```

### Nations

```typescript
interface Nation {
  id: string;
  name: string;
  isNuclear: boolean;
  initialMilitaryStrength: number;
  
  // Dynamic state
  government: GovernmentStatus;
  militaryStrength: number;
  resistance: number;
  stability: number;
  relations: 'hostile' | 'resistant' | 'neutral' | 'collaborating';
}

type GovernmentStatus = 
  | 'functional'
  | 'degraded'
  | 'collapsed'
  | 'occupied'
  | 'puppet';
```

---

## Rendering Architecture

### Coordinate Systems

- **World Space:** Three.js standard (Y-up)
- **Globe:** Radius 1.0 units, centered at origin
- **Geographic:** lat/lng converted via `GeoUtils`
- **Screen:** For raycasting, UI positioning

### Camera Levels

```typescript
const CAMERA_LEVELS = {
  solar: {
    distance: 50,
    fov: 45,
    showLabels: false,
    markerScale: 0.5
  },
  orbital: {
    distance: 15,
    fov: 45,
    showLabels: true,
    markerScale: 1.0
  },
  continental: {
    distance: 5,
    fov: 35,
    showLabels: true,
    markerScale: 1.5
  },
  regional: {
    distance: 2.5,
    fov: 25,
    showLabels: true,
    markerScale: 2.0
  },
  tactical: {
    distance: 1.2,
    fov: 20,
    showLabels: true,
    markerScale: 3.0
  }
};
```

### Marker System

Markers are billboarded sprites positioned on globe surface:

```typescript
interface Marker {
  locationId: string;
  mesh: THREE.Sprite;
  type: LocationType;
  status: LocationStatus;
  
  update(cameraDistance: number): void;  // Scale based on zoom
  setHighlight(active: boolean): void;
  setStatus(status: LocationStatus): void;
}
```

### Overlay Layers

Toggle-able data visualizations:

- **Intel Coverage:** Heatmap showing discovered vs. unknown areas
- **Control:** Color regions by who controls them
- **Military:** Show military installation markers
- **Infrastructure:** Power grid, communications
- **Population:** City markers sized by population
- **Threat:** Remaining nuclear capability, resistance hotspots

---

## Performance Considerations

### LOD Strategy

- **Far zoom:** Low-detail Earth, no markers, minimal labels
- **Medium zoom:** Full Earth, marker sprites, major labels
- **Close zoom:** High-detail Earth, detailed markers, all labels

### Instancing

- Use `InstancedMesh` for markers of same type
- Particle systems for drone swarms, debris, effects

### Updates

- Game logic runs on turn basis, not per-frame
- Rendering interpolates between states for smooth visuals
- UI updates on events, not polling

---

## Save/Load

GameState serializes to JSON. Saves include:

- Full GameState object
- Turn number (for unique save naming)
- Timestamp
- Version number (for migration)

```typescript
interface SaveFile {
  version: string;
  timestamp: number;
  turn: number;
  phase: GamePhase;
  state: GameState;
}
```

---

## Extension Points

### Modding Potential

- `data/*.json` files define content (add locations, nations, ships)
- Event system allows injecting custom handlers
- Phase system could support custom phases

### Multiplayer (Future)

Architecture supports potential multiplayer:
- GameState is serializable (can sync)
- EventBus could route to network
- Turn-based allows asynchronous play
