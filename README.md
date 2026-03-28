# Cybersharp Prime Edition

A cyberpunk-themed 3D RPG game built with WebGPU, running entirely in your browser.

## Features

- **100% Local-First**: All game data is stored locally on your device
- **Offline-First**: No internet connection required to play
- **WebGPU Rendering**: High-performance 3D graphics
- **Persistent State**: Game progress saved automatically to IndexedDB
- **Multiple Save Slots**: Support for 3 independent game saves

## Technology Stack

- **Rendering**: WebGPU for high-performance 3D graphics
- **State Management**: Zustand for reactive state management
- **Storage**: IndexedDB + localStorage for persistent data
- **Framework**: React + TypeScript + Vite

## Requirements

- Modern browser with WebGPU support:
  - Chrome 113+ (recommended)
  - Edge 113+
  - Firefox Nightly with WebGPU enabled

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Storage Architecture

The game uses a hybrid storage approach for maximum reliability:

1. **IndexedDB**: Primary storage for save games and structured data
2. **localStorage**: Backup storage and settings persistence
3. **Zustand**: In-memory state management with automatic persistence

### Data Persistence

All game data is automatically saved to your local device:

- Player stats and progression
- Inventory and equipment
- Quest progress
- Game settings
- World state

### Save System

- **Auto-save**: Game progress is saved automatically
- **Manual saves**: Save to any of 3 available slots
- **Load game**: Resume from any saved game
- **Delete saves**: Remove unwanted save files

## Controls

- **W/A/S/D**: Movement
- **Mouse**: Look around (click to enable pointer lock)
- **Shift**: Sprint
- **Space**: Jump
- **Ctrl**: Crouch
- **Left Click**: Fire weapon
- **R**: Reload
- **F**: Toggle pointer lock
- **E**: Interact (when prompted)

## Development

### Project Structure

```
src/
├── engine/           # Core game engine
│   ├── renderer/     # WebGPU rendering system
│   ├── player/       # Player controller and camera
│   ├── world/        # World generation and management
│   ├── combat/       # Combat and weapons system
│   ├── rpg/          # RPG mechanics and stats
│   ├── quest/        # Quest system
│   ├── save/         # Save/load system
│   ├── audio/        # Audio engine
│   ├── input/        # Input management
│   ├── particles/    # Particle effects
│   └── ui/           # HUD and UI
├── storage/          # Local storage adapters
├── store/            # Zustand state stores
├── components/       # React components
└── styles/           # CSS styles
```

### Key Systems

**Rendering Pipeline**:
- Deferred rendering with G-buffers
- Post-processing effects (chromatic aberration, bloom, scanlines)
- Dynamic lighting
- Particle systems

**Save System**:
- Dual-layer persistence (IndexedDB + localStorage)
- Versioned save format
- Automatic migration support
- Data integrity validation

**State Management**:
- Zustand stores for global state
- Automatic persistence middleware
- Type-safe state updates

## Performance

The game is optimized for performance:

- Efficient WebGPU rendering pipeline
- Indexed database for fast data access
- Lazy loading of assets
- Frame rate optimization

## Privacy

All data is stored locally on your device. No data is sent to external servers or the cloud.

## License

All rights reserved.
