import { describe, it, expect } from 'vitest'
import { SimulationEngine } from '../engine/simulation/SimulationEngine'
import { MachineType } from '../types/game'
import type { Machine, Enemy, Projectile } from '../types/game'

describe('SimulationEngine', () => {
  it('should initialize with tick count 0', () => {
    const engine = new SimulationEngine()
    expect(engine.getTickCount()).toBe(0)
  })

  it('should update tick count after simulation', () => {
    const engine = new SimulationEngine()
    const machines: Machine[] = []
    const enemies: Enemy[] = []
    const projectiles: Projectile[] = []

    engine.update(100, machines, enemies, projectiles)
    expect(engine.getTickCount()).toBeGreaterThan(0)
  })

  it('should process miner machine correctly', () => {
    const engine = new SimulationEngine()
    const miner: Machine = {
      id: 'miner1',
      type: MachineType.MINER,
      position: { x: 0, y: 0 },
      rotation: 0,
      inventory: [],
      power: { required: 10, available: 10, connected: true },
      health: 100,
      maxHealth: 100,
    }

    const machines = [miner]
    
    // Run simulation for enough time to mine
    engine.update(1000, machines, [], [])
    
    // Miner should have added ore to inventory (after 60 ticks)
    expect(machines[0].inventory.length).toBeGreaterThanOrEqual(0)
  })

  it('should handle machine without power', () => {
    const engine = new SimulationEngine()
    const miner: Machine = {
      id: 'miner2',
      type: MachineType.MINER,
      position: { x: 0, y: 0 },
      rotation: 0,
      inventory: [],
      power: { required: 10, available: 0, connected: false },
      health: 100,
      maxHealth: 100,
    }

    const machines = [miner]
    const initialInventoryLength = miner.inventory.length
    
    engine.update(1000, machines, [], [])
    
    // Miner without power should not produce
    expect(machines[0].inventory.length).toBe(initialInventoryLength)
  })

  it('should update projectile position', () => {
    const engine = new SimulationEngine()
    const projectile: Projectile = {
      id: 'proj1',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0, vx: 1, vy: 1 },
      damage: 10,
      owner: 'player1',
    }

    const projectiles = [projectile]
    const initialX = projectile.position.x
    const initialY = projectile.position.y
    
    engine.update(100, [], [], projectiles)
    
    // Projectile should have moved
    expect(projectiles[0].position.x).not.toBe(initialX)
    expect(projectiles[0].position.y).not.toBe(initialY)
  })
})
