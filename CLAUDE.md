# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Architecture

This is a React + TypeScript + Vite application with Three.js integration. The main components are:

### Core Structure
- `src/App.tsx` - Main app component that renders the dither background and search interface
- `src/components/SearchInterface.tsx` - Search UI with centered "PM" title and input field
- `src/components/Dither.tsx` - Three.js-based dithered wave background effect

### Key Technologies
- **React 19** with TypeScript
- **Vite** for build tooling
- **Three.js + React Three Fiber** for 3D graphics
- **Postprocessing** for shader effects
- **Tailwind CSS** for styling
- **Iconoir React** for icons

### Dither Component Architecture
The `Dither.tsx` component creates a full-screen animated background with:
- Custom GLSL shaders for wave generation and dithering effects
- Mouse interaction support for wave distortion
- Configurable parameters (wave speed, frequency, amplitude, color levels, etc.)
- Bayer matrix dithering for retro color reduction effect

### Search Interface
The `SearchInterface.tsx` component provides:
- Fixed positioning with backdrop blur effects
- Centered "PM" title display
- Left-aligned search input with code icon
- Right-aligned send button
- Responsive layout with glassmorphism styling

## Build Configuration
- TypeScript app config in `tsconfig.app.json`
- Vite configuration with React plugin
- ESLint configuration with React-specific rules
- Tailwind CSS with PostCSS processing