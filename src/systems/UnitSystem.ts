import { buildermentPvpExpansion } from '../data/buildermentPvpExpansion'

export type UnitState = 'idle' | 'moving' | 'attacking' | 'dead'

export interface Unit {
  id: string
  type: string
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number // tiles per second
  damage: number
  range: number
  state: UnitState
  targetId?: string | null
  path?: { x: number; y: number }[]
  owner?: string // player id
  lastAttackTime?: number // Track last attack for cooldown
}

export class UnitSystem {
  units: Unit[] = []
  nextId = 1

  constructor() {}

  /** Spawn a unit at (x,y) with type from PvP data */
  spawnUnit(type: string, x: number, y: number, owner?: string): Unit | null {
    const unitDef = (buildermentPvpExpansion.units || []).find(u => u.id === type)
    if (!unitDef) return null

    const u: Unit = {
      id: `unit_${this.nextId++}`,
      type: unitDef.id,
      x,
      y,
      hp: unitDef.stats.hp,
      maxHp: unitDef.stats.hp,
      speed: unitDef.stats.speed,
      damage: unitDef.stats.damage,
      range: unitDef.stats.range,
      state: 'idle',
      owner: owner || 'local',
    }

    this.units.push(u)
    return u
  }

  /** Simple update called every tick with delta seconds */
  update(
    dt: number, 
    world: { 
      isTileBlocked?: (x: number, y: number) => boolean,
      machines?: Array<{ id: string; position: { x: number; y: number }; health: number; owner?: string }>,
      enemyUnits?: Unit[]
    } = {}
  ) {
    for (const u of this.units) {
      if (u.state === 'dead') continue
      
      // Handle attacking state
      if (u.state === 'attacking' && u.targetId) {
        const target = this.findTarget(u.targetId, world.machines || [], world.enemyUnits || [])
        
        if (!target) {
          // Target lost, go idle
          u.state = 'idle'
          u.targetId = null
          continue
        }

        // Calculate distance to target
        const dx = target.x - u.x
        const dy = target.y - u.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Check if in range to attack
        if (dist <= u.range) {
          // In range - attack every second
          if (!u.lastAttackTime || Date.now() - u.lastAttackTime >= 1000) {
            this.attackTarget(u, target)
            u.lastAttackTime = Date.now()
          }
        } else {
          // Move toward target
          const travel = u.speed * dt
          u.x += (dx / dist) * Math.min(travel, dist)
          u.y += (dy / dist) * Math.min(travel, dist)
        }
        continue
      }
      
      // Handle moving state - follow path if moving
      if (u.state === 'moving' && u.path && u.path.length > 0) {
        const next = u.path[0]
        const dx = next.x - u.x
        const dy = next.y - u.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const travel = u.speed * dt
        if (dist <= travel) {
          u.x = next.x
          u.y = next.y
          u.path.shift()
          if (u.path.length === 0) u.state = 'idle'
        } else {
          u.x += (dx / dist) * travel
          u.y += (dy / dist) * travel
        }
      }

      // Auto-engage nearby enemies if idle
      if (u.state === 'idle') {
        const nearbyEnemy = this.findNearbyEnemy(u, world.machines || [], world.enemyUnits || [])
        if (nearbyEnemy) {
          u.targetId = nearbyEnemy.id
          u.state = 'attacking'
        }
      }
    }

    // Cleanup dead
    this.units = this.units.filter(u => u.state !== 'dead')
  }

  /** Find a target by ID (could be a machine or another unit) */
  private findTarget(
    targetId: string,
    machines: Array<{ id: string; position: { x: number; y: number }; health: number; owner?: string }>,
    units: Unit[]
  ): { id: string; x: number; y: number; health: number; isUnit: boolean; owner?: string } | null {
    // Check machines
    const machine = machines.find(m => m.id === targetId)
    if (machine && machine.health > 0) {
      return {
        id: machine.id,
        x: machine.position.x,
        y: machine.position.y,
        health: machine.health,
        isUnit: false,
        owner: machine.owner,
      }
    }

    // Check units
    const unit = units.find(u => u.id === targetId)
    if (unit && unit.state !== 'dead') {
      return {
        id: unit.id,
        x: unit.x,
        y: unit.y,
        health: unit.hp,
        isUnit: true,
        owner: unit.owner,
      }
    }

    return null
  }

