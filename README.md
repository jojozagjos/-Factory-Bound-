# Factory Bound

A professional Factorio-style automation game with visual/node-based programming, co-op and PvP multiplayer, and extensive progression systems.

## Features

### Core Gameplay
- **Visual/Node-Based Programming**: Program machines using an intuitive node-based editor
- **Automation Systems**: Build complex production chains with miners, assemblers, belts, and inserters
- **Logistics Network**: Transport items efficiently across your factory
- **Power Management**: Manage power generation and distribution
- **Combat Systems**: Defend against enemies with turrets and automated defenses

### World & Progression
- **Procedural Map Generation**: Each game features unique, seeded worlds
- **Tech Tree**: Unlock new technologies across 5 paradigms (Logistics, Production, Power, Combat, Research)
- **Prestige System**: Reset with permanent bonuses and exclusive features
- **World Modifiers**: Customize difficulty and gameplay with various modifiers
- **Meta Progression**: Level up and gain experience for permanent benefits

### Multiplayer
- **Co-op Mode**: Build factories together with friends
- **PvP Mode**: Compete against other players
- **Ranked System**: Climb the competitive ladder
- **Deterministic Simulation**: Fair, predictable gameplay in multiplayer
- **Cloud Saves**: Save and sync your progress across devices

### Quality of Life
- **Local & Cloud Saves**: Never lose your progress
- **Responsive UI**: Smooth, animated interface
- **Accessibility**: Screen reader support, colorblind modes, reduced motion options
- **Keyboard Navigation**: Full keyboard support throughout the game

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand with Immer
- **Build Tool**: Vite
- **Visual Programming**: ReactFlow
- **3D Rendering**: Three.js + React Three Fiber (optional)
- **Networking**: Socket.io
- **Procedural Generation**: seedrandom

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the game.

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Game Architecture

### Core Systems

1. **Simulation Engine** (`/src/engine/simulation/`)
   - Deterministic tick-based updates (60 TPS)
   - Machine processing and logistics
   - Combat and enemy AI
   - Node program execution

2. **Procedural Generator** (`/src/engine/procedural/`)
   - Seeded map generation
   - Resource placement
   - Spawn point calculation

3. **Progression System** (`/src/engine/progression/`)
   - Tech tree management
   - Experience and leveling
   - Prestige mechanics
   - Meta progression bonuses

4. **Network Manager** (`/src/engine/networking/`)
   - Multiplayer session management
   - State synchronization
   - Ranked matchmaking
   - Cloud save operations

### UI Components

- **MainMenu**: Game entry point with settings and modes
- **GameCanvas**: Main game world rendering
- **HUD**: In-game interface with stats and controls
- **NodeEditor**: Visual programming interface

## Game Modes

### Single Player
- **New Game**: Start a fresh world with customizable settings
- **Load Game**: Continue from a saved game
- **Tutorial**: Learn the basics of factory building

### Multiplayer
- **Co-op**: Collaborate with up to 8 players
- **PvP**: Compete in custom matches
- **Ranked**: Climb the competitive ladder

## Controls

- **WASD / Arrow Keys**: Move camera
- **Mouse Click**: Select machines
- **E**: Open inventory
- **R**: Open node editor
- **T**: Open tech tree
- **B**: Open build menu
- **ESC**: Pause game
- **Space**: Quick pause/resume

## Contributing

This is a game design project showcasing professional game development practices including:
- Deterministic simulation for multiplayer fairness
- Comprehensive state management
- Accessibility-first design
- Modular, scalable architecture

## License

All rights reserved.
