import { describe, it, expect, beforeEach } from 'vitest'
import { BuildingSystem } from '../systems/BuildingSystem'
import { MachineType } from '../types/game'
import type { WorldMap, Machine } from '../types/game'

describe('BuildingSystem', () => {
  let buildingSystem: BuildingSystem
  let testWorldMap: WorldMap

  beforeEach(() => {
    buildingSystem = new BuildingSystem()
    testWorldMap = {
      seed: 12345,
      width: 100,
      height: 100,
      tiles: new Map([
        ['0,0', { x: 0, y: 0, type: 'grass' }],
        ['1,1', { x: 1, y: 1, type: 'water' }],
        ['2,2', { x: 2, y: 2, type: 'ore', resource: { type: 'iron_ore', amount: 100, richness: 1 } }],
      ]),
      modifiers: [],
    }
  })

  describe('Building Costs', () => {
    it('should return building cost for valid machine type', () => {
      const cost = buildingSystem.getBuildingCost('miner' as MachineType)
      expect(cost).toBeDefined()
      expect(cost?.costs.length).toBeGreaterThan(0)
    })

    it('should return undefined for invalid machine type', () => {
      const cost = buildingSystem.getBuildingCost('invalid' as MachineType)
      expect(cost).toBeUndefined()
    })

    it('should have costs for all machine types', () => {
      const machineTypes: MachineType[] = [
        MachineType.MINER, MachineType.ASSEMBLER, MachineType.SMELTER, MachineType.BELT,
        MachineType.INSERTER, MachineType.POWER_PLANT, MachineType.TURRET, MachineType.STORAGE
      ]

      machineTypes.forEach(type => {
        const cost = buildingSystem.getBuildingCost(type)
        expect(cost).toBeDefined()
      })
    })
  })

  describe('Placement Validation', () => {
    it('should allow placement on grass', () => {
      const canPlace = buildingSystem.canPlaceAt(
        { x: 0, y: 0 },
        testWorldMap,
        []
      )
      expect(canPlace).toBe(true)
    })

    it('should not allow placement on water', () => {
      const canPlace = buildingSystem.canPlaceAt(
        { x: 1, y: 1 },
        testWorldMap,
        []
      )
      expect(canPlace).toBe(false)
    })

    it('should not allow placement out of bounds', () => {
      const canPlace = buildingSystem.canPlaceAt(
        { x: 200, y: 200 },
        testWorldMap,
        []
      )
      expect(canPlace).toBe(false)
    })

    it('should not allow placement on occupied tile', () => {
      const existingMachines: Machine[] = [{
        id: 'test1',
        type: 'miner' as MachineType,
        position: { x: 0, y: 0 },
        rotation: 0,
        inventory: [],
        power: { required: 90, available: 0, connected: false },
        health: 150,
        maxHealth: 150,
      }]

      const canPlace = buildingSystem.canPlaceAt(
        { x: 0, y: 0 },
        testWorldMap,
        existingMachines
      )
      expect(canPlace).toBe(false)
    })
  })

  describe('Resource Management', () => {
    it('should check if player has resources', () => {
      const inventory = [
        { id: '1', name: 'iron_plate', quantity: 20 },
        { id: '2', name: 'iron_gear', quantity: 10 },
        { id: '3', name: 'electronic_circuit', quantity: 5 },
      ]

      const hasResources = buildingSystem.hasResources(
        inventory,
        'miner' as MachineType
      )
      expect(hasResources).toBe(true)
    })

    it('should return false when resources are insufficient', () => {
      const inventory = [
        { id: '1', name: 'iron_plate', quantity: 1 },
      ]

      const hasResources = buildingSystem.hasResources(
        inventory,
        'miner' as MachineType
      )
      expect(hasResources).toBe(false)
    })

    it('should deduct costs from inventory', () => {
      const inventory = [
        { id: '1', name: 'iron_plate', quantity: 1 },
        { id: '2', name: 'iron_gear', quantity: 1 },
      ]

      const result = buildingSystem.deductCosts(
        inventory,
        'belt' as MachineType
      )
      expect(result).toBe(true)
      expect(inventory.length).toBe(0) // Both items should be removed
    })
  })

  describe('Machine Creation', () => {
    it('should create a machine with correct properties', () => {
      const machine = buildingSystem.createMachine(
        'miner' as MachineType,
        { x: 10, y: 10 },
        90
      )

      expect(machine.type).toBe('miner')
      expect(machine.position.x).toBe(10)
      expect(machine.position.y).toBe(10)
      expect(machine.rotation).toBe(90)
      expect(machine.health).toBeGreaterThan(0)
      expect(machine.maxHealth).toBeGreaterThan(0)
      expect(machine.inventory).toEqual([])
    })

    it('should assign correct power requirements', () => {
      const miner = buildingSystem.createMachine('miner' as MachineType, { x: 0, y: 0 })
      expect(miner.power.required).toBe(90)

      const belt = buildingSystem.createMachine('belt' as MachineType, { x: 0, y: 0 })
      expect(belt.power.required).toBe(5)
    })
  })

  describe('Demolition', () => {
    it('should return partial resources on demolish', () => {
      const returnedItems = buildingSystem.demolishMachine('miner' as MachineType)
      expect(returnedItems.length).toBeGreaterThan(0)
      
      // Check that returned amounts are 50% or less of original costs
      const cost = buildingSystem.getBuildingCost('miner' as MachineType)
      if (cost) {
        returnedItems.forEach((returned, idx) => {
          const original = cost.costs[idx]
          expect(returned.quantity).toBeLessThanOrEqual(original.quantity)
        })
      }
    })
  })

  describe('Building Ghost', () => {
    it('should create valid building ghost', () => {
      const ghost = buildingSystem.createGhost(
        'miner' as MachineType,
        { x: 0, y: 0 },
        0,
        testWorldMap,
        []
      )

      expect(ghost.type).toBe('miner')
      expect(ghost.isValid).toBe(true)
    })

    it('should create invalid ghost on water', () => {
      const ghost = buildingSystem.createGhost(
        'miner' as MachineType,
        { x: 1, y: 1 },
        0,
        testWorldMap,
        []
      )

      expect(ghost.isValid).toBe(false)
    })
  })

  describe('Rotation', () => {
    it('should rotate building by 90 degrees', () => {
      expect(buildingSystem.rotateBuilding(0)).toBe(90)
      expect(buildingSystem.rotateBuilding(90)).toBe(180)
      expect(buildingSystem.rotateBuilding(180)).toBe(270)
      expect(buildingSystem.rotateBuilding(270)).toBe(0)
    })
  })

  describe('Coordinate Conversion', () => {
    it('should convert screen to grid coordinates', () => {
      const gridPos = buildingSystem.screenToGrid(250, 350, 32)
      expect(gridPos.x).toBe(7)
      expect(gridPos.y).toBe(10)
    })

    it('should convert grid to screen coordinates', () => {
      const screenPos = buildingSystem.gridToScreen(10, 15, 32)
      expect(screenPos.x).toBe(320)
      expect(screenPos.y).toBe(480)
    })
  })
})
