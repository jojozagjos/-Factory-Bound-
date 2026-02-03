// Shared types for the multiplayer server
export interface Player {
  id: string
  username: string
  socketId?: string
  position: { x: number; y: number }
  inventory: any[]
  health: number
  maxHealth: number
  isHost?: boolean
  isGuest?: boolean
  stats: {
    level: number
    experience: number
    prestigeLevel: number
    unlockedTech: string[]
    completedResearch: string[]
  }
}

export interface GameSession {
  id: string
  hostId: string
  players: Player[]
  settings: GameSettings
  status: 'waiting' | 'starting' | 'active' | 'ended'
  createdAt: number
  startedAt?: number
}

export interface GameSettings {
  mode: 'coop' | 'pvp' | 'ranked'
  maxPlayers: number
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  pvpEnabled: boolean
  friendlyFire: boolean
  worldSeed: number
  modifiers: string[]
  enemiesEnabled: boolean
  enemyFactoriesEnabled: boolean
  oceanEnemiesEnabled: boolean
  maxEnemyBases: number
}

export interface NetworkAction {
  id: string
  type: 'build' | 'remove' | 'interact' | 'pause' | 'research'
  playerId: string
  timestamp: number
  data: Record<string, unknown>
}

export interface SaveData {
  id: string
  name: string
  timestamp: number
  playtime: number
  gameState: any
  machines: any[]
  enemies: any[]
  projectiles: any[]
  player: Player
}
