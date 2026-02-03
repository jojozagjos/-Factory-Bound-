import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import { SessionManager } from './SessionManager.js'
import type { Player, GameSettings, NetworkAction, SaveData } from './types.js'

const app = express()
const httpServer = createServer(app)

// Configure Socket.io with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Middleware
app.use(cors())
app.use(express.json())

// Session manager
const sessionManager = new SessionManager()

// In-memory storage for cloud saves (in production, use a database)
const cloudSaves = new Map<string, Map<string, SaveData>>()

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`)

  // Create session
  socket.on('create_session', (settings: GameSettings, callback) => {
    try {
      // Create a temporary player for the host
      const hostPlayer: Player = {
        id: `player_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        username: 'Host Player',
        socketId: socket.id,
        position: { x: 0, y: 0 },
        inventory: [],
        health: 100,
        maxHealth: 100,
        isHost: true,
        stats: {
          level: 1,
          experience: 0,
          prestigeLevel: 0,
          unlockedTech: [],
          completedResearch: [],
        },
      }

      const session = sessionManager.createSession(hostPlayer, settings)
      
      // Join the socket room
      socket.join(session.id)
      
      console.log(`[Server] Session created: ${session.id}`)
      callback(session)
    } catch (error) {
      console.error('[Server] Error creating session:', error)
      callback({ error: 'Failed to create session' })
    }
  })

  // Join session
  socket.on('join_session', ({ sessionId, player }: { sessionId: string; player: Player }, callback) => {
    try {
      const result = sessionManager.joinSession(sessionId, { ...player, socketId: socket.id })
      
      if (result.success && result.session) {
        socket.join(sessionId)
        
        // Notify other players in the session
        socket.to(sessionId).emit('player_joined', player)
        
        console.log(`[Server] Player ${player.username} joined session ${sessionId}`)
        callback(result)
      } else {
        callback(result)
      }
    } catch (error) {
      console.error('[Server] Error joining session:', error)
      callback({ success: false, error: 'Failed to join session' })
    }
  })

  // List available sessions
  socket.on('list_sessions', ({ mode }: { mode?: 'coop' | 'pvp' | 'ranked' }, callback) => {
    try {
      const sessions = sessionManager.listSessions(mode)
      callback({ success: true, sessions })
    } catch (error) {
      console.error('[Server] Error listing sessions:', error)
      callback({ success: false, error: 'Failed to list sessions' })
    }
  })

  // Start session
  socket.on('start_session', ({ sessionId }: { sessionId: string }, callback) => {
    try {
      const result = sessionManager.startSession(sessionId)
      
      if (result.success) {
        // Notify all players in the session
        io.to(sessionId).emit('session_started', { sessionId })
        console.log(`[Server] Session ${sessionId} started`)
      }
      
      callback(result)
    } catch (error) {
      console.error('[Server] Error starting session:', error)
      callback({ success: false, error: 'Failed to start session' })
    }
  })

  // Find match (simple matchmaking)
  socket.on('find_match', ({ isPvP }: { isPvP: boolean }, callback) => {
    try {
      const mode = isPvP ? 'pvp' : 'coop'
      const availableSessions = sessionManager.listSessions(mode)
      
      if (availableSessions.length > 0) {
        // Join the first available session
        const session = availableSessions[0]
        
        const player: Player = {
          id: `player_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          username: 'Player',
          socketId: socket.id,
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
        
        const result = sessionManager.joinSession(session.id, player)
        
        if (result.success) {
          socket.join(session.id)
          socket.to(session.id).emit('player_joined', player)
          callback({ success: true, session: result.session })
        } else {
          callback({ success: false, error: 'Failed to join match' })
        }
      } else {
        callback({ success: false, error: 'No matches found' })
      }
    } catch (error) {
      console.error('[Server] Error finding match:', error)
      callback({ success: false, error: 'Matchmaking failed' })
    }
  })

  // Game action (from clients to broadcast)
  socket.on('game_action', ({ sessionId, action }: { sessionId: string; action: NetworkAction }) => {
    try {
      const session = sessionManager.getSession(sessionId)
      
      if (session) {
        // Broadcast action to all players in the session
        socket.to(sessionId).emit('game_action', action)
        console.log(`[Server] Broadcasting action from ${action.playerId} in session ${sessionId}`)
      }
    } catch (error) {
      console.error('[Server] Error handling game action:', error)
    }
  })

  // State synchronization (from host to clients)
  socket.on('sync_state', ({ sessionId, state, timestamp, isFullSync }: { 
    sessionId: string; 
    state: any; 
    timestamp: number; 
    isFullSync: boolean 
  }) => {
    try {
      // Broadcast state update to all other players
      socket.to(sessionId).emit('state_update', { state, timestamp, isFullSync })
      
      if (isFullSync) {
        console.log(`[Server] Full state sync for session ${sessionId}`)
      }
    } catch (error) {
      console.error('[Server] Error syncing state:', error)
    }
  })

  // Request full sync (from client to host)
  socket.on('request_sync', ({ sessionId, timestamp }: { sessionId: string; timestamp: number }) => {
    try {
      const session = sessionManager.getSession(sessionId)
      
      if (session) {
        // Forward request to the host
        const hostSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.id === session.players.find(p => p.isHost)?.socketId)
        
        if (hostSocket) {
          hostSocket.emit('sync_requested', { playerId: socket.id, timestamp })
        }
      }
    } catch (error) {
      console.error('[Server] Error requesting sync:', error)
    }
  })

  // Cloud save operations
  socket.on('save_game', ({ playerId, saveData }: { playerId: string; saveData: SaveData }, callback) => {
    try {
      if (!cloudSaves.has(playerId)) {
        cloudSaves.set(playerId, new Map())
      }
      
      const playerSaves = cloudSaves.get(playerId)!
      playerSaves.set(saveData.id, saveData)
      
      console.log(`[Server] Saved game ${saveData.id} for player ${playerId}`)
      callback({ success: true })
    } catch (error) {
      console.error('[Server] Error saving game:', error)
      callback({ success: false, error: 'Failed to save game' })
    }
  })

  socket.on('load_game', ({ playerId, saveId }: { playerId: string; saveId: string }, callback) => {
    try {
      const playerSaves = cloudSaves.get(playerId)
      
      if (playerSaves && playerSaves.has(saveId)) {
        const saveData = playerSaves.get(saveId)
        console.log(`[Server] Loaded game ${saveId} for player ${playerId}`)
        callback({ success: true, saveData })
      } else {
        callback({ success: false, error: 'Save not found' })
      }
    } catch (error) {
      console.error('[Server] Error loading game:', error)
      callback({ success: false, error: 'Failed to load game' })
    }
  })

  // Ranked matchmaking (simplified version)
  socket.on('ranked_matchmaking', (player: Player, callback) => {
    try {
      // For now, just treat it like regular matchmaking
      const rankedSessions = sessionManager.listSessions('ranked')
      
      if (rankedSessions.length > 0) {
        const session = rankedSessions[0]
        const result = sessionManager.joinSession(session.id, { ...player, socketId: socket.id })
        
        if (result.success) {
          socket.join(session.id)
          socket.to(session.id).emit('player_joined', player)
          callback({ success: true, session: result.session })
        } else {
          callback({ success: false, error: 'Failed to join ranked match' })
        }
      } else {
        callback({ success: false, error: 'No ranked matches available' })
      }
    } catch (error) {
      console.error('[Server] Error in ranked matchmaking:', error)
      callback({ success: false, error: 'Matchmaking failed' })
    }
  })

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`[Server] Client disconnected: ${socket.id}`)
    
    // Find and remove player from their session
    // In a production system, you'd track socket-to-player mapping
    // For now, we'll just log the disconnect
  })
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`[Server] Factory Bound multiplayer server running on port ${PORT}`)
  console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    console.log('[Server] Server closed')
    process.exit(0)
  })
})
