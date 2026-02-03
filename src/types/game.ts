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
  // Basic Production
  MINER = 'miner',
  MINER_T2 = 'miner_t2',
  MINER_T3 = 'miner_t3',
  
  // Smelting
  SMELTER = 'smelter',
  STEEL_FURNACE = 'steel_furnace',
  ELECTRIC_FURNACE = 'electric_furnace',
  
  // Assembly
  ASSEMBLER = 'assembler',
  ASSEMBLER_T2 = 'assembler_t2',
  ASSEMBLER_T3 = 'assembler_t3',
  
  // Logistics
  BELT = 'belt',
  FAST_BELT = 'fast_belt',
  EXPRESS_BELT = 'express_belt',
  INSERTER = 'inserter',
  FAST_INSERTER = 'fast_inserter',
  STACK_INSERTER = 'stack_inserter',
  SPLITTER = 'splitter',
  UNDERGROUND_BELT = 'underground_belt',
  
  // Transport Vehicles
  BOAT_1 = 'boat_1',
  BOAT_2 = 'boat_2',
  BOAT_3 = 'boat_3',
  BOAT_4 = 'boat_4',
  TRAIN_1 = 'train_1',
  TRAIN_2 = 'train_2',
  TRAIN_3 = 'train_3',
  TRAIN_4 = 'train_4',
  
  // Transport Stations
  DOCK_STATION = 'dock_station',
  RAIL_STATION = 'rail_station',
  
  // Power
  POWER_PLANT = 'power_plant',
  SOLAR_PANEL = 'solar_panel',
  ACCUMULATOR = 'accumulator',
  
  // Combat
  TURRET = 'turret',
  LASER_TURRET = 'laser_turret',
  WALL = 'wall',
  
  // Military (PVP)
  BARRACKS = 'barracks',
  VEHICLE_FACTORY = 'vehicle_factory',
  TURRET_GUN = 'turret_gun',
  TURRET_CANNON = 'turret_cannon',

  // Storage & Special
  STORAGE = 'storage',
  RESEARCH_LAB = 'research_lab',
}

export interface VehicleRoute {
  id: string
  waypointIds: string[] // IDs of dock/rail stations in order
  currentWaypointIndex: number
  isActive: boolean
  loop: boolean // If true, return to start after reaching end
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
  route?: VehicleRoute // For boats/trains: programmed route
  currentRouteTarget?: string // Current destination waypoint ID
  routeProgress?: number // 0-1 progress to current waypoint
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
  isGuest?: boolean // True for multiplayer guests (limited permissions)
  isHost?: boolean // True for lobby host
  cash?: number // In-game currency (Builderment-style)
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

// Machine unlock system (Builderment-style)
export interface MachineUnlock {
  machineType: MachineType
  requiredDeliveries: Item[] // Resources that must be delivered to base to unlock
  unlocked: boolean
  order: number // Unlock order/tier
}

// Base resource delivery tracking
export interface ResourceDelivery {
  itemName: string
  quantityDelivered: number
  quantityRequired: number
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
  researchProgress?: number // 0-100, for research in progress
  researchTime?: number // Time in seconds to complete research
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
  // New Builderment-style settings
  enemiesEnabled: boolean
  enemyFactoriesEnabled: boolean
  oceanEnemiesEnabled: boolean
  maxEnemyBases: number
  gameMode: 'automation' | 'coop' | 'pvp' | 'ranked'
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
  machineUnlocks?: MachineUnlock[]
  resourceDeliveries?: ResourceDelivery[]
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
  spawnedFrom?: string // ID of enemy factory that spawned this enemy
}

// Enemy factory/base system
export interface EnemyFactory {
  id: string
  position: Position
  health: number
  maxHealth: number
  spawnRate: number // Enemies per minute
  lastSpawnTime: number
  isOceanBase: boolean // Spawned from ocean
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
  price?: number // cash cost to place this building
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
