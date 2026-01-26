import type { MachineUnlock, ResourceDelivery, MachineType } from '../types/game'

/**
 * Builderment-style progression: machines unlock by delivering items to base.
 * Players must produce resources, which unlocks new machines in logical order.
 * This creates a natural progression and engagement loop.
 */
export class MachineUnlockSystem {
  private unlocks: MachineUnlock[] = []
  private deliveries: ResourceDelivery[] = []

  constructor() {
    this.initializeUnlocks()
  }

  /**
   * Initialize default Builderment-style unlock progression
   */
  private initializeUnlocks(): void {
    this.unlocks = [
      // Tier 1: Basic production
      {
        machineType: 'miner' as MachineType,
        requiredDeliveries: [{ id: 'copper_ore', name: 'copper_ore', quantity: 10 }],
        unlocked: true,
        order: 0,
      },
      {
        machineType: 'smelter' as MachineType,
        requiredDeliveries: [{ id: 'copper_ore', name: 'copper_ore', quantity: 30 }],
        unlocked: false,
        order: 1,
      },
      // Tier 2: Logistics
      {
        machineType: 'belt' as MachineType,
        requiredDeliveries: [{ id: 'iron_plate', name: 'iron_plate', quantity: 10 }],
        unlocked: false,
        order: 2,
      },
      {
        machineType: 'inserter' as MachineType,
        requiredDeliveries: [{ id: 'iron_gear_wheel', name: 'iron_gear_wheel', quantity: 5 }],
        unlocked: false,
        order: 3,
      },
      // Tier 3: Production
      {
        machineType: 'assembler' as MachineType,
        requiredDeliveries: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 30 },
          { id: 'copper_plate', name: 'copper_plate', quantity: 20 },
        ],
        unlocked: false,
        order: 4,
      },
      // Tier 4: Power
      {
        machineType: 'power_plant' as MachineType,
        requiredDeliveries: [
          { id: 'coal', name: 'coal', quantity: 50 },
          { id: 'stone', name: 'stone', quantity: 100 },
        ],
        unlocked: false,
        order: 5,
      },
      // Tier 5: Combat
      {
        machineType: 'wall' as MachineType,
        requiredDeliveries: [{ id: 'stone', name: 'stone', quantity: 50 }],
        unlocked: false,
        order: 6,
      },
      {
        machineType: 'turret' as MachineType,
        requiredDeliveries: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 20 },
          { id: 'copper_plate', name: 'copper_plate', quantity: 10 },
        ],
        unlocked: false,
        order: 7,
      },
      // Tier 6: Advanced
      {
        machineType: 'research_lab' as MachineType,
        requiredDeliveries: [
          { id: 'iron_plate', name: 'iron_plate', quantity: 50 },
          { id: 'copper_plate', name: 'copper_plate', quantity: 50 },
          { id: 'electronic_circuit', name: 'electronic_circuit', quantity: 5 },
        ],
        unlocked: false,
        order: 8,
      },
    ]

    // Initialize delivery tracking
    this.deliveries = this.unlocks
      .flatMap(u => u.requiredDeliveries)
      .map(req => ({
        itemName: req.name,
        quantityDelivered: 0,
        quantityRequired: req.quantity,
      }))
  }

  /**
   * Deliver an item to the base
   */
  deliverToBase(itemName: string, quantity: number): { unlockedMachines: MachineType[] } {
    const unlockedMachines: MachineType[] = []

    // Update delivery tracking
    const delivery = this.deliveries.find(d => d.itemName === itemName)
    if (delivery) {
      delivery.quantityDelivered = Math.min(
        delivery.quantityRequired,
        delivery.quantityDelivered + quantity
      )
    }

    // Check for newly unlocked machines
    this.unlocks.forEach(unlock => {
      if (unlock.unlocked) return // Already unlocked

      const isNowUnlocked = unlock.requiredDeliveries.every(req => {
        const delivery = this.deliveries.find(d => d.itemName === req.name)
        return delivery && delivery.quantityDelivered >= delivery.quantityRequired
      })

      if (isNowUnlocked) {
        unlock.unlocked = true
        unlockedMachines.push(unlock.machineType)
      }
    })

    return { unlockedMachines }
  }

  /**
   * Check if a machine is unlocked
   */
  isMachineUnlocked(machineType: MachineType): boolean {
    return this.unlocks.find(u => u.machineType === machineType)?.unlocked ?? false
  }

  /**
   * Get all unlocked machines
   */
  getUnlockedMachines(): MachineType[] {
    return this.unlocks.filter(u => u.unlocked).map(u => u.machineType)
  }

  /**
   * Reset unlock progression to defaults (useful when starting a new game)
   */
  reset(): void {
    this.initializeUnlocks()
  }

  /**
   * Get progress toward unlocking a machine
   */
  getUnlockProgress(machineType: MachineType): { progress: number; isUnlocked: boolean; requirements: Array<{ item: string; delivered: number; required: number }> } {
    const unlock = this.unlocks.find(u => u.machineType === machineType)
    if (!unlock) {
      return { progress: 0, isUnlocked: false, requirements: [] }
    }

    if (unlock.unlocked) {
      return { progress: 100, isUnlocked: true, requirements: [] }
    }

    const requirements = unlock.requiredDeliveries.map(req => {
      const delivery = this.deliveries.find(d => d.itemName === req.name)
      return {
        item: req.name,
        delivered: delivery?.quantityDelivered ?? 0,
        required: delivery?.quantityRequired ?? req.quantity,
      }
    })

    const averageProgress = requirements.reduce((sum, r) => sum + (r.delivered / r.required), 0) / requirements.length
    return { progress: Math.floor(averageProgress * 100), isUnlocked: false, requirements }
  }

  /**
   * Get the next machine that can be unlocked (teaser for players)
   */
  getNextUnlockableMachine(): MachineType | null {
    for (const unlock of this.unlocks) {
      if (!unlock.unlocked) {
        return unlock.machineType
      }
    }
    return null
  }

  /**
   * Serialize state for save/load
   */
  getState(): { unlocks: MachineUnlock[]; deliveries: ResourceDelivery[] } {
    return { unlocks: this.unlocks, deliveries: this.deliveries }
  }

  /**
   * Restore state from save
   */
  setState(state: { unlocks: MachineUnlock[]; deliveries: ResourceDelivery[] }): void {
    this.unlocks = state.unlocks
    this.deliveries = state.deliveries
  }
}
