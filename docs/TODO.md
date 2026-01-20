# Implementation Roadmap

## Current Status

✅ Three.js project setup
✅ Earth rendering (3D globe)
✅ Moon rendering

---

## Phase A: Interactive Globe (Foundation)

**Goal:** Transform static Earth into an interactive strategic view

### A1: Camera System
- [ ] Implement `CameraController` with OrbitControls
- [ ] Add zoom level presets (solar → tactical)
- [ ] Smooth animated transitions between zoom levels
- [ ] Click-to-focus on locations
- [ ] Keyboard shortcuts (zoom, pan, reset view)

### A2: Coordinate Utilities
- [ ] Create `GeoUtils.ts` with lat/lng ↔ Vector3 conversion
- [ ] Great circle distance calculation
- [ ] Point-in-region testing
- [ ] Globe surface raycasting (click → lat/lng)

### A3: Basic Markers
- [ ] Create sprite-based marker system
- [ ] Position markers on globe surface
- [ ] Scale markers based on camera distance
- [ ] Hover detection and highlighting
- [ ] Click selection

### A4: World Data Layer
- [ ] Define TypeScript interfaces for locations, nations
- [ ] Create initial `locations.json` with ~50 key locations
  - 10 major capitals
  - 20 military bases (including nuclear)
  - 10 infrastructure points
  - 10 other cities
- [ ] Create `nations.json` with major powers
- [ ] Load and display data on globe

**Deliverable:** Interactive globe with clickable locations, smooth camera, data overlay

---

## Phase B: Core Game Loop

**Goal:** Basic turn-based gameplay infrastructure

### B1: Game State
- [ ] Define `GameState` interface
- [ ] Implement state initialization
- [ ] Add serialization (save/load to localStorage)

### B2: Event System
- [ ] Implement `EventBus` pub/sub
- [ ] Define core event types
- [ ] Wire up systems to emit/listen

### B3: Time Controller
- [ ] Turn-based advancement
- [ ] Pause/play/speed controls
- [ ] Phase transition logic

### B4: Resource System
- [ ] Track fleet resources (energy, rods, drones, personnel)
- [ ] Resource regeneration per turn
- [ ] Resource cost validation for actions

### B5: Basic UI Shell
- [ ] HTML/CSS overlay structure
- [ ] Sidebar panel (phase info, resources)
- [ ] Time control buttons
- [ ] Basic tooltip on hover

**Deliverable:** Game that advances turns, tracks resources, saves/loads

---

## Phase C: Intelligence & Reconnaissance

**Goal:** Phase 1 gameplay - discovery and intel gathering

### C1: Intel System
- [ ] Fog of war implementation (locations start hidden)
- [ ] Intel quality levels (unknown → detected → analyzed)
- [ ] Intel decay over time

### C2: Drone Swarms
- [ ] Drone swarm entity
- [ ] Particle system visualization
- [ ] Deploy to region action
- [ ] Intel gathering over turns
- [ ] Detection risk calculation

### C3: Discovery UI
- [ ] Intel overlay on globe (coverage heatmap)
- [ ] Intel report panel for discovered locations
- [ ] Notification when new intel discovered

### C4: Phase 1 Victory Condition
- [ ] Track intel coverage percentage
- [ ] Phase transition when threshold met
- [ ] Detection consequences (if triggered)

**Deliverable:** Playable Phase 1 - deploy drones, reveal Earth's defenses

---

## Phase D: Strike Phase

**Goal:** Phase 2 gameplay - the Decapitation Cascade

### D1: Mission Planning
- [ ] Mission definition (type, target, resources)
- [ ] Queue missions for simultaneous execution
- [ ] Validate resource availability
- [ ] Mission planning UI modal

### D2: Strike Types
- [ ] EMP strike (radius, electronics disabled)
- [ ] Kinetic bombardment (destroys target)
- [ ] Leadership elimination (requires prior intel)
- [ ] Submarine hunting (time-limited search)

### D3: Combat Resolution
- [ ] Success probability calculation
- [ ] Intel quality impact
- [ ] Target hardness
- [ ] Interception chance (if human C&C intact)

