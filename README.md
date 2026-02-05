# Earth 3D - Interactive Alien Invasion Diorama

An interactive 3D visualization of Earth featuring a dramatic alien invasion scenario. Built with **React**, **Three.js**, and **TypeScript**, this project presents Earth as an interactive diorama where users can explore strategic locations while experiencing a narrative invasion from both alien and human perspectives.

## Features

### 3D Earth Rendering
- **Dynamic Level of Detail (LOD)**: Automatically switches between 2k and 8k textures based on camera distance
- **Day/Night Cycle**: Custom GLSL shaders blend day and night textures based on sun position
- **Atmospheric Effects**: Realistic atmospheric glow surrounding the planet
- **Cloud Layer**: Dynamic semi-transparent rotating cloud layer
- **Texture Maps**: Normal and specular maps for detailed terrain and water reflections

### Celestial Objects
- **Orbiting Moon**: Tidally locked Moon orbiting Earth with realistic proportions
- **Starfield**: 10,000 procedurally generated stars surrounding the scene

### Alien Fleet System
- **Command Carrier**: Main alien headquarters in high orbit
- **Strike Cruisers**: 4 medium-altitude attack platforms
- **Kinetic Platforms**: 5 fast low-orbit ground strike vessels
- **Drone Carriers**: 2 support vessels in mid-high orbit
- **Human Satellites**: ISS, GPS constellation, and military reconnaissance satellites
- **Interactive Ships**: Hover for tooltips, click for detailed information panels

### Strategic Location System
- **100+ Locations**: Capitals, military bases, nuclear silos, naval bases, air bases, command centers, power plants, and communications hubs
- **Interactive Markers**: Color-coded by type with hover tooltips and click-for-details
- **Dynamic Status**: Locations update in real-time as the invasion scenario progresses
- **Fog of War**: Marker opacity reflects invasion status

### Scenario Engine
- **"First Contact" Scenario**: 72-hour alien invasion timeline
- **Multiple Event Types**: Attacks, hacks, occupations, destruction, human responses, civilian events, narrative beats
- **Dual Perspective**: Experience events through both alien command feed and human news broadcasts
- **Time Control**: Play/pause and adjust speed (real-time to 20x)

### Camera System
- **5 Zoom Levels**: Solar, Orbital, Continental, Regional, and Tactical views
- **Smooth Animations**: GSAP-powered transitions between zoom levels
- **Keyboard Shortcuts**: Quick access to zoom presets
- **Orbit Controls**: Full 3D navigation around Earth

### User Interface
- **Alien Command Feed**: Terminal-style tactical updates from the invasion force
- **Human News Feed**: Breaking news ticker with civilian and military reports
- **Playback Controls**: Time display, play/pause, speed multiplier buttons
- **Info Panels**: Detailed location and orbital object information
- **Overlay Toggle**: Filter markers by category (capitals, military, naval, etc.)
- **Notification System**: Toast notifications for important events
- **Loading Screen**: Progress-tracked texture loading

## Tech Stack

- **Framework**: [React](https://react.dev/) 18.3
- **Build Tool**: [Vite](https://vitejs.dev/) 6.0
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **3D Library**: [Three.js](https://threejs.org/) 0.181
- **Animation**: [GSAP](https://greensock.com/gsap/) 3.14
- **Shaders**: GLSL (OpenGL Shading Language)

## Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd earth-3d-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Building for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## Controls

### Mouse
- **Left Click + Drag**: Rotate camera around Earth
- **Right Click + Drag**: Pan the camera
- **Scroll Wheel**: Zoom in/out (triggers LOD and zoom level changes)
- **Click on Marker**: Open location info panel
- **Click on Ship/Satellite**: Open orbital object info panel
- **Hover**: Show tooltip with quick info

### Keyboard
- **1-5**: Jump to zoom level (Solar, Orbital, Continental, Regional, Tactical)

### UI Controls
- **Play/Pause Button**: Start or pause the invasion scenario
- **Speed Buttons**: Set simulation speed (Real, 1x, 2x, 5x, 10x, 20x)
- **Overlay Toggles**: Show/hide marker categories

## Project Structure

```
src/
├── components/          # UI components
│   ├── AlienCommandFeed.ts    # Alien perspective terminal feed
│   ├── HumanNewsFeed.ts       # Human news ticker
│   ├── PlaybackControls.ts    # Time and speed controls
│   ├── InfoPanel.ts           # Location detail panel
│   ├── OrbitalInfoPanel.ts    # Ship/satellite detail panel
│   ├── OverlayToggle.ts       # Marker category filters
│   ├── Tooltip.ts             # Hover tooltips
│   ├── NotificationSystem.ts  # Toast notifications
│   └── LoadingScreen.tsx      # React loading component
├── core/
│   └── EventBus.ts            # Global event system
├── data/
│   ├── locations.json         # Strategic location database
│   └── nations.json           # Nation data
├── game/
│   ├── GameLoop.ts            # Time and tick management
│   └── ScenarioEngine.ts      # Narrative event system
├── rendering/
│   ├── CameraController.ts    # Camera and zoom management
│   ├── FleetManager.ts        # Alien fleet and satellites
│   └── MarkerRenderer.ts      # Location markers
├── scenarios/
│   └── firstContact.ts        # "First Contact" invasion scenario
├── shaders/
│   ├── earthVertex.glsl       # Earth vertex shader
│   ├── earthFragment.glsl     # Earth fragment shader (day/night)
│   ├── starsVertex.glsl       # Stars vertex shader
│   └── starsFragment.glsl     # Stars fragment shader
├── types/
│   ├── Events.ts              # Event type definitions
│   ├── Location.ts            # Location type definitions
│   └── Scenario.ts            # Scenario type definitions
├── world/
│   ├── GeoUtils.ts            # Geographic utilities
│   ├── WorldData.ts           # World state management
│   └── WorldDataLoader.ts     # Data loading utilities
├── App.tsx                    # Main React component
├── main.tsx                   # Application entry point
└── threeScene.ts              # Three.js scene initialization
```

## Customization

### Adding New Locations
Edit `src/data/locations.json` to add strategic locations with coordinates, type, and metadata.

### Creating New Scenarios
Create a new file in `src/scenarios/` following the `firstContact.ts` pattern with timed events.

### Modifying the Fleet
Adjust ship types, counts, and orbital parameters in `src/rendering/FleetManager.ts`.

### Adjusting Camera Levels
Modify `CAMERA_LEVELS` in `src/rendering/CameraController.ts` for different zoom presets.

### Changing Marker Colors
Update `TYPE_COLORS` in `src/rendering/MarkerRenderer.ts` for different location type colors.

## Architecture

The application uses an event-driven architecture with the `EventBus` as the central communication hub:

- **Game Loop** emits time ticks and speed changes
- **Scenario Engine** triggers narrative events based on game time
- **World Data** maintains location and nation state
- **Renderers** (Markers, Fleet) react to state changes
- **UI Components** subscribe to relevant events

This decoupled design allows for easy extension and modification of individual systems.

## License

This project is licensed under the MIT License.
