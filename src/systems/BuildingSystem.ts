import type { Machine, MachineType, Position, WorldMap, Item, BuildingCost, BuildingGhost } from '../types/game'
import { buildermentProgression } from '../data/buildermentProgression'

/**
 * BuildingSystem handles machine placement, collision detection, and building management
 */
export class BuildingSystem {
  private buildingCosts: Map<string, BuildingCost>

  constructor() {
    this.buildingCosts = new Map()
    this.initializeBuildingCosts()
  }

  /**
   * Initialize building costs for all machine types
   */
  private initializeBuildingCosts(): void {
    // Builderment-style: All buildings are FREE to place.
    // Populate the building cost table from the canonical progression data so every
    // machine id (including custom ones like gold_vault) has an entry (empty costs).
    const costs: BuildingCost[] = []

    try {
      // Helper to map tier to a default cash price
      const tierPrice = (tier: number | undefined) => {
        switch (tier) {
          case 1: return 100
          case 2: return 500
          case 3: return 2500
          case 4: return 10000
          case 5: return 40000
          default: return 200
        }
      }

      buildermentProgression.machines.forEach(m => {
        costs.push({ machineType: m.id as MachineType, costs: [], price: tierPrice((m as any).tier) })
      })
    } catch (e) {
      // Fallback: if progression data missing, keep a minimal hardcoded list
      ;( [
        { machineType: 'miner' as MachineType, costs: [] },
        { machineType: 'assembler' as MachineType, costs: [] },
        { machineType: 'smelter' as MachineType, costs: [] },
        { machineType: 'belt' as MachineType, costs: [] },
        { machineType: 'inserter' as MachineType, costs: [] },
      ] as BuildingCost[]).forEach(c => costs.push(c))
    }

    // Ensure a few common fallback types exist even if not present in progression
    const fallback: MachineType[] = [
      'research_lab' as MachineType,
      'research_lab' as MachineType,
      'storage' as MachineType,
      'turret' as MachineType,
    ]
    fallback.forEach(t => costs.push({ machineType: t, costs: [], price: 0 }))

    costs.forEach(cost => {
      // store by raw string id so custom machine ids (gold_vault, belt_1, etc.) resolve reliably
      this.buildingCosts.set(String(cost.machineType), cost)
    })
  }

  /**
   * Get building cost for a machine type
   */
  getBuildingCost(machineType: MachineType | string): BuildingCost | undefined {
    // Try direct lookup by provided key (enum or string)
    const direct = this.buildingCosts.get(machineType as string)
    if (direct) return direct

    // Fallback: some callers may pass enum names or slightly different strings
    const key = String(machineType)
    if (this.buildingCosts.has(key)) return this.buildingCosts.get(key)

    // Final fallback: search by endsWith (allow matching 'belt' -> 'belt_1')
    for (const [k, v] of this.buildingCosts.entries()) {
      if (k === key || k.endsWith(key) || key.endsWith(k)) return v
    }

    return undefined
  }

  /**
   * Check if a position is valid for building
   */
  canPlaceAt(
    position: Position,
    worldMap: WorldMap,
    existingMachines: Machine[],
    machineType?: MachineType
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

    // Machine-specific placement rules
    if (machineType === 'miner') {
      // Miners must be placed on tiles that have a resource (ore)
      if (!tile?.resource) return false
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
    const healthMap: Partial<Record<MachineType, number>> = {
      miner: 150,
      assembler: 200,
      smelter: 150,
      belt: 50,
      inserter: 75,
      power_plant: 300,
      turret: 400,
      storage: 250,
      research_lab: 1000, // Research lab (formerly base) has high health
    }
    return healthMap[machineType] || 100
  }

  /**
   * Get power requirement for machine type
   */
  public getMachinePowerRequirement(machineType: MachineType): number {
    const powerMap: Partial<Record<MachineType, number>> = {
      miner: 90,
      assembler: 150,
      smelter: 180,
      belt: 5,
      inserter: 13,
      power_plant: -200, // Negative means it produces power
      turret: 40,
      storage: 5,
      research_lab: 0, // Research lab doesn't require power
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
      isValid: this.canPlaceAt(position, worldMap, existingMachines, machineType),
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
      id: `research_lab_${Date.now()}`,
      type: 'research_lab' as MachineType,
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
    // Place bases evenly around a circle centered on the map to maximize separation
    const centerX = Math.floor(mapWidth / 2)
    const centerY = Math.floor(mapHeight / 2)
    const radius = Math.floor(Math.min(mapWidth, mapHeight) / 3)

    for (let i = 0; i < playerCount; i++) {
      const angle = (2 * Math.PI * i) / playerCount
      const jitter = 0.1 * (Math.random() - 0.5) // small jitter to avoid perfect symmetry
      const ax = Math.cos(angle + jitter)
      const ay = Math.sin(angle + jitter)
      const posX = Math.max(0, Math.min(mapWidth - 1, centerX + Math.floor(ax * radius)))
      const posY = Math.max(0, Math.min(mapHeight - 1, centerY + Math.floor(ay * radius)))
      const base = this.createStartingBase({ x: posX, y: posY })
      base.id = `base_player${i + 1}_${Date.now()}`
      bases.push(base)
    }

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
