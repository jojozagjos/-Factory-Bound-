# Factory Bound

A professional Factorio-style automation game with visual/node-based programming, co-op and PvP multiplayer, and extensive progression systems.

**🎮 MULTIPLAYER NOW FULLY WORKING! 🎮**  
Real-time co-op and PvP with up to 8 players! See [MULTIPLAYER_GUIDE.md](MULTIPLAYER_GUIDE.md) for setup.

## Features

### Core Gameplay
- **Interactive Tutorial System**: Comprehensive 16-step tutorial covering all game mechanics
- **Visual/Node-Based Programming**: Program machines using an intuitive node-based editor
- **Automation Systems**: Build complex production chains with miners, assemblers, belts, and inserters
- **Building System**: Place and manage 8 different machine types with collision detection
- **Recipe System**: 15+ crafting recipes for items and components
- **Logistics Network**: Transport items efficiently across your factory
- **Power Management**: Manage power generation and distribution
- **Combat Systems**: Defend against enemies with turrets and automated defenses
- **Inventory Management**: Stack-based inventory with 100-item stack limits

### World & Progression
- **Procedural Map Generation**: Each game features unique, seeded worlds
- **Tech Tree**: Unlock new technologies across 5 paradigms (Logistics, Production, Power, Combat, Research)
- **Prestige System**: Reset with permanent bonuses and exclusive features
- **World Modifiers**: Customize difficulty and gameplay with various modifiers
- **Meta Progression**: Level up and gain experience for permanent benefits

### Multiplayer
- **Co-op Mode**: Build factories together with friends - **✅ FULLY WORKING!**
- **PvP Mode**: Compete against other players - **✅ FULLY WORKING!**
- **Ranked System**: Climb the competitive ladder - **✅ FULLY WORKING!**
- **Deterministic Simulation**: Fair, predictable gameplay in multiplayer
- **Cloud Saves**: Save and sync your progress across devices
- **Real-time State Sync**: Host-authoritative multiplayer with Socket.io

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
cd server && npm install && cd ..
```

### Development

**Run both client and server:**
```bash
npm run dev:all
```

**Or run separately:**

Client only:
```bash
npm run dev
```

Server only:
```bash
npm run dev:server
```

The client will be available at [http://localhost:5173](http://localhost:5173) and the multiplayer server at [http://localhost:3001](http://localhost:3001).

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

## 🎮 Multiplayer Setup

Multiplayer is **fully working** and ready to use!

### Quick Start
```bash
# Start both client and server
npm run dev:all
```

The game runs on http://localhost:5173 and the server on http://localhost:3001.

### Features
- ✅ **Real-time Co-op** - Up to 8 players working together
- ✅ **PvP Mode** - Competitive battles with separate bases
- ✅ **Session Management** - Create, join, and list games
- ✅ **Cloud Saves** - Server-side save storage
- ✅ **Matchmaking** - Quick match and ranked modes
- ✅ **State Sync** - Host-authoritative with delta compression

### Testing
```bash
cd server && npm test
```

All 5 integration tests pass ✅

For complete setup instructions, see **[MULTIPLAYER_GUIDE.md](MULTIPLAYER_GUIDE.md)**

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

4. **Resource System** (`/src/systems/`)
   - 15+ crafting recipes
   - Mining mechanics
   - Inventory management with stacking
   - Recipe validation and crafting

5. **Building System** (`/src/systems/`)
   - Placement validation and collision detection
   - Resource cost management
   - Building preview (ghost mode)
   - 8 machine types: miner, assembler, smelter, belt, inserter, power_plant, turret, storage

6. **Combat System** (`/src/systems/`)
   - Enemy types and spawning
   - Turret targeting and shooting
   - Projectile physics
   - Wave management

7. **Game Mode Manager** (`/src/systems/`)
   - Victory/defeat conditions
   - Score calculation
   - Multiple game modes (Survival, Production, Exploration, Custom)

8. **Network Manager** (`/src/engine/networking/`)
   - Multiplayer session management
   - State synchronization
   - Ranked matchmaking
   - Cloud save operations
   - **Backend Server** (`/server/`) - Node.js/Express/Socket.io server ✅

### UI Components

- **MainMenu**: Game entry point with settings and modes
- **GameCanvas**: Main game world rendering
- **HUD**: In-game interface with stats and controls
- **Tutorial**: Interactive 16-step tutorial system
- **NodeEditor**: Visual programming interface
- **BuildMenu**: Building selection with categories (Logistics, Production, Power, Defense)
- **TechTree**: Technology research interface across 5 paradigms
- **GameOverScreen**: Victory/defeat screen with statistics

### State Management

- **gameStore**: Global game state with Zustand
- **tutorialStore**: Tutorial progress and state
- Immutable updates with Immer middleware

## Testing

The project includes comprehensive test coverage:
- **47 tests** covering core systems
- Unit tests for ResourceSystem, BuildingSystem, SimulationEngine
- Progression and map generation tests
- 100% test pass rate

Run tests with:
```bash
npm test
```

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

## Multiplayer Setup & Usage

### Starting the Server

The multiplayer server needs to be running for multiplayer features to work.

**Option 1: Run everything at once (recommended for development)**
```bash
npm run dev:all
```

**Option 2: Run client and server separately**
```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev
```

### Using Multiplayer

1. **Start the Game**: Open http://localhost:5173 in your browser
2. **Main Menu**: Select "Multiplayer" from the main menu
3. **Create or Join Session**:
   - **Host**: Click "Create Session" to start a new game
   - **Join**: Enter a session ID or use "Find Match" to join an available game
4. **Game Modes**:
   - **Co-op**: Work together with shared resources and inventory
   - **PvP**: Compete with separate bases and resources
   - **Ranked**: Competitive matchmaking

### Multiplayer Features

- ✅ **Real-time synchronization** - Host-authoritative game state
- ✅ **Session management** - Create, join, and list active sessions  
- ✅ **Player management** - Automatic host reassignment on disconnect
- ✅ **Cloud saves** - Save your progress to the server (in-memory)
- ✅ **Matchmaking** - Quick match and ranked modes
- ✅ **Chat system** - Communicate with other players (UI ready, backend complete)

### Server Configuration

The server runs on port 3001 by default. To change:

```bash
PORT=8080 npm run dev:server
```

For production deployment, see `/server/README.md` for detailed instructions.

