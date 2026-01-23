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
  BASE = 'base', // Player's main base
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
  isBase?: boolean // Flag for starting base
  baseEntrances?: Position[] // For base type, absolute grid coordinates of 4 entrances
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

// Global statistics that persist across all saves
export interface GlobalStats {
  totalMachinesPlaced: number
  totalMachinesDestroyed: number
  totalResourcesGathered: number
  totalItemsCrafted: number
  totalEnemiesKilled: number
  totalPlaytime: number // in seconds
  totalGamesPlayed: number
  totalGamesWon: number
  rankedWins: number
  rankedLosses: number
  currentRank: string
  badges: Badge[]
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
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

// Tutorial System
export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector or element ID to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  objective?: string
  completionCondition?: (state: GameState) => boolean
}

export interface TutorialState {
  isActive: boolean
  currentStep: number
  completedSteps: string[]
  skipped: boolean
}

// Building System
export interface BuildingGhost {
  type: MachineType
  position: Position
  rotation: number
  isValid: boolean // Can be placed at this location
}

export interface BuildingCost {
  machineType: MachineType
  costs: Item[]
  requiredTech?: string
}

// Combat System
export enum EnemyType {
  BITER = 'biter',
  SPITTER = 'spitter',
  BEHEMOTH = 'behemoth',
}

export interface EnemyStats {
  type: EnemyType
  health: number
  maxHealth: number
  damage: number
  speed: number
  range: number
}

export interface CombatEvent {
  id: string
  type: 'damage' | 'death' | 'spawn'
  timestamp: number
  sourceId: string
  targetId?: string
  data: Record<string, unknown>
}

// Save System
export interface SaveMetadata {
  id: string
  name: string
  timestamp: number
  playtime: number
  level: number
  version: string
}

export interface SaveSlot {
  metadata: SaveMetadata
  data: SaveData
}

// Game Mode
export enum GameMode {
  SURVIVAL = 'survival',
  PRODUCTION = 'production',
  EXPLORATION = 'exploration',
  CUSTOM = 'custom',
}

export interface VictoryCondition {
  type: GameMode
  description: string
  isComplete: (state: GameState) => boolean
}

export interface GameState {
  mode: GameMode
  startTime: number
  playtime: number
  isPaused: boolean
  isGameOver: boolean
  victoryAchieved: boolean
}

// Notifications
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement'
  title: string
  message: string
  duration?: number
  timestamp: number
}

// Achievement System
export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt?: number
  icon?: string
  category: 'building' | 'combat' | 'research' | 'production' | 'exploration'
}
