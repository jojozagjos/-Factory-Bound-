import { v4 as uuidv4 } from 'uuid'
import type { GameSession, GameSettings, Player } from './types.js'

export class SessionManager {
  private sessions: Map<string, GameSession> = new Map()
  private playerToSession: Map<string, string> = new Map()

  createSession(hostPlayer: Player, settings: GameSettings): GameSession {
    const session: GameSession = {
      id: uuidv4(),
      hostId: hostPlayer.id,
      players: [{ ...hostPlayer, isHost: true }],
      settings,
      status: 'waiting',
      createdAt: Date.now(),
    }

    this.sessions.set(session.id, session)
    this.playerToSession.set(hostPlayer.id, session.id)

    console.log(`[SessionManager] Created session ${session.id} for host ${hostPlayer.username}`)
    return session
  }

  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId)
  }

  listSessions(mode?: 'coop' | 'pvp' | 'ranked'): GameSession[] {
    const sessions = Array.from(this.sessions.values())
    
    if (mode) {
      return sessions.filter(s => 
        (s.settings.gameMode === mode || s.settings.mode === mode) && 
        s.status === 'waiting'
      )
    }
    
    return sessions.filter(s => s.status === 'waiting')
  }

  joinSession(sessionId: string, player: Player): { success: boolean; session?: GameSession; error?: string } {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'waiting') {
      return { success: false, error: 'Session already started' }
    }

    if (session.players.length >= session.settings.maxPlayers) {
      return { success: false, error: 'Session is full' }
    }

    // Mark as guest if not host
    const playerWithRole = { ...player, isGuest: true, isHost: false }
    session.players.push(playerWithRole)
    this.playerToSession.set(player.id, sessionId)

    console.log(`[SessionManager] Player ${player.username} joined session ${sessionId}`)
    return { success: true, session }
  }

  startSession(sessionId: string): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'waiting') {
      return { success: false, error: 'Session already started' }
    }

    session.status = 'active'
    session.startedAt = Date.now()

    console.log(`[SessionManager] Started session ${sessionId}`)
    return { success: true }
  }

  removePlayer(playerId: string): { session?: GameSession; wasHost: boolean } {
    const sessionId = this.playerToSession.get(playerId)
    
    if (!sessionId) {
      return { wasHost: false }
    }

    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return { wasHost: false }
    }

    const wasHost = session.hostId === playerId
    session.players = session.players.filter(p => p.id !== playerId)
    this.playerToSession.delete(playerId)

    // If host left, assign new host or end session
    if (wasHost) {
      if (session.players.length > 0) {
        const newHost = session.players[0]
        session.hostId = newHost.id
        newHost.isHost = true
        newHost.isGuest = false
        console.log(`[SessionManager] New host for session ${sessionId}: ${newHost.username}`)
      } else {
        // No players left, delete session
        this.sessions.delete(sessionId)
        console.log(`[SessionManager] Deleted empty session ${sessionId}`)
        return { wasHost: true }
      }
    }

    console.log(`[SessionManager] Player ${playerId} removed from session ${sessionId}`)
    return { session, wasHost }
  }

  getSessionForPlayer(playerId: string): GameSession | undefined {
    const sessionId = this.playerToSession.get(playerId)
    return sessionId ? this.sessions.get(sessionId) : undefined
  }

  updatePlayerSocket(playerId: string, socketId: string): void {
    const session = this.getSessionForPlayer(playerId)
    if (session) {
      const player = session.players.find(p => p.id === playerId)
      if (player) {
        player.socketId = socketId
      }
    }
  }
}
