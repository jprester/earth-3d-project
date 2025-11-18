# Three.js TypeScript Starter - Development Guide

## Commands
- `npm run dev` - Start development server
- `npm run build` - Type check and build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Code Style Guidelines
- **TypeScript**: Use strict mode, explicit return types on functions
- **Imports**: Group imports (React, third-party, internal)
- **Formatting**: Use consistent indentation (2 spaces)
- **Components**: Use functional components with React hooks
- **Naming**: 
  - PascalCase for components and types/interfaces
  - camelCase for variables, functions, and instances
  - Use descriptive names that convey purpose
- **Error Handling**: Use try/catch blocks for async operations
- **Types**: Avoid `any` type except for prototyping
- **Classes**: Prefer composition over inheritance
- **Comments**: Document complex logic, not obvious implementations

## Project Structure
- `/src`: Application source code
- `/public`: Static assets
- `/src/assets`: Application assets (images, etc.)