### D4: Strike Effects
- [ ] Visual effects (EMP pulse, kinetic impact)
- [ ] Location status changes
- [ ] Cascade effects (destroyed C&C reduces interception)
- [ ] Nuclear launch response (if silos survive)

### D5: Phase 2 UI
- [ ] Strike planning interface
- [ ] Mission queue visualization
- [ ] Execute button with confirmation
- [ ] Battle report after resolution

### D6: Nuclear Threat
- [ ] Nuclear launch event
- [ ] Interception mini-game or auto-resolve
- [ ] Casualty tracking
- [ ] Failure state if too many launches

**Deliverable:** Playable Phase 2 - plan and execute coordinated strike

---

## Phase E: Occupation & Resistance

**Goal:** Phase 3 gameplay - consolidation

### E1: Ground Forces
- [ ] Ground force entity
- [ ] Deployment to regions
- [ ] Regional control calculation
- [ ] Garrison management

### E2: Region System
- [ ] Divide Earth into manageable regions
- [ ] Control status per region
- [ ] Stability tracking
- [ ] Population attitude

### E3: Resistance System
- [ ] Resistance cells spawn based on harshness
- [ ] Resistance momentum accumulation
- [ ] Resistance actions (attacks, sabotage)
- [ ] Suppression mechanics

### E4: Atmospheric Suppressants
- [ ] Dispersal action
- [ ] Effect on population compliance
- [ ] Diminishing returns over time
- [ ] Coverage visualization

### E5: Communication Control
- [ ] Jam human communications
- [ ] Build Hegemony network
- [ ] Propaganda broadcasts
- [ ] Intel from monitored communications

**Deliverable:** Playable Phase 3 - occupy territory, manage resistance

---

## Phase F: Integration & Endgame

**Goal:** Phases 4-5 gameplay - long-term management

### F1: Collaborator System
- [ ] Recruit collaborators
- [ ] Collaborator loyalty tracking
- [ ] Administrative capacity
- [ ] Betrayal events

### F2: Technology Release
- [ ] Tech gifts (medical, agricultural, energy)
- [ ] Regional stability improvements
- [ ] Dependency creation

### F3: Counter-Insurgency
- [ ] Long-term resistance suppression
- [ ] Generational shift modeling
- [ ] Final stability calculation

### F4: Victory Scoring
- [ ] Calculate final score
- [ ] Victory tier determination
- [ ] Stats summary screen
- [ ] Replay value hooks

**Deliverable:** Complete game loop from start to scored victory

---

## Phase G: Polish

**Goal:** Production quality experience

### G1: Visual Polish
- [ ] Earth atmosphere shader
- [ ] Day/night cycle
- [ ] City lights on night side
- [ ] Cloud layer
- [ ] Improved effects (explosions, EMPs)

### G2: Audio
- [ ] Ambient soundscape
- [ ] UI sounds
- [ ] Event stings
- [ ] Background music (if desired)

### G3: UX Polish
- [ ] Tutorial or guided first game
- [ ] Tooltips everywhere
- [ ] Contextual help
- [ ] Keyboard shortcuts
- [ ] Accessibility (screen reader, colorblind modes)

### G4: Content
- [ ] Expand location database (200+ locations)
- [ ] Flavor text and event variety
- [ ] Multiple difficulty levels
- [ ] Scenario variations

**Deliverable:** Polished, releasable game

---

## Immediate Next Steps

**Start with Phase A.** Suggested order:

1. **A2: GeoUtils** - You'll need this immediately
2. **A1: Camera** - Makes everything else easier to develop
3. **A4: World Data** - Get real locations on the globe
4. **A3: Markers** - Visualize the data

Then move to Phase B for the game loop, which unlocks actual gameplay.

---

## Technical Debt to Watch

- [ ] Don't over-engineer early; refactor when patterns emerge
- [ ] Keep GameState serializable from the start
- [ ] Write types first, implementation second
- [ ] Consider adding basic unit tests for game logic (combat math, etc.)
