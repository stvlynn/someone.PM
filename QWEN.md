# Stv.PM Project Context for Qwen Code

## Project Overview

Stv.PM is a minimalist personal navigation site that replaces the traditional bento-style card grid with a single, powerful search box. The project is built with React, TypeScript, and Vite, featuring a modern glass-morphism UI with subtle animations and a WebGL-based dithered background effect.

Key technologies used:
- **Vite**: Build tool and development server
- **React 18**: UI library with TypeScript
- **Tailwind CSS v4**: Utility-first CSS framework
- **Three.js / @react-three/fiber**: For rendering the WebGL background
- **Postprocessing / @react-three/postprocessing**: For applying the dithering effect
- **iconoir-react**: Icon library
- **Lucide React**: Additional icon library
- **CLSX / Tailwind-merge**: For conditional class name handling
- **Motion**: Animation library

The application features:
1. A search-first interface with intelligent suggestions
2. A dynamic, animated dithered background using WebGL shaders
3. Custom cursor implementation
4. Scroll-driven animations on the second page
5. Glowing effect components for UI elements
6. YAML-based social link configuration

## Building and Running

The project uses standard Vite commands defined in `package.json`:

- **Install Dependencies:** Ensure Node.js is installed. Then run `npm install` (or `yarn install` / `pnpm install`) in the project root.
- **Development Server:** `npm run dev` - Starts the Vite development server with Hot Module Replacement (HMR).
- **Build for Production:** `npm run build` - Compiles TypeScript and bundles the application using Vite into the `dist` directory.
- **Lint Code:** `npm run lint` - Runs ESLint to check for code style and potential errors.
- **Preview Build:** `npm run preview` - Locally previews the production build (requires building first).

TypeScript configuration is split into `tsconfig.app.json` (for application code) and `tsconfig.node.json` (for tooling like Vite config), referenced by the main `tsconfig.json`.

## Development Conventions

- **Structure:** The main application logic resides in `src/`. Components are placed in `src/components/`.
- **Styling:** Uses Tailwind CSS extensively, configured via `tailwind.config.js`. Base styles are in `src/index.css` and component-specific styles in `src/App.css`.
- **Component Architecture:** Follows standard React practices with functional components and hooks.
- **Path Aliases:** Uses `@/*` alias for imports from the `src` directory (configured in `tsconfig.app.json` and `vite.config.ts`).
- **Type Safety:** TypeScript is used throughout for strong typing.
- **ESLint:** Code style and quality are enforced by ESLint, configured in `eslint.config.js`.
- **Entry Point:** The application entry is `src/main.tsx`, which renders the `App` component (`src/App.tsx`).