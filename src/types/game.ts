// Core game types
export interface Position {
  x: number
  y: number
}

export interface Vector2D extends Position {
  vx?: number
  vy?: number
}

// Building/Machine types
export enum MachineType {
  MINER = 'miner',
  ASSEMBLER = 'assembler',
  SMELTER = 'smelter',
  BELT = 'belt',
  INSERTER = 'inserter',
  POWER_PLANT = 'power_plant',
  TURRET = 'turret',
  STORAGE = 'storage',
}

export interface Machine {
  id: string
  type: MachineType
  position: Position
  rotation: number
  recipe?: Recipe
  inventory: Item[]
  power: PowerState
  health: number
  maxHealth: number
  nodeProgram?: NodeProgram
}

// Item and Recipe types
export interface Item {
  id: string
  name: string
  quantity: number
  icon?: string
}

export interface Recipe {
  id: string
  name: string
  inputs: Item[]
  outputs: Item[]
  craftingTime: number
}

// Power system
export interface PowerState {
  required: number
  available: number
  connected: boolean
  networkId?: string
}

// Node-based programming
export interface NodeProgram {
  id: string
  nodes: ProgramNode[]
  connections: NodeConnection[]
}

export interface ProgramNode {
  id: string
  type: 'input' | 'output' | 'logic' | 'condition' | 'action'
  position: Position
  data: Record<string, unknown>
}

export interface NodeConnection {
  id: string
  from: string
  to: string
  fromHandle: string
  toHandle: string
}

// World and Map
export interface WorldTile {
  x: number
  y: number
  type: 'grass' | 'stone' | 'ore' | 'water' | 'sand'
  resource?: Resource
}

export interface Resource {
  type: string
  amount: number
  richness: number
}

export interface WorldMap {
  seed: number
  width: number
  height: number
  tiles: Map<string, WorldTile>
  modifiers: WorldModifier[]
}

export interface WorldModifier {
  id: string
  name: string
  description: string
  effects: Record<string, number>
}

// Player and Progression
export interface Player {
  id: string
  username: string
  position: Position
  inventory: Item[]
  health: number
  maxHealth: number
  team?: string
  stats: PlayerStats
}

export interface PlayerStats {
  level: number
  experience: number
  prestigeLevel: number
  unlockedTech: string[]
  completedResearch: string[]
}

// Tech Tree
export interface TechNode {
  id: string
  name: string
  description: string
  paradigm: TechParadigm
  cost: Item[]
  dependencies: string[]
  unlocks: string[]
  researched: boolean
}

export enum TechParadigm {
  LOGISTICS = 'logistics',
  PRODUCTION = 'production',
  POWER = 'power',
  COMBAT = 'combat',
  RESEARCH = 'research',
}

// Multiplayer
export interface GameSession {
  id: string
  mode: 'coop' | 'pvp' | 'ranked'
  players: Player[]
  host: string
  state: 'lobby' | 'active' | 'paused' | 'ended'
  settings: GameSettings
}

export interface GameSettings {
  maxPlayers: number
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  pvpEnabled: boolean
  friendlyFire: boolean
  worldSeed: number
  modifiers: WorldModifier[]
}

// Save system
export interface SaveData {
  version: string
  timestamp: number
  sessionId: string
  world: WorldMap
  players: Player[]
  machines: Machine[]
  techTree: TechNode[]
  gameSettings: GameSettings
}

// Combat
export interface Projectile {
  id: string
  position: Position
  velocity: Vector2D
  damage: number
  owner: string
  team?: string
}

export interface Enemy {
  id: string
  type: string
  position: Position
  health: number
  maxHealth: number
  target?: string
}

// Ranking and Prestige
export interface PlayerRanking {
  playerId: string
  username: string
  rank: number
  rating: number
  wins: number
  losses: number
  prestigeLevel: number
}
