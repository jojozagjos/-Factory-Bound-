import type { Machine, Enemy, Projectile } from '../../types/game'
import { ResourceSystem } from '../../systems/ResourceSystem'
import { CombatSystem } from '../../systems/CombatSystem'

export class SimulationEngine {
  private tickCount = 0
  private readonly tickRate = 60 // 60 ticks per second
  private lastUpdateTime = 0
  private resourceSystem: ResourceSystem
  private combatSystem: CombatSystem
  private turretCooldowns: Map<string, number>

  constructor() {
    this.tickCount = 0
    this.resourceSystem = new ResourceSystem()
    this.combatSystem = new CombatSystem()
    this.turretCooldowns = new Map()
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

    // Update turrets separately (they need enemies and projectiles)
    machines.forEach(machine => {
      if (machine.type === 'turret' && machine.power.connected && machine.power.available >= machine.power.required) {
        this.updateTurret(machine, enemies, projectiles)
      }
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
        // Turret needs access to enemies and projectiles
        // This will be handled in the tick method
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

    // Check if we have ingredients using ResourceSystem
    if (this.resourceSystem.hasIngredients(machine)) {
      // Consume ingredients
      this.resourceSystem.consumeIngredients(machine)
      
      // Produce outputs
      this.resourceSystem.produceOutputs(machine)
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

  private updateTurret(machine: Machine, enemies: Enemy[], projectiles: Projectile[]): void {
    // Check cooldown
    const cooldown = this.turretCooldowns.get(machine.id) || 0
    if (cooldown > 0) {
      this.turretCooldowns.set(machine.id, cooldown - 1)
      return
    }

    // Find nearest enemy in range
    const target = this.combatSystem.findTurretTarget(machine, enemies, 15)
    if (!target) return

    // Check if turret has ammo
    if (!this.combatSystem.consumeAmmo(machine)) return

    // Create projectile
    const projectile = this.combatSystem.createProjectile(machine, target, 20)
    projectiles.push(projectile)

    // Set cooldown (60 ticks = 1 second)
    this.turretCooldowns.set(machine.id, 30) // 0.5 second cooldown
  }

  private updateEnemy(enemy: Enemy, machines: Machine[]): void {
    // Find nearest machine using combat system
    const target = this.combatSystem.findNearestTarget(enemy, machines)
    if (!target) return

    // Move toward target
    this.combatSystem.moveEnemyToward(enemy, target.position)

    // Check if in attack range
    if (this.combatSystem.isInAttackRange(enemy, target.position)) {
      // Attack machine (damage applied every second)
      if (this.tickCount % 60 === 0) {
        this.combatSystem.attackMachine(enemy, target)
      }
    }
  }

  private updateProjectile(
    projectile: Projectile, 
    enemies: Enemy[], 
    removedEntities: string[]
  ): void {
    // Move projectile using combat system
    this.combatSystem.updateProjectile(projectile)

    // Check collision with enemies
    for (const enemy of enemies) {
      if (this.combatSystem.checkProjectileHit(projectile, enemy)) {
        const killed = this.combatSystem.damageEnemy(enemy, projectile.damage)
        removedEntities.push(projectile.id)
        
        // Mark enemy for removal if killed
        if (killed) {
          // Enemy will be removed in cleanupDeadEntities
        }
        break
      }
    }

    // Check if out of bounds (remove if so)
    // Assume max map size of 1000x1000
    if (this.combatSystem.isProjectileOutOfBounds(projectile, 1000, 1000)) {
      removedEntities.push(projectile.id)
    }
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
    if (!machine.nodeProgram) return

    // Simple node execution - evaluate each node
    const { nodes, connections } = machine.nodeProgram
    
    // Store node outputs
    const nodeOutputs: Map<string, unknown> = new Map()

    // Process nodes in order (simplified - real impl would need topological sort)
    nodes.forEach(node => {
      switch (node.type) {
        case 'input':
          // Sensor nodes - read machine state
          if (node.data.sensor === 'inventory_count') {
            nodeOutputs.set(node.id, machine.inventory.reduce((sum, item) => sum + item.quantity, 0))
          } else if (node.data.sensor === 'power_status') {
            nodeOutputs.set(node.id, machine.power.connected ? 1 : 0)
          } else if (node.data.sensor === 'health') {
            nodeOutputs.set(node.id, machine.health / machine.maxHealth)
          }
          break

        case 'logic': {
          // Logic nodes - perform operations
          const inputs = connections
            .filter(conn => conn.to === node.id)
            .map(conn => nodeOutputs.get(conn.from) as number || 0)
          
          if (node.data.operation === 'compare_gt') {
            nodeOutputs.set(node.id, inputs[0] > (node.data.value as number || 0) ? 1 : 0)
          } else if (node.data.operation === 'compare_lt') {
            nodeOutputs.set(node.id, inputs[0] < (node.data.value as number || 0) ? 1 : 0)
          } else if (node.data.operation === 'and') {
            nodeOutputs.set(node.id, inputs.every(v => v > 0) ? 1 : 0)
          } else if (node.data.operation === 'or') {
            nodeOutputs.set(node.id, inputs.some(v => v > 0) ? 1 : 0)
          }
          break
        }

        case 'output': {
          // Action nodes - control machine behavior
          const outputInputs = connections
            .filter(conn => conn.to === node.id)
            .map(conn => nodeOutputs.get(conn.from) as number || 0)
          
          const shouldActivate = outputInputs.some(v => v > 0)
          
          if (node.data.action === 'enable_machine') {
            // Enable/disable machine based on input
            machine.power.required = shouldActivate ? this.getDefaultPowerRequirement(machine.type) : 0
          }
          break
        }
      }
    })
  }

  private getDefaultPowerRequirement(type: string): number {
    const powerMap: Record<string, number> = {
      miner: 90,
      assembler: 150,
      smelter: 180,
      belt: 5,
      inserter: 13,
      turret: 40,
    }
    return powerMap[type] || 0
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
