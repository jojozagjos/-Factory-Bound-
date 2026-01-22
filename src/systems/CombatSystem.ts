import type { Enemy, Projectile, Machine, Position, EnemyType, EnemyStats } from '../types/game'

/**
 * CombatSystem handles enemy spawning, AI, targeting, and combat mechanics
 */
export class CombatSystem {
  private enemyTypes: Map<EnemyType, Omit<EnemyStats, 'health' | 'maxHealth'>>

  constructor() {
    this.enemyTypes = new Map()
    this.initializeEnemyTypes()
  }

  /**
   * Initialize enemy type stats
   */
  private initializeEnemyTypes(): void {
    this.enemyTypes.set('biter' as EnemyType, {
      type: 'biter' as EnemyType,
      damage: 10,
      speed: 0.05,
      range: 1.5,
    })

    this.enemyTypes.set('spitter' as EnemyType, {
      type: 'spitter' as EnemyType,
      damage: 15,
      speed: 0.03,
      range: 8,
    })

    this.enemyTypes.set('behemoth' as EnemyType, {
      type: 'behemoth' as EnemyType,
      damage: 50,
      speed: 0.02,
      range: 2,
    })
  }

  /**
   * Spawn a new enemy
   */
  spawnEnemy(type: EnemyType, position: Position, wave: number = 1): Enemy {
    const baseStats = this.enemyTypes.get(type)
    if (!baseStats) {
      throw new Error(`Unknown enemy type: ${type}`)
    }

    // Scale health with wave number
    const baseHealth = this.getBaseHealth(type)
    const scaledHealth = baseHealth + (wave - 1) * baseHealth * 0.2

    return {
      id: `enemy_${type}_${Date.now()}_${Math.random()}`,
      type: type,
      position: { ...position },
      health: scaledHealth,
      maxHealth: scaledHealth,
    }
  }

  /**
   * Get base health for enemy type
   */
  private getBaseHealth(type: EnemyType): number {
    const healthMap: Record<EnemyType, number> = {
      biter: 50,
      spitter: 75,
      behemoth: 300,
    }
    return healthMap[type] || 50
  }

  /**
   * Find nearest target (machine) for enemy
   */
  findNearestTarget(enemy: Enemy, machines: Machine[]): Machine | null {
    if (machines.length === 0) return null

    let nearestMachine: Machine | null = null
    let minDistance = Infinity

    machines.forEach(machine => {
      const distance = this.calculateDistance(enemy.position, machine.position)
      if (distance < minDistance) {
        minDistance = distance
        nearestMachine = machine
      }
    })

    return nearestMachine
  }

