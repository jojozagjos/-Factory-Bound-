import type { MachineUnlock, ResourceDelivery, MachineType } from '../types/game'
import { buildermentProgression } from '../data/buildermentProgression'

/**
 * Builderment-style progression: machines unlock by delivering items to base.
 * Players must produce resources, which unlocks new machines in logical order.
 * Uses exact Builderment v5.0 progression data.
 */
export class MachineUnlockSystem {
  private unlocks: MachineUnlock[] = []
  private deliveries: ResourceDelivery[] = []

  constructor() {
    this.initializeUnlocks()
  }

  /**
   * Initialize from exact Builderment progression data
   */
  private initializeUnlocks(): void {
    // Load exact Builderment progression
    this.unlocks = buildermentProgression.unlocks.map(unlock => ({
      machineType: unlock.machine_id as MachineType,
      requiredDeliveries: unlock.required_deliveries.map(req => ({
        id: req.item,
        name: req.item,
        quantity: req.qty
      })),
      unlocked: unlock.starting_unlocked,
      order: unlock.order,
    }))

    // Initialize delivery tracking from unlocks
    const allDeliveries = this.unlocks.flatMap(u => u.requiredDeliveries)
    const uniqueDeliveries = new Map<string, { name: string; quantity: number }>()
    allDeliveries.forEach(req => {
      if (!uniqueDeliveries.has(req.name)) {
        uniqueDeliveries.set(req.name, { name: req.name, quantity: req.quantity })
      }
    })
    this.deliveries = Array.from(uniqueDeliveries.values()).map(item => ({
      itemName: item.name,
      quantityDelivered: 0,
      quantityRequired: item.quantity,
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
