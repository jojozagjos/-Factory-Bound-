import type { Item, Recipe, Machine, WorldTile } from '../types/game'

/**
 * ResourceSystem handles mining mechanics, crafting, and recipe management
 */
export class ResourceSystem {
  private recipes: Map<string, Recipe>

  constructor() {
    this.recipes = new Map()
    this.initializeRecipes()
  }

  /**
   * Initialize all available recipes
   */
  private initializeRecipes(): void {
    const recipeDefinitions: Recipe[] = [
      // Basic smelting
      {
        id: 'iron_plate',
        name: 'Iron Plate',
        inputs: [{ id: 'iron_ore_input', name: 'iron_ore', quantity: 1 }],
        outputs: [{ id: 'iron_plate_output', name: 'iron_plate', quantity: 1 }],
        craftingTime: 3.2,
      },
      {
        id: 'copper_plate',
        name: 'Copper Plate',
        inputs: [{ id: 'copper_ore_input', name: 'copper_ore', quantity: 1 }],
        outputs: [{ id: 'copper_plate_output', name: 'copper_plate', quantity: 1 }],
        craftingTime: 3.2,
      },
      {
        id: 'stone_brick',
        name: 'Stone Brick',
        inputs: [{ id: 'stone_input', name: 'stone', quantity: 2 }],
        outputs: [{ id: 'stone_brick_output', name: 'stone_brick', quantity: 1 }],
        craftingTime: 3.2,
      },
      // Intermediate products
      {
        id: 'copper_wire',
        name: 'Copper Wire',
        inputs: [{ id: 'copper_plate_input', name: 'copper_plate', quantity: 1 }],
        outputs: [{ id: 'copper_wire_output', name: 'copper_wire', quantity: 2 }],
        craftingTime: 0.5,
      },
      {
        id: 'iron_gear',
        name: 'Iron Gear Wheel',
        inputs: [{ id: 'iron_plate_input', name: 'iron_plate', quantity: 2 }],
        outputs: [{ id: 'iron_gear_output', name: 'iron_gear', quantity: 1 }],
        craftingTime: 0.5,
      },
      {
        id: 'electronic_circuit',
        name: 'Electronic Circuit',
        inputs: [
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 1 },
          { id: 'copper_wire_input', name: 'copper_wire', quantity: 3 },
        ],
        outputs: [{ id: 'circuit_output', name: 'electronic_circuit', quantity: 1 }],
        craftingTime: 0.5,
      },
      // Components
      {
        id: 'inserter',
        name: 'Inserter',
        inputs: [
          { id: 'iron_gear_input', name: 'iron_gear', quantity: 1 },
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 1 },
          { id: 'circuit_input', name: 'electronic_circuit', quantity: 1 },
        ],
        outputs: [{ id: 'inserter_output', name: 'inserter', quantity: 1 }],
        craftingTime: 0.5,
      },
      {
        id: 'transport_belt',
        name: 'Transport Belt',
        inputs: [
          { id: 'iron_gear_input', name: 'iron_gear', quantity: 1 },
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 1 },
        ],
        outputs: [{ id: 'belt_output', name: 'transport_belt', quantity: 2 }],
        craftingTime: 0.5,
      },
      {
        id: 'assembler',
        name: 'Assembling Machine',
        inputs: [
          { id: 'iron_gear_input', name: 'iron_gear', quantity: 5 },
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 9 },
          { id: 'circuit_input', name: 'electronic_circuit', quantity: 3 },
        ],
        outputs: [{ id: 'assembler_output', name: 'assembler', quantity: 1 }],
        craftingTime: 0.5,
      },
      // Science packs
      {
        id: 'science_pack_1',
        name: 'Automation Science Pack (Red)',
        inputs: [
          { id: 'iron_gear_input', name: 'iron_gear', quantity: 1 },
          { id: 'copper_plate_input', name: 'copper_plate', quantity: 1 },
        ],
        outputs: [{ id: 'science_1_output', name: 'science_pack_1', quantity: 1 }],
        craftingTime: 5,
      },
      {
        id: 'science_pack_2',
        name: 'Logistic Science Pack (Green)',
        inputs: [
          { id: 'inserter_input', name: 'inserter', quantity: 1 },
          { id: 'belt_input', name: 'transport_belt', quantity: 1 },
        ],
        outputs: [{ id: 'science_2_output', name: 'science_pack_2', quantity: 1 }],
        craftingTime: 6,
      },
      {
        id: 'science_pack_3',
        name: 'Military Science Pack (Blue)',
        inputs: [
          { id: 'ammo_input', name: 'ammo_magazine', quantity: 1 },
          { id: 'wall_input', name: 'wall', quantity: 2 },
          { id: 'grenade_input', name: 'grenade', quantity: 1 },
        ],
        outputs: [{ id: 'science_3_output', name: 'science_pack_3', quantity: 2 }],
        craftingTime: 10,
      },
      {
        id: 'science_pack_4',
        name: 'Chemical Science Pack (Purple)',
        inputs: [
          { id: 'engine_input', name: 'engine_unit', quantity: 2 },
          { id: 'adv_circuit_input', name: 'advanced_circuit', quantity: 3 },
          { id: 'sulfur_input', name: 'sulfur', quantity: 1 },
        ],
        outputs: [{ id: 'science_4_output', name: 'science_pack_4', quantity: 2 }],
        craftingTime: 24,
      },
      {
        id: 'science_pack_5',
        name: 'Production Science Pack (Yellow)',
        inputs: [
          { id: 'rail_input', name: 'rail', quantity: 30 },
          { id: 'electric_furnace_input', name: 'electric_furnace', quantity: 1 },
          { id: 'productivity_module_input', name: 'productivity_module', quantity: 1 },
        ],
        outputs: [{ id: 'science_5_output', name: 'science_pack_5', quantity: 3 }],
        craftingTime: 21,
      },
      // Combat items
      {
        id: 'ammo_magazine',
        name: 'Firearm Magazine',
        inputs: [{ id: 'iron_plate_input', name: 'iron_plate', quantity: 4 }],
        outputs: [{ id: 'ammo_output', name: 'ammo_magazine', quantity: 1 }],
        craftingTime: 1,
      },
      {
        id: 'wall',
        name: 'Wall',
        inputs: [{ id: 'stone_brick_input', name: 'stone_brick', quantity: 5 }],
        outputs: [{ id: 'wall_output', name: 'wall', quantity: 1 }],
        craftingTime: 0.5,
      },
      {
        id: 'gun_turret',
        name: 'Gun Turret',
        inputs: [
          { id: 'iron_gear_input', name: 'iron_gear', quantity: 10 },
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 10 },
          { id: 'copper_plate_input', name: 'copper_plate', quantity: 10 },
        ],
        outputs: [{ id: 'turret_output', name: 'gun_turret', quantity: 1 }],
        craftingTime: 8,
      },
      // Power infrastructure
      {
        id: 'steam_engine',
        name: 'Steam Engine',
        inputs: [
          { id: 'iron_gear_input', name: 'iron_gear', quantity: 8 },
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 10 },
          { id: 'pipe_input', name: 'pipe', quantity: 5 },
        ],
        outputs: [{ id: 'steam_engine_output', name: 'steam_engine', quantity: 1 }],
        craftingTime: 0.5,
      },
      {
        id: 'solar_panel',
        name: 'Solar Panel',
        inputs: [
          { id: 'copper_plate_input', name: 'copper_plate', quantity: 5 },
          { id: 'iron_plate_input', name: 'iron_plate', quantity: 5 },
          { id: 'circuit_input', name: 'electronic_circuit', quantity: 15 },
        ],
        outputs: [{ id: 'solar_panel_output', name: 'solar_panel', quantity: 1 }],
        craftingTime: 10,
      },
    ]

    recipeDefinitions.forEach(recipe => {
      this.recipes.set(recipe.id, recipe)
    })
  }

  /**
   * Get a recipe by ID
   */
  getRecipe(recipeId: string): Recipe | undefined {
    return this.recipes.get(recipeId)
  }

  /**
   * Get all available recipes
   */
  getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values())
  }

  /**
   * Check if a machine has the required ingredients for its recipe
   */
  hasIngredients(machine: Machine): boolean {
    if (!machine.recipe) return false

    return machine.recipe.inputs.every(input => {
      const item = machine.inventory.find(i => i.name === input.name)
      return item && item.quantity >= input.quantity
    })
  }

  /**
   * Consume ingredients from machine inventory for crafting
   */
  consumeIngredients(machine: Machine): boolean {
    if (!machine.recipe || !this.hasIngredients(machine)) return false

    machine.recipe.inputs.forEach(input => {
      const item = machine.inventory.find(i => i.name === input.name)
      if (item) {
        item.quantity -= input.quantity
        // Remove item if quantity reaches 0
        if (item.quantity <= 0) {
          const index = machine.inventory.indexOf(item)
          machine.inventory.splice(index, 1)
        }
      }
    })

    return true
  }

  /**
   * Add crafted items to machine inventory
   */
  produceOutputs(machine: Machine): void {
    if (!machine.recipe) return

    machine.recipe.outputs.forEach(output => {
      const existingItem = machine.inventory.find(i => i.name === output.name)
      if (existingItem) {
        existingItem.quantity += output.quantity
      } else {
        machine.inventory.push({
          id: `${output.name}_${Date.now()}`,
          name: output.name,
          quantity: output.quantity,
          icon: output.icon,
        })
      }
    })
  }

  /**
   * Mine resources from a tile
   */
  mineResource(tile: WorldTile, miningPower: number = 1): Item | null {
    if (!tile.resource || tile.resource.amount <= 0) return null

    const mineAmount = Math.min(miningPower, tile.resource.amount)
    tile.resource.amount -= mineAmount

    return {
      id: `${tile.resource.type}_${Date.now()}`,
      name: tile.resource.type,
      quantity: mineAmount,
    }
  }

  /**
   * Add item to inventory with stacking
   */
  addToInventory(inventory: Item[], newItem: Item, stackLimit: number = 100): boolean {
    const existingItem = inventory.find(i => i.name === newItem.name)
    
    if (existingItem) {
      const spaceAvailable = stackLimit - existingItem.quantity
      const amountToAdd = Math.min(newItem.quantity, spaceAvailable)
      
      if (amountToAdd > 0) {
        existingItem.quantity += amountToAdd
        return amountToAdd === newItem.quantity
      }
      return false
    } else {
      const amountToAdd = Math.min(newItem.quantity, stackLimit)
      inventory.push({
        ...newItem,
        quantity: amountToAdd,
      })
      return amountToAdd === newItem.quantity
    }
  }

  /**
   * Remove item from inventory
   */
  removeFromInventory(inventory: Item[], itemName: string, quantity: number): boolean {
    const item = inventory.find(i => i.name === itemName)
    if (!item || item.quantity < quantity) return false

    item.quantity -= quantity
    if (item.quantity <= 0) {
      const index = inventory.indexOf(item)
      inventory.splice(index, 1)
    }

    return true
  }
}
