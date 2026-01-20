import { describe, it, expect } from 'vitest'
import { ProgressionSystem } from '../engine/progression/ProgressionSystem'
import type { PlayerStats } from '../types/game'

describe('ProgressionSystem', () => {
  it('should initialize with tech tree', () => {
    const system = new ProgressionSystem()
    const techTree = system.getTechTree()
    
    expect(techTree.length).toBeGreaterThan(0)
  })

  it('should have starting techs researched', () => {
    const system = new ProgressionSystem()
    const techTree = system.getTechTree()
    
    const startingTechs = techTree.filter(t => t.researched)
    expect(startingTechs.length).toBeGreaterThan(0)
  })

  it('should allow researching available tech', () => {
    const system = new ProgressionSystem()

    // Find a tech that can be researched
    const availableTech = system.getTechTree().find(
      t => !t.researched && t.dependencies.length === 0
    )

    if (availableTech) {
      const canResearch = system.canResearch(availableTech.id)
      expect(canResearch).toBe(true)

      const result = system.researchTech(availableTech.id)
      expect(result).toBe(true)
    }
  })

  it('should calculate prestige rewards correctly', () => {
    const system = new ProgressionSystem()
    
    const reward1 = system.calculatePrestigeReward(0)
    expect(reward1.bonusMultiplier).toBe(1)
    expect(reward1.unlockedFeatures.length).toBe(0)

    const reward2 = system.calculatePrestigeReward(5)
    expect(reward2.bonusMultiplier).toBe(1.5)
    expect(reward2.unlockedFeatures.length).toBeGreaterThan(0)
  })

  it('should add experience and level up', () => {
    const system = new ProgressionSystem()
    const playerStats: PlayerStats = {
      level: 1,
      experience: 0,
      prestigeLevel: 0,
      unlockedTech: [],
      completedResearch: [],
    }

    const initialLevel = playerStats.level
    system.addExperience(playerStats, 1000)

    expect(playerStats.level).toBeGreaterThanOrEqual(initialLevel)
    expect(playerStats.experience).toBeGreaterThanOrEqual(0)
  })

  it('should calculate meta progression bonuses', () => {
    const system = new ProgressionSystem()
    
    const bonuses0 = system.getMetaProgressionBonuses(0)
    expect(bonuses0.productionSpeed).toBe(1)
    expect(bonuses0.researchSpeed).toBe(1)
    expect(bonuses0.startingResources).toBe(0)

    const bonuses5 = system.getMetaProgressionBonuses(5)
    expect(bonuses5.productionSpeed).toBeGreaterThan(1)
    expect(bonuses5.researchSpeed).toBeGreaterThan(1)
    expect(bonuses5.startingResources).toBeGreaterThan(0)
  })
})
