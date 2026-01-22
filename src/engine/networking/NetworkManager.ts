import { io, Socket } from 'socket.io-client'
import type { GameSession, Player, SaveData } from '../../types/game'

export interface NetworkMessage {
  type: string
  data: unknown
  timestamp: number
  senderId: string
}

export class NetworkManager {
  private socket: Socket | null = null
  private currentSession: GameSession | null = null
  private messageQueue: NetworkMessage[] = []
  // syncInterval reserved for future periodic state synchronization
  // private syncInterval: number = 50 // ms between sync updates

  constructor(private serverUrl: string = 'ws://localhost:3001') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      this.socket.on('connect', () => {
        console.log('Connected to game server')
        this.setupEventHandlers()
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        reject(error)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('session_created', (session: GameSession) => {
      this.currentSession = session
      console.log('Session created:', session.id)
    })

    this.socket.on('player_joined', (player: Player) => {
      console.log('Player joined:', player.username)
      if (this.currentSession) {
        this.currentSession.players.push(player)
      }
    })

    this.socket.on('player_left', (playerId: string) => {
      console.log('Player left:', playerId)
      if (this.currentSession) {
        this.currentSession.players = this.currentSession.players.filter(
          p => p.id !== playerId
        )
      }
    })

    this.socket.on('state_update', (data: Partial<SaveData>) => {
      // Handle incoming state updates
      this.messageQueue.push({
        type: 'state_update',
        data,
        timestamp: Date.now(),
        senderId: 'server',
      })
    })

    this.socket.on('game_action', (message: NetworkMessage) => {
      this.messageQueue.push(message)
    })
  }

  // Create a new multiplayer session
  createSession(settings: GameSession['settings']): Promise<GameSession> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('create_session', settings, (session: GameSession) => {
        this.currentSession = session
        resolve(session)
      })
    })
  }

  // Join an existing session
  joinSession(sessionId: string): Promise<GameSession> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      const player: Player = {
        id: 'player_' + Date.now(),
        username: 'Player',
        position: { x: 0, y: 0 },
        inventory: [],
        health: 100,
        maxHealth: 100,
        stats: {
          level: 1,
          experience: 0,
          prestigeLevel: 0,
          unlockedTech: [],
          completedResearch: [],
        },
      }

      this.socket.emit('join_session', { sessionId, player }, (result: { success: boolean; session?: GameSession; error?: string }) => {
        if (result.success && result.session) {
          this.currentSession = result.session
          resolve(result.session)
        } else {
          reject(new Error(result.error || 'Failed to join session'))
        }
      })
    })
  }

  // List available sessions
  listSessions(mode: 'coop' | 'pvp'): Promise<GameSession[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('list_sessions', { mode }, (result: { success: boolean; sessions?: GameSession[]; error?: string }) => {
        if (result.success && result.sessions) {
          resolve(result.sessions)
        } else {
          reject(new Error(result.error || 'Failed to list sessions'))
        }
      })
    })
  }

  // Start a session (for host)
  startSession(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('start_session', { sessionId }, (result: { success: boolean; error?: string }) => {
        if (result.success) {
          resolve()
        } else {
          reject(new Error(result.error || 'Failed to start session'))
        }
      })
    })
  }

  // Find match (for ranked or quick match)
  findMatch(isPvP: boolean): Promise<GameSession> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('find_match', { isPvP }, (result: { success: boolean; session?: GameSession; error?: string }) => {
        if (result.success && result.session) {
          this.currentSession = result.session
          resolve(result.session)
        } else {
          reject(new Error(result.error || 'No matches found'))
        }
      })
    })
  }

  // Send deterministic game action
  sendAction(action: NetworkMessage): void {
    if (!this.socket || !this.currentSession) return

    // Add timestamp for deterministic replay
    action.timestamp = Date.now()

    this.socket.emit('game_action', {
      sessionId: this.currentSession.id,
      action,
    })
  }

  // Get queued messages
  getMessages(): NetworkMessage[] {
    const messages = [...this.messageQueue]
    this.messageQueue = []
    return messages
  }

  // Sync game state (for host/server)
  syncState(state: Partial<SaveData>): void {
    if (!this.socket || !this.currentSession) return

    this.socket.emit('sync_state', {
      sessionId: this.currentSession.id,
      state,
      timestamp: Date.now(),
    })
  }

  // Ranked matchmaking
  async findRankedMatch(player: Player): Promise<GameSession> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('ranked_matchmaking', player, (result: { success: boolean; session?: GameSession; error?: string }) => {
        if (result.success && result.session) {
          this.currentSession = result.session
          resolve(result.session)
        } else {
          reject(new Error(result.error || 'Matchmaking failed'))
        }
      })
    })
  }

  // Cloud save operations
  async saveToCloud(saveData: SaveData, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('save_game', { playerId, saveData }, (result: { success: boolean; error?: string }) => {
        if (result.success) {
          resolve()
        } else {
          reject(new Error(result.error || 'Failed to save'))
        }
      })
    })
  }

  async loadFromCloud(playerId: string, saveId: string): Promise<SaveData> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'))
        return
      }

      this.socket.emit('load_game', { playerId, saveId }, (result: { success: boolean; saveData?: SaveData; error?: string }) => {
        if (result.success && result.saveData) {
          resolve(result.saveData)
        } else {
          reject(new Error(result.error || 'Failed to load'))
        }
      })
    })
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

// Local save manager
export class LocalSaveManager {
  private readonly STORAGE_KEY = 'factory_bound_saves'

  saveLocally(saveData: SaveData): void {
    const saves = this.getAllSaves()
    saves[saveData.sessionId] = saveData
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves))
  }

  loadLocally(sessionId: string): SaveData | null {
    const saves = this.getAllSaves()
    return saves[sessionId] || null
  }

  getAllSaves(): Record<string, SaveData> {
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  }

  deleteSave(sessionId: string): void {
    const saves = this.getAllSaves()
    delete saves[sessionId]
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves))
  }
}
