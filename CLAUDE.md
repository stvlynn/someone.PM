# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Architecture

This is a search-first personal navigation site that replaces traditional card grids with a powerful search interface. The application combines Three.js visual effects with a minimalist search experience.

### Core Structure
- `src/App.tsx` - Main app component that renders the dither background and search interface with custom cursor
- `src/components/SearchInterface.tsx` - Search UI with intelligent suggestion system and dropdown
- `src/components/Dither.tsx` - Three.js-based dithered wave background with mouse interaction
- `public/socials.yaml` - Configuration file for social media profiles and links

### Key Technologies
- **React 19** with TypeScript
- **Vite** for build tooling
- **Three.js + React Three Fiber** for 3D graphics
- **Postprocessing** for shader effects
- **Tailwind CSS** for styling
- **Iconoir React** for icons

### Search System Architecture
The `SearchInterface.tsx` implements a dual-layer search system:
- **Local ranking**: Lightweight string matching for immediate results
- **LLM ranking**: OpenAI GPT-4o-mini for intelligent result ordering (requires `VITE_OPENAI_API_KEY`)
- **Custom YAML parser**: Reads social profiles from `public/socials.yaml`
- **Glassmorphism UI**: Backdrop blur effects with consistent icon spacing

### Data Flow
1. `socials.yaml` contains profile definitions (id, name, username, icon, url)
2. Custom YAML parser converts file content to `SocialItem[]` array
3. Search queries trigger both local and LLM ranking algorithms
4. Results display in dropdown with icons, names, and navigation arrows

### Dither Component Architecture
The `Dither.tsx` component creates an animated background with:
- Custom GLSL shaders for wave generation and dithering effects
- Mouse interaction support for wave distortion
- Configurable parameters (wave speed, frequency, amplitude, color levels, etc.)
- Bayer matrix dithering for retro color reduction effect

### Custom Cursor
The app uses a custom white dot cursor (16px) implemented through:
- CSS `.cursor-dot` class in `src/index.css`
- Mouse position tracking in `src/App.tsx`
- Global `cursor: none` to hide default cursor

## Build Configuration
- TypeScript app config in `tsconfig.app.json`
- Vite configuration with React plugin
- ESLint configuration with React-specific rules
- Tailwind CSS with PostCSS processing