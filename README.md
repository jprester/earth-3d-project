# Three.js TypeScript Starter

A modern starter template for building 3D web applications using Three.js, React, TypeScript, and Vite. This project provides a solid foundation for creating interactive 3D experiences with a clean development workflow.

## Features

- **Three.js Integration** - Ready-to-use 3D rendering engine setup
- **Asset Management** - Built-in utilities for loading textures and 3D models
- **TypeScript Support** - Full type safety and modern JavaScript features
- **React Components** - Component-based structure for UI elements
- **Fast Development** - Powered by Vite for quick HMR (Hot Module Replacement)
- **Responsive Design** - Automatically adjusts to window resizing
- **Code Quality** - ESLint configuration for maintaining clean code

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Getting Started

1. Clone this repository

```bash
git clone https://github.com/your-username/three-js-ts-starter.git
cd three-js-ts-starter
```

2. Install dependencies

```bash
npm install
# or
yarn
```

3. Start the development server

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Type check and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
three-js-ts-starter/
├── public/                  # Static assets
│   └── assets/              # 3D models, textures, etc.
├── src/                     # Source code
│   ├── managers/            # Service managers (assetManager, etc.)
│   ├── exported_gltfs/      # GLTF models
│   ├── App.tsx              # Main React component
│   ├── threeScene.ts        # Three.js scene setup
│   └── main.tsx             # Entry point
├── .gitignore               # Git ignore file
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Key Components

### `threeScene.ts`

Sets up the Three.js scene, camera, renderer, lights, and animation loop.

### `managers/assetManager.ts`

Handles loading of textures and 3D models with proper async patterns.

### `App.tsx`

Main React component that initializes and contains the Three.js canvas.

## Customizing the Scene

The project comes with a basic 3D scene including:

- A blue cube (created in code)
- Asset loading for GLTF models
- Orbit controls for camera manipulation
- Proper lighting setup
- Window resize handling

To customize the scene, modify the `threeScene.ts` file and adjust the camera, lighting, geometries, materials, and animation logic as needed.

## Code Style Guidelines

- **TypeScript**: Use strict mode, explicit return types on functions
- **Imports**: Group imports (React, third-party, internal)
- **Formatting**: Use consistent indentation (2 spaces)
- **Components**: Use functional components with React hooks
- **Error Handling**: Use try/catch blocks for async operations
- **Types**: Avoid `any` type except for prototyping

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
