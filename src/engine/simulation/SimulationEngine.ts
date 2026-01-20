import type { Machine, Item, Recipe, PowerState, Enemy, Projectile } from '../../types/game'

export class SimulationEngine {
  private tickCount = 0
  private readonly tickRate = 60 // 60 ticks per second
  private lastUpdateTime = 0

  constructor() {
    this.tickCount = 0
  }

  // Deterministic update - same inputs always produce same outputs
  update(deltaTime: number, machines: Machine[], enemies: Enemy[], projectiles: Projectile[]): {
    machines: Machine[]
    enemies: Enemy[]
    projectiles: Projectile[]
    removedEntities: string[]
  } {
    const fixedDelta = 1000 / this.tickRate
    this.lastUpdateTime += deltaTime

    const removedEntities: string[] = []

    while (this.lastUpdateTime >= fixedDelta) {
      this.tick(machines, enemies, projectiles, removedEntities)
      this.lastUpdateTime -= fixedDelta
      this.tickCount++
    }

    return { machines, enemies, projectiles, removedEntities }
  }

  private tick(
    machines: Machine[], 
    enemies: Enemy[], 
    projectiles: Projectile[],
    removedEntities: string[]
  ): void {
    // Update machines
    machines.forEach(machine => {
      this.updateMachine(machine, machines)
    })

    // Update enemies
    enemies.forEach(enemy => {
      this.updateEnemy(enemy, machines)
    })

    // Update projectiles
    projectiles.forEach(projectile => {
      this.updateProjectile(projectile, enemies, removedEntities)
    })

    // Remove dead entities
    this.cleanupDeadEntities(enemies, projectiles, removedEntities)
  }

  private updateMachine(machine: Machine, allMachines: Machine[]): void {
    if (!machine.power.connected || machine.power.available < machine.power.required) {
      return // No power, no operation
    }

    switch (machine.type) {
      case 'miner':
        this.updateMiner(machine)
        break
      case 'assembler':
        this.updateAssembler(machine)
        break
      case 'belt':
        this.updateBelt(machine, allMachines)
        break
      case 'inserter':
        this.updateInserter(machine, allMachines)
        break
      case 'turret':
        this.updateTurret(machine)
        break
    }

    // Execute node program if present
    if (machine.nodeProgram) {
      this.executeNodeProgram(machine)
    }
  }

  private updateMiner(machine: Machine): void {
    // Mining logic - extract resources from ground
    if (machine.inventory.length < 10) {
      // Simplified: add ore every few ticks
      if (this.tickCount % 60 === 0) {
        const existingOre = machine.inventory.find(item => item.name === 'iron_ore')
        if (existingOre) {
          existingOre.quantity += 1
        } else {
          machine.inventory.push({
            id: `ore_${Date.now()}`,
            name: 'iron_ore',
            quantity: 1,
          })
        }
      }
    }
  }

  private updateAssembler(machine: Machine): void {
    if (!machine.recipe) return

    // Check if we have ingredients
    const hasIngredients = machine.recipe.inputs.every(input => {
      const item = machine.inventory.find(i => i.name === input.name)
      return item && item.quantity >= input.quantity
    })

    if (hasIngredients) {
      // Consume ingredients
      machine.recipe.inputs.forEach(input => {
        const item = machine.inventory.find(i => i.name === input.name)!
        item.quantity -= input.quantity
      })

      // Produce outputs
      machine.recipe.outputs.forEach(output => {
        const existingItem = machine.inventory.find(i => i.name === output.name)
        if (existingItem) {
          existingItem.quantity += output.quantity
        } else {
          machine.inventory.push({ ...output })
        }
      })
    }
  }

  private updateBelt(machine: Machine, allMachines: Machine[]): void {
    // Transport items to next belt or machine
    if (machine.inventory.length > 0) {
      // Find next machine in direction
      const nextPos = this.getNextPosition(machine.position, machine.rotation)
      const nextMachine = allMachines.find(
        m => m.position.x === nextPos.x && m.position.y === nextPos.y
      )

      if (nextMachine && nextMachine.inventory.length < 10) {
        const item = machine.inventory.shift()
        if (item) {
          nextMachine.inventory.push(item)
        }
      }
    }
  }

  private updateInserter(machine: Machine, allMachines: Machine[]): void {
    // Pick up from one machine and place in another
    const sourcePos = this.getNextPosition(machine.position, machine.rotation)
    const targetPos = this.getNextPosition(machine.position, (machine.rotation + 180) % 360)

    const source = allMachines.find(m => m.position.x === sourcePos.x && m.position.y === sourcePos.y)
    const target = allMachines.find(m => m.position.x === targetPos.x && m.position.y === targetPos.y)

    if (source && target && source.inventory.length > 0 && target.inventory.length < 10) {
      const item = source.inventory.shift()
      if (item) {
        target.inventory.push(item)
      }
    }
  }

  private updateTurret(machine: Machine): void {
    // Turret logic handled separately in combat system
  }

  private updateEnemy(enemy: Enemy, machines: Machine[]): void {
    // Simple AI: move toward nearest machine
    if (enemy.target) {
      const target = machines.find(m => m.id === enemy.target)
      if (target) {
        const dx = target.position.x - enemy.position.x
        const dy = target.position.y - enemy.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 1) {
          enemy.position.x += (dx / distance) * 0.1
          enemy.position.y += (dy / distance) * 0.1
        } else {
          // Attack
          target.health -= 1
        }
      }
    }
  }

  private updateProjectile(
    projectile: Projectile, 
    enemies: Enemy[], 
    removedEntities: string[]
  ): void {
    // Move projectile
    projectile.position.x += projectile.velocity.vx || 0
    projectile.position.y += projectile.velocity.vy || 0

    // Check collision with enemies
    enemies.forEach(enemy => {
      const dx = enemy.position.x - projectile.position.x
      const dy = enemy.position.y - projectile.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 1) {
        enemy.health -= projectile.damage
        removedEntities.push(projectile.id)
      }
    })
  }

  private cleanupDeadEntities(
    enemies: Enemy[], 
    projectiles: Projectile[], 
    removedEntities: string[]
  ): void {
    // Remove dead enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].health <= 0) {
        removedEntities.push(enemies[i].id)
        enemies.splice(i, 1)
      }
    }

    // Remove consumed projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (removedEntities.includes(projectiles[i].id)) {
        projectiles.splice(i, 1)
      }
    }
  }

  private executeNodeProgram(machine: Machine): void {
    // Execute visual programming logic
    // This would evaluate the node graph and control machine behavior
    // Simplified for now
  }

  private getNextPosition(pos: { x: number; y: number }, rotation: number): { x: number; y: number } {
    const rad = (rotation * Math.PI) / 180
    return {
      x: Math.round(pos.x + Math.cos(rad)),
      y: Math.round(pos.y + Math.sin(rad)),
    }
  }

  getTickCount(): number {
    return this.tickCount
  }
}
