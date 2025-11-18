# 🌍 Earth 3D Visualization

A stunning, interactive 3D visualization of planet Earth built with **React**, **Three.js**, and **TypeScript**. This project features a realistic rendering of Earth with day/night cycles, atmospheric effects, a dynamic cloud layer, and an orbiting Moon.

## ✨ Features

*   **High-Fidelity Earth Rendering**:
    *   **Dynamic LOD (Level of Detail)**: Automatically switches between 2k and 8k textures based on zoom level for optimal performance and visual fidelity.
    *   **Day/Night Cycle**: Custom shaders blend day and night textures based on the sun's position.
    *   **Atmosphere**: Realistic atmospheric glow and cloud layers.
    *   **Texture Maps**: Utilizes normal and specular maps for detailed terrain and water reflection.
*   **Orbiting Moon**: A 3D Moon model that orbits the Earth, tidally locked and scaled relative to the Earth.
*   **Immersive Environment**: Procedurally generated starfield background.
*   **Interactive Controls**:
    *   **Orbit Controls**: Zoom, pan, and rotate around the Earth.
    *   **Speed Control**: Adjust the simulation speed of the Earth's rotation and Moon's orbit.
*   **Smooth Loading**: Dedicated loading screen with progress tracking for texture assets.

## 🛠️ Tech Stack

*   **Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **3D Library**: [Three.js](https://threejs.org/)
*   **Shaders**: GLSL (OpenGL Shading Language)

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd earth-3d-project
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL provided in the terminal).

### Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## 🎮 Controls

*   **Left Click + Drag**: Rotate the camera around the Earth.
*   **Right Click + Drag**: Pan the camera.
*   **Scroll Wheel**: Zoom in and out (triggers LOD system).
*   **UI Slider**: Adjust the rotation speed multiplier.

## 📁 Project Structure

```
src/
├── components/      # React UI components (LoadingScreen, SpeedControl)
├── shaders/         # GLSL shader files for Earth and Stars
├── threeScene.ts    # Main Three.js scene logic (Earth, Moon, Lights, etc.)
├── App.tsx          # Main React application component
└── main.tsx         # Entry point
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

## 📄 License

This project is licensed under the MIT License.
