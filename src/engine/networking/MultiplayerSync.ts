/**
 * Multiplayer networking strategy:
 * - HOST-AUTHORITATIVE model: host runs full simulation, clients send inputs
 * - Server (if present) arbitrates host authority and handles disconnections
 * - Deterministic replays via action timestamping
 * - Delta compression for large state (machines, enemies, projectiles)
 * 
 * Flow:
 * 1. Host owns simulation engine, physics, machine execution
 * 2. Clients send machine build/remove actions, player input
 * 3. Host validates actions, executes simulation tick
 * 4. Host broadcasts delta state and event log to clients
 * 5. Clients render received state
 * 6. On disconnect: host reassigns to remaining player, or session ends
 */

export interface NetworkAction {
  id: string
  type: 'build' | 'remove' | 'interact' | 'pause' | 'research'
  playerId: string
  timestamp: number
  data: Record<string, unknown>
}

export interface StateDelta {
  tick: number
  timestamp: number
  changes: {
    machines: Array<{ id: string; updates: Record<string, unknown> }>
    enemies: Array<{ id: string; updates: Record<string, unknown> }>
    projectiles: Array<{ id: string; updates: Record<string, unknown> }>
  }
  events: Array<{ type: string; data: Record<string, unknown> }>
}

export class HostAuthoritativeSync {
  /**
   * Validate action before committing to simulation
   */
  validateAction(action: NetworkAction): { valid: boolean; reason?: string } {
    if (!action.type || !action.playerId) {
      return { valid: false, reason: 'Missing required fields' }
    }

    if (action.timestamp > Date.now() + 5000) {
      return { valid: false, reason: 'Action timestamp too far in future' }
    }

    return { valid: true }
  }

  /**
   * Compress state changes to send minimal data
   */
  compressState(machines: any[], enemies: any[], projectiles: any[], tick: number): StateDelta {
    return {
      tick,
      timestamp: Date.now(),
      changes: {
        machines: machines.map(m => ({ id: m.id, updates: { position: m.position, health: m.health, power: m.power } })),
        enemies: enemies.map(e => ({ id: e.id, updates: { position: e.position, health: e.health } })),
        projectiles: projectiles.map(p => ({ id: p.id, updates: { position: p.position } })),
      },
      events: [],
    }
  }

  /**
   * On player disconnect: check if host left
   */
  handlePlayerDisconnect(playerId: string, hostId: string, players: string[]): { newHostId?: string; shouldEndSession: boolean } {
    if (playerId === hostId) {
      // Host left
      if (players.length > 1) {
        return { newHostId: players[0], shouldEndSession: false }
      } else {
        return { shouldEndSession: true }
      }
    }

    // Regular player left
    return { shouldEndSession: false }
  }

  /**
   * Replay action log for late-join or reconnection
   */
  replayActions(actions: NetworkAction[], fromTick: number, toTick: number): NetworkAction[] {
    return actions.filter(a => {
      // Rough tick estimate from timestamp
      const estimatedTick = Math.floor((a.timestamp / 16.67)) // ~60 FPS
      return estimatedTick >= fromTick && estimatedTick <= toTick
    })
  }
}

/**
 * Example: Host-side multiplayer orchestrator
 */
export class MultiplayerHost {
  private hostAuthSync = new HostAuthoritativeSync()
  private actionQueue: NetworkAction[] = []
  private tick = 0

  /**
   * Receive action from a remote client
   */
  receiveAction(action: NetworkAction): void {
    const validation = this.hostAuthSync.validateAction(action)
    if (!validation.valid) {
      console.warn('Invalid action:', validation.reason)
      return
    }

    this.actionQueue.push(action)
  }

  /**
   * Per-tick: process queued actions, run simulation, broadcast state
   */
  simulationTick(machines: any[], enemies: any[], projectiles: any[]): { actions: NetworkAction[]; stateDelta: any } {
    // Sort actions by timestamp for determinism
    this.actionQueue.sort((a, b) => a.timestamp - b.timestamp)

    // Execute actions (would call BuildingSystem.place, etc.)
    const executedActions = this.actionQueue.splice(0)
    executedActions.forEach(action => {
      this.executeAction(action, machines)
    })

    // Run simulation engine
    // ... (SimulationEngine.update(16.67, machines, enemies, projectiles))

    // Compress and broadcast state
    const delta = this.hostAuthSync.compressState(machines, enemies, projectiles, this.tick)
    this.tick++

    return { actions: executedActions, stateDelta: delta }
  }

  private executeAction(action: NetworkAction, _machines: any[]): void {
    switch (action.type) {
      case 'build':
        // Call BuildingSystem.place(...)
        console.log(`[Host] Player ${action.playerId} building at`, action.data.position)
        break
      case 'remove':
        console.log(`[Host] Player ${action.playerId} removing machine`, action.data.machineId)
        break
      case 'interact':
        console.log(`[Host] Player ${action.playerId} interacting with`, action.data.machineId)
        break
      default:
        console.warn('Unknown action type:', action.type)
    }
  }
}
