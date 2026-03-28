# Cybersharp Prime Edition

A cyberpunk RPG game built with React, TypeScript, Vite, and Tailwind CSS. The game runs entirely in the browser with no backend — all data is stored locally using IndexedDB and localStorage.

## Stack

- **Frontend**: React 19, TypeScript, Vite 5
- **Styling**: Tailwind CSS, custom CSS
- **State**: Zustand
- **Storage**: IndexedDB (via `idb`), localStorage
- **Graphics**: WebGPU renderer, custom particle/animation engine
- **Fonts**: Google Fonts (Rajdhani, Share Tech Mono, Orbitron)

## Project Structure

```
src/
  App.tsx               - Root React component
  main.tsx              - Entry point
  index.css             - Global styles
  vite-env.d.ts
  components/           - React UI components (LoadingScreen, etc.)
  engine/               - Game engine (audio, combat, particles, quests, RPG, renderer, save, world, UI)
  store/                - Zustand stores (gameStore, settingsStore)
  storage/              - IndexedDB adapter
  styles/               - Additional CSS
```

## Development

```bash
npm run dev       # Start dev server on port 5000
npm run build     # Production build → dist/
npm run typecheck # TypeScript check
npm run lint      # ESLint
```

## Replit Notes

- Dev server runs on port 5000 with `host: '0.0.0.0'` and `allowedHosts: true` for Replit preview compatibility.
- No environment variables are required — the game is fully offline/local-first.
- Deployment is configured as a static site (output: `dist/`).