  /** Attack a target */
  private attackTarget(
    attacker: Unit,
    target: { id: string; x: number; y: number; health: number; isUnit: boolean }
  ): void {
    // Apply damage
    target.health -= attacker.damage
    
    // If target is a unit, update its HP
    if (target.isUnit) {
      const targetUnit = this.units.find(u => u.id === target.id)
      if (targetUnit) {
        targetUnit.hp -= attacker.damage
        if (targetUnit.hp <= 0) {
          targetUnit.state = 'dead'
        }
      }
    }
    
    console.log(`Unit ${attacker.id} attacked ${target.id} for ${attacker.damage} damage`)
  }

  /** Find nearby enemy within auto-engage range */
  private findNearbyEnemy(
    unit: Unit,
    machines: Array<{ id: string; position: { x: number; y: number }; health: number; owner?: string }>,
    units: Unit[]
  ): { id: string } | null {
    const engageRange = unit.range * 1.5 // Auto-engage at 1.5x attack range

    // Find nearest enemy unit
    let nearestEnemy: { id: string; dist: number } | null = null
    
    for (const other of units) {
      if (other.owner === unit.owner || other.state === 'dead') continue
      
      const dx = other.x - unit.x
      const dy = other.y - unit.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist <= engageRange && (!nearestEnemy || dist < nearestEnemy.dist)) {
        nearestEnemy = { id: other.id, dist }
      }
    }

    // Find nearest enemy building
    for (const machine of machines) {
      if (machine.owner === unit.owner || machine.health <= 0) continue
      
      const dx = machine.position.x - unit.x
      const dy = machine.position.y - unit.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist <= engageRange && (!nearestEnemy || dist < nearestEnemy.dist)) {
        nearestEnemy = { id: machine.id, dist }
      }
    }

    return nearestEnemy
  }

  /** Assign a move command (path) to a set of units */
  commandMove(unitIds: string[], path: { x: number; y: number }[]) {
    for (const id of unitIds) {
      const u = this.units.find(x => x.id === id)
      if (!u) continue
      u.path = path.map(p => ({ x: p.x, y: p.y }))
      u.state = 'moving'
      u.targetId = null
    }
  }

  /** Assign attack command: set target id (machine/unit) and switch to attacking */
  commandAttack(unitIds: string[], targetId: string) {
    for (const id of unitIds) {
      const u = this.units.find(x => x.id === id)
      if (!u) continue
      u.targetId = targetId
      u.state = 'attacking'
      // attack movement logic to approach target will be handled in update
    }
  }

  /** Simple pathfinder stub: returns straight-line tile path (to be replaced with A*) */
  findPath(sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] {
    // Naive straight-line interpolation on integer tiles
    const path: { x: number; y: number }[] = []
    const steps = Math.max(Math.abs(Math.round(tx - sx)), Math.abs(Math.round(ty - sy)))
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const x = sx + (tx - sx) * t
      const y = sy + (ty - sy) * t
      path.push({ x: Math.round(x), y: Math.round(y) })
    }
    return path
  }

  getUnitsInArea(x1: number, y1: number, x2: number, y2: number): Unit[] {
    const minx = Math.min(x1, x2)
    const maxx = Math.max(x1, x2)
    const miny = Math.min(y1, y2)
    const maxy = Math.max(y1, y2)
    return this.units.filter(u => u.x >= minx && u.x <= maxx && u.y >= miny && u.y <= maxy)
  }
}

export const unitSystem = new UnitSystem()
