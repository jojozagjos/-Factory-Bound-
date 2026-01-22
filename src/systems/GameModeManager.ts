import type { GameMode, VictoryCondition, GameState } from '../types/game'

/**
 * GameModeManager handles win/loss conditions and game state
 */
export class GameModeManager {
  private gameState: GameState
  private victoryConditions: VictoryCondition[]

  constructor(mode: GameMode) {
    this.gameState = {
      mode,
      startTime: Date.now(),
      playtime: 0,
      isPaused: false,
      isGameOver: false,
      victoryAchieved: false,
    }
    this.victoryConditions = this.initializeVictoryConditions(mode)
  }

  /**
   * Initialize victory conditions based on game mode
   */
  private initializeVictoryConditions(mode: GameMode): VictoryCondition[] {
    const conditions: VictoryCondition[] = []

    switch (mode) {
      case 'survival' as GameMode:
        conditions.push({
          type: 'survival' as GameMode,
          description: 'Survive for 30 minutes against enemy waves',
          isComplete: (state: GameState) => {
            return state.playtime >= 30 * 60 * 1000 // 30 minutes in ms
          },
        })
        break

      case 'production' as GameMode:
        conditions.push({
          type: 'production' as GameMode,
          description: 'Produce 1000 electronic circuits',
          isComplete: (_state: GameState) => {
            // This would check actual production count
            // For now, simplified check
            return false // TODO: Implement production tracking
          },
        })
        break

      case 'exploration' as GameMode:
        conditions.push({
          type: 'exploration' as GameMode,
          description: 'Research all technologies (tier 5)',
          isComplete: (_state: GameState) => {
            // This would check tech tree completion
            return false // TODO: Implement tech tree completion check
          },
        })
        break

      case 'custom' as GameMode:
        // Custom mode has no predefined conditions
        break
    }

    return conditions
  }

  /**
   * Update game state and check victory conditions
   */
  update(deltaTime: number): {
    isVictory: boolean
    isDefeat: boolean
  } {
    if (!this.gameState.isPaused && !this.gameState.isGameOver) {
      this.gameState.playtime += deltaTime
    }

    // Check victory conditions
    const isVictory = this.victoryConditions.some(condition => 
      condition.isComplete(this.gameState)
    )

    if (isVictory) {
      this.gameState.isGameOver = true
      this.gameState.victoryAchieved = true
    }

    return {
      isVictory,
      isDefeat: this.gameState.isGameOver && !this.gameState.victoryAchieved,
    }
  }

  /**
   * Check for defeat condition
   */
  checkDefeat(allMachinesDestroyed: boolean, playerDead: boolean): boolean {
    if (allMachinesDestroyed || playerDead) {
      this.gameState.isGameOver = true
      this.gameState.victoryAchieved = false
      return true
    }
    return false
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.gameState.isPaused = true
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.gameState.isPaused = false
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return { ...this.gameState }
  }

  /**
   * Get victory conditions
   */
  getVictoryConditions(): VictoryCondition[] {
    return [...this.victoryConditions]
  }

  /**
   * Calculate final score
   */
  calculateScore(
    enemiesKilled: number,
    itemsProduced: number,
    techsResearched: number,
    machinesBuilt: number
  ): number {
    const playTimeMinutes = this.gameState.playtime / (60 * 1000)
    
    let score = 0
    score += enemiesKilled * 100
    score += itemsProduced * 10
    score += techsResearched * 500
    score += machinesBuilt * 50

    // Time bonus (faster completion = higher score)
    if (this.gameState.victoryAchieved) {
      const timeFactor = Math.max(1, 60 - playTimeMinutes) / 60
      score = Math.floor(score * (1 + timeFactor))
    }

    return score
  }

  /**
   * Get formatted playtime
   */
  getFormattedPlaytime(): string {
    const totalSeconds = Math.floor(this.gameState.playtime / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Get progress toward victory
   */
  getVictoryProgress(): number {
    if (this.victoryConditions.length === 0) return 0

    const completedConditions = this.victoryConditions.filter(condition =>
      condition.isComplete(this.gameState)
    ).length

    return (completedConditions / this.victoryConditions.length) * 100
  }
}
