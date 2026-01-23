import type { Machine, MachineType, Position, WorldMap, Item, BuildingCost, BuildingGhost } from '../types/game'

/**
 * BuildingSystem handles machine placement, collision detection, and building management
 */
export class BuildingSystem {
  private buildingCosts: Map<MachineType, BuildingCost>

  constructor() {
    this.buildingCosts = new Map()
    this.initializeBuildingCosts()
  }

  /**
   * Initialize building costs for all machine types
   */
  private initializeBuildingCosts(): void {
    const costs: BuildingCost[] = [
      {
        machineType: 'miner' as MachineType,
        costs: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 10 },
          { id: 'iron_gear', name: 'iron_gear', quantity: 5 },
          { id: 'electronic_circuit', name: 'electronic_circuit', quantity: 3 },
        ],
      },
      {
        machineType: 'assembler' as MachineType,
        costs: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 9 },
          { id: 'iron_gear', name: 'iron_gear', quantity: 5 },
          { id: 'electronic_circuit', name: 'electronic_circuit', quantity: 3 },
        ],
      },
      {
        machineType: 'smelter' as MachineType,
        costs: [
          { id: 'stone', name: 'stone', quantity: 5 },
          { id: 'iron_plate', name: 'iron_plate', quantity: 5 },
        ],
      },
      {
        machineType: 'belt' as MachineType,
        costs: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 1 },
          { id: 'iron_gear', name: 'iron_gear', quantity: 1 },
        ],
      },
      {
        machineType: 'inserter' as MachineType,
        costs: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 1 },
          { id: 'iron_gear', name: 'iron_gear', quantity: 1 },
          { id: 'electronic_circuit', name: 'electronic_circuit', quantity: 1 },
        ],
      },
      {
        machineType: 'power_plant' as MachineType,
        costs: [
          { id: 'stone', name: 'stone', quantity: 5 },
          { id: 'iron_gear', name: 'iron_gear', quantity: 8 },
          { id: 'iron_plate', name: 'iron_plate', quantity: 8 },
        ],
        requiredTech: 'steam_power',
      },
      {
        machineType: 'turret' as MachineType,
        costs: [
          { id: 'iron_gear', name: 'iron_gear', quantity: 10 },
          { id: 'iron_plate', name: 'iron_plate', quantity: 10 },
          { id: 'copper_plate', name: 'copper_plate', quantity: 10 },
        ],
        requiredTech: 'military',
      },
      {
        machineType: 'storage' as MachineType,
        costs: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 20 },
        ],
      },
      {
        machineType: 'base' as MachineType,
        costs: [], // Base is placed automatically at game start
      },
    ]

    costs.forEach(cost => {
      this.buildingCosts.set(cost.machineType, cost)
    })
  }

  /**
   * Get building cost for a machine type
   */
  getBuildingCost(machineType: MachineType): BuildingCost | undefined {
    return this.buildingCosts.get(machineType)
  }

  /**
   * Check if a position is valid for building
   */
  canPlaceAt(
    position: Position,
    worldMap: WorldMap,
    existingMachines: Machine[]
  ): boolean {
    // Check if position is within map bounds
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x >= worldMap.width ||
      position.y >= worldMap.height
    ) {
      return false
    }

    // Check tile type (can't build on water)
    const tileKey = `${position.x},${position.y}`
    const tile = worldMap.tiles.get(tileKey)
    if (tile?.type === 'water') {
      return false
    }

    // Check for collision with existing machines
    const hasCollision = existingMachines.some(
      machine => machine.position.x === position.x && machine.position.y === position.y
    )

    return !hasCollision
  }

  /**
   * Check if player has required resources
   */
  hasResources(playerInventory: Item[], machineType: MachineType): boolean {
    const cost = this.buildingCosts.get(machineType)
    if (!cost) return false

    return cost.costs.every(requiredItem => {
      const item = playerInventory.find(i => i.name === requiredItem.name)
      return item && item.quantity >= requiredItem.quantity
    })
  }

  /**
   * Deduct building costs from player inventory
   */
  deductCosts(playerInventory: Item[], machineType: MachineType): boolean {
    const cost = this.buildingCosts.get(machineType)
    if (!cost || !this.hasResources(playerInventory, machineType)) {
      return false
    }

    cost.costs.forEach(requiredItem => {
      const item = playerInventory.find(i => i.name === requiredItem.name)
      if (item) {
        item.quantity -= requiredItem.quantity
        // Remove item if quantity reaches 0
        if (item.quantity <= 0) {
          const index = playerInventory.indexOf(item)
          playerInventory.splice(index, 1)
        }
      }
    })

    return true
  }

  /**
   * Create a new machine
   */
  createMachine(
    machineType: MachineType,
    position: Position,
    rotation: number = 0
  ): Machine {
    const baseHealth = this.getMachineBaseHealth(machineType)
    const powerRequired = this.getMachinePowerRequirement(machineType)

    return {
      id: `${machineType}_${Date.now()}_${Math.random()}`,
      type: machineType,
      position,
      rotation,
      inventory: [],
      power: {
        required: powerRequired,
        available: 0,
        connected: false,
      },
      health: baseHealth,
      maxHealth: baseHealth,
    }
  }

  /**
   * Get base health for machine type
   */
  private getMachineBaseHealth(machineType: MachineType): number {
    const healthMap: Record<MachineType, number> = {
      miner: 150,
      assembler: 200,
      smelter: 150,
      belt: 50,
      inserter: 75,
      power_plant: 300,
      turret: 400,
      storage: 250,
      base: 1000, // Base has high health
    }
    return healthMap[machineType] || 100
  }

  /**
   * Get power requirement for machine type
   */
  private getMachinePowerRequirement(machineType: MachineType): number {
    const powerMap: Record<MachineType, number> = {
      miner: 90,
      assembler: 150,
      smelter: 180,
      belt: 5,
      inserter: 13,
      power_plant: -200, // Negative means it produces power
      turret: 40,
      storage: 5,
      base: 0, // Base doesn't require power
    }
    return powerMap[machineType] || 0
  }

  /**
   * Demolish a machine and return partial resources
   */
  demolishMachine(machineType: MachineType): Item[] {
    const cost = this.buildingCosts.get(machineType)
    if (!cost) return []

    // Return 50% of resources
    return cost.costs.map(item => ({
      ...item,
      quantity: Math.floor(item.quantity * 0.5),
    }))
  }

  /**
   * Create a building ghost for preview
   */
  createGhost(
    machineType: MachineType,
    position: Position,
    rotation: number,
    worldMap: WorldMap,
    existingMachines: Machine[]
  ): BuildingGhost {
    return {
      type: machineType,
      position,
      rotation,
      isValid: this.canPlaceAt(position, worldMap, existingMachines),
    }
  }

  /**
   * Rotate building (90-degree increments)
   */
  rotateBuilding(currentRotation: number): number {
    return (currentRotation + 90) % 360
  }

  /**
   * Create the starting base with 4 entrances (Builderment-style)
   */
  createStartingBase(centerPosition: Position): Machine {
    const BASE_ENTRANCE_OFFSET = 2 // Distance of entrances from base center
    
    const base: Machine = {
      id: `base_${Date.now()}`,
      type: 'base' as MachineType,
      position: centerPosition,
      rotation: 0,
      inventory: [],
      power: {
        required: 0,
        available: 0,
        connected: true,
      },
      health: 1000,
      maxHealth: 1000,
      isBase: true,
      // 4 entrances: top, right, bottom, left (absolute grid coordinates)
      baseEntrances: [
        { x: centerPosition.x, y: centerPosition.y - BASE_ENTRANCE_OFFSET }, // Top
        { x: centerPosition.x + BASE_ENTRANCE_OFFSET, y: centerPosition.y }, // Right
        { x: centerPosition.x, y: centerPosition.y + BASE_ENTRANCE_OFFSET }, // Bottom
        { x: centerPosition.x - BASE_ENTRANCE_OFFSET, y: centerPosition.y }, // Left
      ],
    }
    return base
  }

  /**
   * Create multiple bases for PVP mode (2-4 players)
   * Bases are auto-placed at strategic positions on the map
   * @param mapWidth Width of the map
   * @param mapHeight Height of the map
   * @param playerCount Number of players (2-4)
   * @returns Array of base machines
   */
  createPVPBases(mapWidth: number, mapHeight: number, playerCount: number): Machine[] {
    if (playerCount < 2 || playerCount > 4) {
      throw new Error('PVP requires 2-4 players')
    }

    const bases: Machine[] = []
    const margin = 20 // Distance from map edge
    
    // Define base positions for different player counts
    const basePositions: Record<number, Position[]> = {
      2: [
        { x: margin, y: margin }, // Top-left
        { x: mapWidth - margin, y: mapHeight - margin }, // Bottom-right
      ],
      3: [
        { x: margin, y: margin }, // Top-left
        { x: mapWidth - margin, y: margin }, // Top-right
        { x: Math.floor(mapWidth / 2), y: mapHeight - margin }, // Bottom-center
      ],
      4: [
        { x: margin, y: margin }, // Top-left
        { x: mapWidth - margin, y: margin }, // Top-right
        { x: margin, y: mapHeight - margin }, // Bottom-left
        { x: mapWidth - margin, y: mapHeight - margin }, // Bottom-right
      ],
    }

    const positions = basePositions[playerCount]
    
    positions.forEach((position, index) => {
      const base = this.createStartingBase(position)
      base.id = `base_player${index + 1}_${Date.now()}`
      bases.push(base)
    })

    return bases
  }

  /**
   * Calculate grid position from screen coordinates
   */
  screenToGrid(screenX: number, screenY: number, tileSize: number): Position {
    return {
      x: Math.floor(screenX / tileSize),
      y: Math.floor(screenY / tileSize),
    }
  }

  /**
   * Calculate screen position from grid coordinates
   */
  gridToScreen(gridX: number, gridY: number, tileSize: number): Position {
    return {
      x: gridX * tileSize,
      y: gridY * tileSize,
    }
  }
}
