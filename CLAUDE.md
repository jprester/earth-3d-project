# Earth 3D - Development Guide

## Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Type check and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture Overview

This is an interactive 3D Earth visualization with an alien invasion scenario. The architecture follows an event-driven pattern with decoupled systems communicating through a central EventBus.

### Core Systems
- **threeScene.ts**: Main Three.js scene - Earth, Moon, atmosphere, clouds, stars, lighting
- **EventBus** (`src/core/`): Observer pattern for decoupled communication
- **GameLoop** (`src/game/`): Time management, tick events, speed control
- **ScenarioEngine** (`src/game/`): Narrative event system, triggers timed invasion events

### Rendering Layer (`src/rendering/`)
- **CameraController**: 5 zoom levels, GSAP animations, OrbitControls integration
- **FleetManager**: Alien ships and human satellites with orbital mechanics
- **MarkerRenderer**: Location markers with raycasting, hover/click interactions

### UI Components (`src/components/`)
- **AlienCommandFeed**: Terminal-style alien tactical updates
- **HumanNewsFeed**: Breaking news ticker from human perspective
- **PlaybackControls**: Time display, play/pause, speed buttons
- **InfoPanel/OrbitalInfoPanel**: Detail panels for locations and ships
- **OverlayToggle**: Marker category filters
- **Tooltip**: Cursor-following quick info
- **NotificationSystem**: Toast notifications

### Data Layer
- **WorldData/WorldDataLoader** (`src/world/`): Location and nation state management
- **GeoUtils** (`src/world/`): Lat/lng to 3D coordinate conversions
- **JSON data** (`src/data/`): locations.json, nations.json

### Shaders (`src/shaders/`)
- Earth: Day/night blending, normal mapping, specular reflections
- Stars: Point-based rendering with varying size/alpha

## Project Structure
```
src/
├── components/       # UI components (DOM-based)
├── core/            # EventBus
├── data/            # JSON data files
├── game/            # GameLoop, ScenarioEngine
├── rendering/       # Camera, Fleet, Markers
├── scenarios/       # Scenario definitions
├── shaders/         # GLSL vertex/fragment shaders
├── types/           # TypeScript type definitions
├── world/           # Geographic utilities, world state
├── App.tsx          # Main React component
├── main.tsx         # Entry point
└── threeScene.ts    # Three.js scene setup
```

## Key Types

### Location (`src/types/Location.ts`)
- `LocationType`: capital, city, military_base, nuclear_silo, naval_base, air_base, command_center, power_plant, communications_hub
- `LocationStatus`: unknown, detected, analyzed, targeted, neutralized, occupied, contested
- `ControlStatus`: human, alien, contested, destroyed

### Scenario Events (`src/types/Scenario.ts`)
- Event types: attack, hack, occupy, destroy, human_response, civilian, narrative
- Speed presets: 1/60 (real-time), 1, 2, 5, 10, 20

### EventBus Events (`src/types/Events.ts`)
- Camera: `camera:zoomLevelChanged`, `camera:focusLocation`
- Markers: `marker:hover`, `marker:select`, `marker:click`
- Game: `game:tick`, `game:speedChanged`, `game:hourChanged`
- Scenario: `scenario:eventTriggered`, `scenario:complete`

## Code Style Guidelines
- **TypeScript**: Strict mode, explicit return types
- **Imports**: Group by React, third-party, internal
- **Formatting**: 2 spaces indentation
- **Naming**: PascalCase for components/types, camelCase for variables/functions
- **Error Handling**: try/catch for async operations
- **Types**: Avoid `any` except for prototyping
- **Classes**: Prefer composition over inheritance

## Common Customization Points

| What | Where |
|------|-------|
| Add locations | `src/data/locations.json` |
| Create scenarios | `src/scenarios/` (follow firstContact.ts pattern) |
| Modify fleet | `src/rendering/FleetManager.ts` (ship types, orbits) |
| Camera levels | `src/rendering/CameraController.ts` (CAMERA_LEVELS) |
| Marker colors | `src/rendering/MarkerRenderer.ts` (TYPE_COLORS) |
| Speed presets | `src/types/Scenario.ts` (SPEED_PRESETS) |
| Earth textures | `public/assets/textures/` |