  /**
   * Move enemy toward target
   */
  moveEnemyToward(enemy: Enemy, target: Position): void {
    const stats = this.enemyTypes.get(enemy.type as EnemyType)
    if (!stats) return

    const dx = target.x - enemy.position.x
    const dy = target.y - enemy.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0) {
      enemy.position.x += (dx / distance) * stats.speed
      enemy.position.y += (dy / distance) * stats.speed
    }
  }

  /**
   * Check if enemy is in range to attack
   */
  isInAttackRange(enemy: Enemy, target: Position): boolean {
    const stats = this.enemyTypes.get(enemy.type as EnemyType)
    if (!stats) return false

    const distance = this.calculateDistance(enemy.position, target)
    return distance <= stats.range
  }

  /**
   * Enemy attacks a machine
   */
  attackMachine(enemy: Enemy, machine: Machine): number {
    const stats = this.enemyTypes.get(enemy.type as EnemyType)
    if (!stats) return 0

    machine.health = Math.max(0, machine.health - stats.damage)
    return stats.damage
  }

  /**
   * Find nearest enemy in turret range
   */
  findTurretTarget(turret: Machine, enemies: Enemy[], range: number = 15): Enemy | null {
    if (enemies.length === 0) return null

    let nearestEnemy: Enemy | null = null
    let minDistance = Infinity

    enemies.forEach(enemy => {
      const distance = this.calculateDistance(turret.position, enemy.position)
      if (distance <= range && distance < minDistance) {
        minDistance = distance
        nearestEnemy = enemy
      }
    })

    return nearestEnemy
  }

  /**
   * Create projectile from turret to enemy
   */
  createProjectile(
    turret: Machine,
    target: Enemy,
    damage: number = 20
  ): Projectile {
    const dx = target.position.x - turret.position.x
    const dy = target.position.y - turret.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const speed = 0.5
    const vx = (dx / distance) * speed
    const vy = (dy / distance) * speed

    return {
      id: `projectile_${Date.now()}_${Math.random()}`,
      position: { x: turret.position.x, y: turret.position.y },
      velocity: { x: turret.position.x, y: turret.position.y, vx, vy },
      damage,
      owner: turret.id,
    }
  }

  /**
   * Update projectile position
   */
  updateProjectile(projectile: Projectile): void {
    projectile.position.x += projectile.velocity.vx || 0
    projectile.position.y += projectile.velocity.vy || 0
  }

  /**
   * Check if projectile hit enemy
   */
  checkProjectileHit(projectile: Projectile, enemy: Enemy): boolean {
    const distance = this.calculateDistance(projectile.position, enemy.position)
    return distance < 0.5 // Hit radius
  }

  /**
   * Apply damage to enemy
   */
  damageEnemy(enemy: Enemy, damage: number): boolean {
    enemy.health = Math.max(0, enemy.health - damage)
    return enemy.health <= 0
  }

  /**
   * Check if projectile is out of bounds
   */
  isProjectileOutOfBounds(
    projectile: Projectile,
    mapWidth: number,
    mapHeight: number
  ): boolean {
    return (
      projectile.position.x < 0 ||
      projectile.position.y < 0 ||
      projectile.position.x > mapWidth ||
      projectile.position.y > mapHeight
    )
  }

  /**
   * Consume ammo from turret
   */
  consumeAmmo(turret: Machine): boolean {
    const ammoItem = turret.inventory.find(
      item => item.name === 'ammo_magazine' || item.name === 'piercing_ammo'
    )
    
    if (!ammoItem || ammoItem.quantity <= 0) {
      return false
    }

    ammoItem.quantity--
    if (ammoItem.quantity <= 0) {
      const index = turret.inventory.indexOf(ammoItem)
      turret.inventory.splice(index, 1)
    }

    return true
  }

  /**
   * Calculate enemy drops on death
   */
  getEnemyDrops(enemy: Enemy): { name: string; quantity: number }[] {
    const baseDrops: Record<string, { name: string; quantity: number }[]> = {
      biter: [{ name: 'alien_artifact', quantity: 1 }],
      spitter: [
        { name: 'alien_artifact', quantity: 2 },
        { name: 'alien_goo', quantity: 1 },
      ],
      behemoth: [
        { name: 'alien_artifact', quantity: 5 },
        { name: 'alien_goo', quantity: 3 },
      ],
    }

    return baseDrops[enemy.type] || []
  }

  /**
   * Simple pathfinding: move toward target avoiding water
   */
  calculateNextPosition(
    current: Position,
    target: Position,
    obstacles: Position[]
  ): Position {
    const dx = target.x - current.x
    const dy = target.y - current.y
    
    // Simple direct movement for now
    // TODO: Implement A* pathfinding
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < 0.1) return current

    const nextX = current.x + (dx / distance) * 0.05
    const nextY = current.y + (dy / distance) * 0.05

    // Check if next position hits obstacle
    const hitObstacle = obstacles.some(
      obs => Math.abs(obs.x - nextX) < 0.5 && Math.abs(obs.y - nextY) < 0.5
    )

    if (hitObstacle) {
      // Try alternative path (perpendicular)
      return {
        x: current.x + (dy / distance) * 0.05,
        y: current.y - (dx / distance) * 0.05,
      }
    }

    return { x: nextX, y: nextY }
  }

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Spawn enemies in waves
   */
  spawnWave(
    waveNumber: number,
    mapWidth: number,
    mapHeight: number
  ): Enemy[] {
    const enemies: Enemy[] = []
    const enemyCount = Math.min(5 + waveNumber * 2, 50) // Cap at 50 enemies

    // Spawn points at map edges
    const spawnPoints: Position[] = [
      { x: 0, y: mapHeight / 2 }, // Left
      { x: mapWidth, y: mapHeight / 2 }, // Right
      { x: mapWidth / 2, y: 0 }, // Top
      { x: mapWidth / 2, y: mapHeight }, // Bottom
    ]

    for (let i = 0; i < enemyCount; i++) {
      const spawnPoint = spawnPoints[i % spawnPoints.length]
      let enemyType: EnemyType = 'biter' as EnemyType

      // More advanced enemies in later waves
      if (waveNumber >= 10) {
        enemyType = Math.random() < 0.3 ? ('behemoth' as EnemyType) : ('spitter' as EnemyType)
      } else if (waveNumber >= 5) {
        enemyType = Math.random() < 0.5 ? ('spitter' as EnemyType) : ('biter' as EnemyType)
      }

      // Add random offset to spawn position
      const offset = 5
      const position = {
        x: spawnPoint.x + (Math.random() - 0.5) * offset,
        y: spawnPoint.y + (Math.random() - 0.5) * offset,
      }

      enemies.push(this.spawnEnemy(enemyType, position, waveNumber))
    }

    return enemies
  }
}
