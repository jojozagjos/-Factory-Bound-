import { beforeEach, describe, expect, it } from 'vitest'
import { MachineUnlockSystem } from '@/systems/MachineUnlockSystem.ts'
import type { MachineType } from '@/types/game.ts'

describe('MachineUnlockSystem', () => {
  let system: MachineUnlockSystem

  beforeEach(() => {
    system = new MachineUnlockSystem()
  })

  it('starts with only miner unlocked', () => {
    expect(system.isMachineUnlocked('miner' as MachineType)).toBe(true)
    expect(system.isMachineUnlocked('assembler' as MachineType)).toBe(false)
  })

  it('unlocks machines after delivering required items', () => {
    const deliverResult = system.deliverToBase('copper_ore', 30)
    expect(deliverResult.unlockedMachines).toContain('smelter')
    expect(system.isMachineUnlocked('smelter' as MachineType)).toBe(true)
  })

  it('tracks progress toward unlocks', () => {
    const progressBefore = system.getUnlockProgress('assembler' as MachineType)
    expect(progressBefore.progress).toBeLessThan(100)

    system.deliverToBase('iron_plate', 30)
    system.deliverToBase('copper_plate', 10)

    const progressAfter = system.getUnlockProgress('assembler' as MachineType)
    expect(progressAfter.progress).toBeGreaterThan(progressBefore.progress)
    expect(progressAfter.isUnlocked).toBe(false)
  })

  it('resets to defaults', () => {
    system.deliverToBase('copper_ore', 30)
    expect(system.isMachineUnlocked('smelter' as MachineType)).toBe(true)

    system.reset()
    expect(system.isMachineUnlocked('smelter' as MachineType)).toBe(false)
  })
})
