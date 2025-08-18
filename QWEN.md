# Stv.PM Project Context for Qwen Code

## Project Overview

This project is a React-based web application named "Stv.PM". It's bootstrapped with Vite and uses TypeScript for type safety. The application features a visually distinctive retro aesthetic, achieved through a custom WebGL shader-based background effect and a glass-morphism UI for its main search interface.

The core functionality appears to be a search interface (`PM`), with the background providing an animated, dithered wave pattern that can react to mouse movements. The project utilizes `@react-three/fiber` and `@react-three/postprocessing` for rendering the 3D/WebGL effects within a React component structure.

Key technologies used:
- **Vite**: Build tool and development server.
- **React 18 (StrictMode)**: UI library.
- **TypeScript**: Language for type-safe JavaScript.
- **Tailwind CSS v4**: Utility-first CSS framework for styling (with PostCSS and autoprefixer).
- **Three.js / @react-three/fiber**: For rendering the WebGL background.
- **Postprocessing / @react-three/postprocessing**: For applying the dithering post-processing effect.
- **iconoir-react**: Source of UI icons.

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
- **Styling:** Uses Tailwind CSS extensively, configured via `tailwind.config.js`. Base styles are in `src/index.css`.
- **Component Architecture:** Follows standard React practices with functional components and hooks (e.g., `useState`, `useRef`, `useEffect`, `useFrame` from `@react-three/fiber`).
- **Type Safety:** TypeScript is used throughout for strong typing.
- **ESLint:** Code style and quality are enforced by ESLint, configured in `eslint.config.js`.
- **Entry Point:** The application entry is `src/main.tsx`, which renders the `App` component (`src/App.tsx`). `App.tsx` composes the `Dither` background and `SearchInterface` components.