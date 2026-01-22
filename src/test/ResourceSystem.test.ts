import { describe, it, expect, beforeEach } from 'vitest'
import { ResourceSystem } from '../systems/ResourceSystem'
import { MachineType } from '../types/game'
import type { Machine, WorldTile } from '../types/game'

describe('ResourceSystem', () => {
  let resourceSystem: ResourceSystem

  beforeEach(() => {
    resourceSystem = new ResourceSystem()
  })

  describe('Recipe Management', () => {
    it('should return all recipes', () => {
      const recipes = resourceSystem.getAllRecipes()
      expect(recipes.length).toBeGreaterThan(0)
      expect(recipes.length).toBeGreaterThanOrEqual(15) // At least 15 recipes
    })

    it('should get recipe by id', () => {
      const recipe = resourceSystem.getRecipe('iron_plate')
      expect(recipe).toBeDefined()
      expect(recipe?.name).toBe('Iron Plate')
      expect(recipe?.inputs.length).toBeGreaterThan(0)
      expect(recipe?.outputs.length).toBeGreaterThan(0)
    })

    it('should return undefined for non-existent recipe', () => {
      const recipe = resourceSystem.getRecipe('non_existent')
      expect(recipe).toBeUndefined()
    })
  })

  describe('Crafting Logic', () => {
    it('should check if machine has ingredients', () => {
      const machine: Machine = {
        id: 'test1',
        type: 'assembler' as MachineType,
        position: { x: 0, y: 0 },
        rotation: 0,
        inventory: [
          { id: '1', name: 'iron_ore', quantity: 5 },
        ],
        power: { required: 100, available: 100, connected: true },
        health: 100,
        maxHealth: 100,
        recipe: {
          id: 'iron_plate',
          name: 'Iron Plate',
          inputs: [{ id: '1', name: 'iron_ore', quantity: 1 }],
          outputs: [{ id: '2', name: 'iron_plate', quantity: 1 }],
          craftingTime: 3.2,
        },
      }

      expect(resourceSystem.hasIngredients(machine)).toBe(true)
    })

    it('should return false when ingredients are missing', () => {
      const machine: Machine = {
        id: 'test2',
        type: 'assembler' as MachineType,
        position: { x: 0, y: 0 },
        rotation: 0,
        inventory: [],
        power: { required: 100, available: 100, connected: true },
        health: 100,
        maxHealth: 100,
        recipe: {
          id: 'iron_plate',
          name: 'Iron Plate',
          inputs: [{ id: '1', name: 'iron_ore', quantity: 1 }],
          outputs: [{ id: '2', name: 'iron_plate', quantity: 1 }],
          craftingTime: 3.2,
        },
      }

      expect(resourceSystem.hasIngredients(machine)).toBe(false)
    })

    it('should consume ingredients correctly', () => {
      const machine: Machine = {
        id: 'test3',
        type: 'assembler' as MachineType,
        position: { x: 0, y: 0 },
        rotation: 0,
        inventory: [
          { id: '1', name: 'iron_ore', quantity: 5 },
        ],
        power: { required: 100, available: 100, connected: true },
        health: 100,
        maxHealth: 100,
        recipe: {
          id: 'iron_plate',
          name: 'Iron Plate',
          inputs: [{ id: '1', name: 'iron_ore', quantity: 1 }],
          outputs: [{ id: '2', name: 'iron_plate', quantity: 1 }],
          craftingTime: 3.2,
        },
      }

      const result = resourceSystem.consumeIngredients(machine)
      expect(result).toBe(true)
      expect(machine.inventory[0].quantity).toBe(4)
    })

    it('should produce outputs correctly', () => {
      const machine: Machine = {
        id: 'test4',
        type: 'assembler' as MachineType,
        position: { x: 0, y: 0 },
        rotation: 0,
        inventory: [],
        power: { required: 100, available: 100, connected: true },
        health: 100,
        maxHealth: 100,
        recipe: {
          id: 'iron_plate',
          name: 'Iron Plate',
          inputs: [{ id: '1', name: 'iron_ore', quantity: 1 }],
          outputs: [{ id: '2', name: 'iron_plate', quantity: 1 }],
          craftingTime: 3.2,
        },
      }

      resourceSystem.produceOutputs(machine)
      expect(machine.inventory.length).toBe(1)
      expect(machine.inventory[0].name).toBe('iron_plate')
      expect(machine.inventory[0].quantity).toBe(1)
    })
  })

  describe('Mining', () => {
    it('should mine resources from tile', () => {
      const tile: WorldTile = {
        x: 0,
        y: 0,
        type: 'ore',
        resource: {
          type: 'iron_ore',
          amount: 100,
          richness: 1,
        },
      }

      const minedItem = resourceSystem.mineResource(tile, 5)
      expect(minedItem).toBeDefined()
      expect(minedItem?.name).toBe('iron_ore')
      expect(minedItem?.quantity).toBe(5)
      expect(tile.resource?.amount).toBe(95)
    })

    it('should return null when no resource exists', () => {
      const tile: WorldTile = {
        x: 0,
        y: 0,
        type: 'grass',
      }

      const minedItem = resourceSystem.mineResource(tile)
      expect(minedItem).toBeNull()
    })
  })

  describe('Inventory Management', () => {
    it('should add item to empty inventory', () => {
      const inventory: Array<{ id: string; name: string; quantity: number }> = []
      const newItem = { id: '1', name: 'iron_ore', quantity: 10 }

      const result = resourceSystem.addToInventory(inventory, newItem)
      expect(result).toBe(true)
      expect(inventory.length).toBe(1)
      expect(inventory[0].quantity).toBe(10)
    })

    it('should stack items when adding to inventory', () => {
      const inventory = [
        { id: '1', name: 'iron_ore', quantity: 10 },
      ]
      const newItem = { id: '2', name: 'iron_ore', quantity: 5 }

      resourceSystem.addToInventory(inventory, newItem)
      expect(inventory.length).toBe(1)
      expect(inventory[0].quantity).toBe(15)
    })

    it('should respect stack limit', () => {
      const inventory = [
        { id: '1', name: 'iron_ore', quantity: 95 },
      ]
      const newItem = { id: '2', name: 'iron_ore', quantity: 10 }

      const result = resourceSystem.addToInventory(inventory, newItem, 100)
      expect(result).toBe(false) // Can't fit all 10
      expect(inventory[0].quantity).toBe(100)
    })

    it('should remove item from inventory', () => {
      const inventory = [
        { id: '1', name: 'iron_ore', quantity: 10 },
      ]

      const result = resourceSystem.removeFromInventory(inventory, 'iron_ore', 5)
      expect(result).toBe(true)
      expect(inventory[0].quantity).toBe(5)
    })

    it('should remove item completely when quantity reaches 0', () => {
      const inventory = [
        { id: '1', name: 'iron_ore', quantity: 5 },
      ]

      resourceSystem.removeFromInventory(inventory, 'iron_ore', 5)
      expect(inventory.length).toBe(0)
    })

    it('should return false when removing more than available', () => {
      const inventory = [
        { id: '1', name: 'iron_ore', quantity: 5 },
      ]

      const result = resourceSystem.removeFromInventory(inventory, 'iron_ore', 10)
      expect(result).toBe(false)
      expect(inventory[0].quantity).toBe(5)
    })
  })
})
