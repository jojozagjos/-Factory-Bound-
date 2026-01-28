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
  update(dt: number, _world: { isTileBlocked?: (x: number, y: number) => boolean } = {}) {
    for (const u of this.units) {
      if (u.state === 'dead') continue
      // follow path if moving
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

      // TODO: attacking logic, target selection, simple AI
    }

    // Cleanup dead
    this.units = this.units.filter(u => u.state !== 'dead')
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
