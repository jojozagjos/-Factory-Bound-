# Game Architecture Documentation

## Overview

Factory Bound is built using a modern web stack with React, TypeScript, and a deterministic simulation engine. The architecture emphasizes modularity, testability, and multiplayer safety.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ MainMenu │  │GameCanvas│  │   HUD    │  │NodeEdit ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              State Management (Zustand)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Game State, Player State, World State, UI State │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Game Engines                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Simulation   │  │ Procedural   │  │ Progression  │ │
│  │   Engine     │  │  Generator   │  │   System     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐                                      │
│  │  Network     │                                      │
│  │  Manager     │                                      │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Simulation Engine

**Location**: `/src/engine/simulation/SimulationEngine.ts`

**Responsibilities**:
- Deterministic game logic execution
- Fixed timestep updates (60 ticks per second)
- Machine processing
- Combat calculations
- Physics simulation

**Key Features**:
- Lock-step simulation for multiplayer
- Deterministic random number generation
- State reconciliation
- Input prediction

**API**:
```typescript
class SimulationEngine {
  update(deltaTime: number, machines: Machine[], enemies: Enemy[], projectiles: Projectile[]): SimulationResult
  getTickCount(): number
}
```

### 2. Procedural Generator

**Location**: `/src/engine/procedural/MapGenerator.ts`

**Responsibilities**:
- Seeded world generation
- Terrain generation using noise algorithms
- Resource placement
- Spawn point calculation

**Key Features**:
- Deterministic generation (same seed = same world)
- Configurable world modifiers
- Biome system
- Resource density control

**API**:
```typescript
class ProceduralGenerator {
  constructor(seed: number)
  generateMap(width: number, height: number, modifiers?: WorldModifier[]): WorldMap
  generateSpawnPoints(map: WorldMap, count: number): Position[]
}
```

### 3. Progression System

**Location**: `/src/engine/progression/ProgressionSystem.ts`

**Responsibilities**:
- Tech tree management
- Experience and leveling
- Prestige mechanics
- Meta progression tracking

**Key Features**:
- Five tech paradigms (Logistics, Production, Power, Combat, Research)
- Dependency-based unlocking
- Prestige bonuses
- Meta progression multipliers

**API**:
```typescript
class ProgressionSystem {
  getTechTree(): TechNode[]
  canResearch(techId: string, playerStats: PlayerStats): boolean
  researchTech(techId: string): boolean
  addExperience(playerStats: PlayerStats, amount: number): void
  calculatePrestigeReward(level: number): PrestigeReward
  getMetaProgressionBonuses(prestigeLevel: number): MetaBonuses
}
```

### 4. Network Manager

**Location**: `/src/engine/networking/NetworkManager.ts`

**Responsibilities**:
- Multiplayer session management
- State synchronization
- Matchmaking
- Cloud save operations

**Key Features**:
- WebSocket-based communication
- Client-server architecture
- State reconciliation
- Lag compensation

**API**:
```typescript
class NetworkManager {
  connect(): Promise<void>
  createSession(settings: GameSettings): Promise<GameSession>
  joinSession(sessionId: string, player: Player): Promise<GameSession>
  sendAction(action: NetworkMessage): void
  syncState(state: Partial<SaveData>): void
  findRankedMatch(player: Player): Promise<GameSession>
  saveToCloud(saveData: SaveData, playerId: string): Promise<void>
  loadFromCloud(playerId: string, saveId: string): Promise<SaveData>
}
```

## State Management

### Store Structure

```typescript
interface GameState {
  // Session
  session: GameSession | null
  currentPlayer: Player | null
  
  // World
  worldMap: WorldMap | null
  machines: Machine[]
  
  // Progression
  techTree: TechNode[]
  
  // UI State
  selectedMachine: Machine | null
  isPaused: boolean
  showInventory: boolean
  
  // Actions
  setSession: (session: GameSession) => void
  setPlayer: (player: Player) => void
  setWorldMap: (map: WorldMap) => void
  addMachine: (machine: Machine) => void
  removeMachine: (id: string) => void
  updateMachine: (id: string, updates: Partial<Machine>) => void
  selectMachine: (id: string | null) => void
  togglePause: () => void
  toggleInventory: () => void
  unlockTech: (techId: string) => void
  saveGame: () => SaveData
  loadGame: (data: SaveData) => void
}
```

## Data Flow

### Single Player Game Loop

1. **User Input** → React event handlers
2. **State Update** → Zustand store actions
3. **Simulation** → SimulationEngine.update()
4. **State Sync** → Store updated with simulation results
5. **Render** → React components re-render
6. **Repeat** → requestAnimationFrame

### Multiplayer Game Loop

1. **User Input** → React event handlers
2. **Create Action** → NetworkMessage
3. **Send to Server** → NetworkManager.sendAction()
4. **Server Broadcast** → All clients receive action
5. **Deterministic Simulation** → All clients run same simulation
6. **State Verification** → Periodic state checksums
7. **Render** → React components re-render
8. **Repeat** → requestAnimationFrame

## Performance Optimizations

### Rendering
- Canvas-based rendering for game world
- Virtual scrolling for large inventories
- React.memo for expensive components
- requestAnimationFrame for smooth animations

### Simulation
- Spatial partitioning for collision detection
- Dirty flag system for changed entities
- Object pooling for frequently created/destroyed objects
- Web Workers for heavy calculations (future)

### Networking
- Binary message encoding (future)
- State delta compression
- Client-side prediction
- Server reconciliation

## Security Considerations

### Client-Side
- Input validation
- State verification
- Rate limiting on actions
- Sanitized user inputs

### Server-Side (Future Backend)
- Authentication and authorization
- Session validation
- Anti-cheat measures
- Rate limiting
- Input validation

## Scalability

### Horizontal Scaling
- Stateless game servers
- Redis for session storage
- Load balancer for matchmaking
- Database sharding for user data

### Vertical Scaling
- Optimized simulation algorithms
- Efficient data structures
- Memory pooling
- CPU profiling and optimization

## Testing Strategy

### Unit Tests
- Core engine logic (SimulationEngine, ProceduralGenerator)
- Progression calculations
- State management actions
- Network message handling

### Integration Tests
- Full game loop
- Multiplayer synchronization
- Save/load functionality
- UI interactions

### Performance Tests
- Simulation performance benchmarks
- Rendering performance
- Memory usage
- Network latency

## Future Enhancements

1. **Graphics**
   - WebGL/Three.js 3D rendering
   - Particle effects
   - Advanced lighting

2. **Gameplay**
   - More machine types
   - Advanced recipes
   - Research trees expansion
   - Mod support

3. **Multiplayer**
   - Voice chat
   - Text chat
   - Player trading
   - Alliances

4. **Backend**
   - Dedicated game servers
   - Persistent world servers
   - Cloud save synchronization
   - Leaderboards and rankings

5. **Mobile**
   - Touch controls
   - Mobile-optimized UI
   - Cross-platform play
