# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Architecture

This is a multi-page personal navigation site featuring a search-first interface combined with animated content sections and Three.js visual effects.

### Multi-Page Structure
The application consists of three distinct full-screen sections:
1. **Search Page** - Main search interface with glassmorphism design
2. **Content Page** - Scroll-driven animations with sticky positioning and text reveal effects
3. **Third Page** - Two-column layout with sticky intro and interactive hover text

### Core Components
- `src/App.tsx` - Main orchestrator managing scroll states, mouse tracking, and page transitions
- `src/components/SearchInterface.tsx` - Intelligent search with dual-layer ranking (local + LLM)
- `src/components/Dither.tsx` - Three.js-based animated background with wave shaders and dithering
- `src/components/ui/` - Reusable UI components (glowing effects, cards, tracing beams)
- `src/BlurText.tsx` - Text animation component with blur and reveal effects
- `src/components/FallingText.tsx` - Interactive text component with hover-triggered animations

### Key Technologies
- **React 19** with TypeScript
- **Vite** for build tooling
- **Three.js + React Three Fiber** for 3D graphics and shaders
- **Postprocessing** for advanced shader effects
- **Motion library** for smooth animations
- **Tailwind CSS** for styling
- **Iconoir React** for icons
- **GSAP** for complex animations

### Search System Architecture
The `SearchInterface.tsx` implements a sophisticated search system:
- **Dual-layer ranking**: Local string matching + OpenAI GPT-4o-mini for intelligent ordering
- **Custom YAML parser**: Reads social profiles from `public/socials.yaml`
- **Glassmorphism UI**: Backdrop blur effects with glowing borders
- **Keyboard navigation**: Full arrow key and enter support
- **Abort controller**: Prevents race conditions with LLM requests

### Animation System
- **Scroll-driven animations**: Progress-based text reveal and sticky positioning
- **Per-character rendering**: Fine-grained control over text animations
- **Mouse interaction**: Background responds to cursor movement
- **Cross-page transitions**: Smooth visual states between sections

### Dither Background System
The `Dither.tsx` component creates a sophisticated animated background:
- **Custom GLSL shaders**: Wave generation using Simplex noise
- **Bayer matrix dithering**: 8x8 matrix for retro color reduction
- **Mouse interaction**: Real-time wave distortion based on cursor position
- **Configurable parameters**: Wave speed, frequency, amplitude, color levels
- **Post-processing effects**: Custom dithering effect with pixelation

### Data Flow
1. `socials.yaml` contains social profile definitions
2. Custom YAML parser converts to `SocialItem[]` array
3. Search queries trigger both local and LLM ranking algorithms
4. Results display in dropdown with icons, names, and navigation arrows
5. Scroll progress drives animations in content sections

### Custom Cursor System
Global custom cursor implementation:
- CSS `.cursor-dot` class (24px white dot)
- Mouse position tracking in `src/App.tsx`
- Global `cursor: none` to hide default cursor
- Smooth transition effects

## Build Configuration
- TypeScript app config in `tsconfig.app.json`
- Vite configuration with React plugin
- ESLint configuration with React-specific rules
- Tailwind CSS v4 with PostCSS processing
- Path aliases configured (`@/` maps to `src/`)