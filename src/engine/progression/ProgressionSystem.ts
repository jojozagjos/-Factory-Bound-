import type { TechNode, TechParadigm, PlayerStats } from '../../types/game'

export class ProgressionSystem {
  private techTree: TechNode[]

  constructor() {
    this.techTree = this.initializeTechTree()
  }

  private initializeTechTree(): TechNode[] {
    return [
      // Logistics Paradigm
      {
        id: 'basic_belt',
        name: 'Basic Conveyor Belt',
        description: 'Unlock basic transport belts for moving items',
        paradigm: 'logistics' as TechParadigm,
        cost: [{ id: '1', name: 'science_pack_1', quantity: 10 }],
        dependencies: [],
        unlocks: ['belt', 'inserter'],
        researched: true, // Starting tech
      },
      {
        id: 'fast_belt',
        name: 'Fast Conveyor Belt',
        description: 'Faster transport belts',
        paradigm: 'logistics' as TechParadigm,
        cost: [{ id: '2', name: 'science_pack_2', quantity: 50 }],
        dependencies: ['basic_belt'],
        unlocks: ['fast_belt'],
        researched: false,
      },
      {
        id: 'logistics_network',
        name: 'Logistics Network',
        description: 'Enable automated item distribution',
        paradigm: 'logistics' as TechParadigm,
        cost: [{ id: '3', name: 'science_pack_3', quantity: 100 }],
        dependencies: ['fast_belt'],
        unlocks: ['logistics_chest', 'logistics_robot'],
        researched: false,
      },

      // Production Paradigm
      {
        id: 'automation',
        name: 'Automation',
        description: 'Unlock automated production facilities',
        paradigm: 'production' as TechParadigm,
        cost: [{ id: '4', name: 'science_pack_1', quantity: 10 }],
        dependencies: [],
        unlocks: ['assembler'],
        researched: true,
      },
      {
        id: 'advanced_production',
        name: 'Advanced Production',
        description: 'Faster assembling machines',
        paradigm: 'production' as TechParadigm,
        cost: [{ id: '5', name: 'science_pack_2', quantity: 75 }],
        dependencies: ['automation'],
        unlocks: ['advanced_assembler'],
        researched: false,
      },
      {
        id: 'module_system',
        name: 'Module System',
        description: 'Unlock productivity and speed modules',
        paradigm: 'production' as TechParadigm,
        cost: [{ id: '6', name: 'science_pack_3', quantity: 150 }],
        dependencies: ['advanced_production'],
        unlocks: ['speed_module', 'productivity_module'],
        researched: false,
      },

      // Power Paradigm
      {
        id: 'steam_power',
        name: 'Steam Power',
        description: 'Generate power from steam',
        paradigm: 'power' as TechParadigm,
        cost: [{ id: '7', name: 'science_pack_1', quantity: 10 }],
        dependencies: [],
        unlocks: ['steam_engine', 'boiler'],
        researched: true,
      },
      {
        id: 'solar_power',
        name: 'Solar Power',
        description: 'Harness the power of the sun',
        paradigm: 'power' as TechParadigm,
        cost: [{ id: '8', name: 'science_pack_2', quantity: 100 }],
        dependencies: ['steam_power'],
        unlocks: ['solar_panel', 'accumulator'],
        researched: false,
      },
      {
        id: 'nuclear_power',
        name: 'Nuclear Power',
        description: 'Massive power generation from nuclear reactors',
        paradigm: 'power' as TechParadigm,
        cost: [{ id: '9', name: 'science_pack_4', quantity: 200 }],
        dependencies: ['solar_power'],
        unlocks: ['nuclear_reactor', 'heat_exchanger'],
        researched: false,
      },

      // Combat Paradigm
      {
        id: 'military',
        name: 'Military',
        description: 'Basic defensive structures',
        paradigm: 'combat' as TechParadigm,
        cost: [{ id: '10', name: 'science_pack_1', quantity: 10 }],
        dependencies: [],
        unlocks: ['turret', 'wall'],
        researched: true,
      },
      {
        id: 'advanced_combat',
        name: 'Advanced Combat',
        description: 'Laser turrets and better defenses',
        paradigm: 'combat' as TechParadigm,
        cost: [{ id: '11', name: 'science_pack_2', quantity: 100 }],
        dependencies: ['military'],
        unlocks: ['laser_turret', 'stronger_walls'],
        researched: false,
      },
      {
        id: 'artillery',
        name: 'Artillery',
        description: 'Long-range offensive weapons',
        paradigm: 'combat' as TechParadigm,
        cost: [{ id: '12', name: 'science_pack_4', quantity: 300 }],
        dependencies: ['advanced_combat'],
        unlocks: ['artillery_turret', 'artillery_shell'],
        researched: false,
      },

      // Research Paradigm
      {
        id: 'research_speed_1',
        name: 'Research Speed I',
        description: 'Increase research speed by 20%',
        paradigm: 'research' as TechParadigm,
        cost: [{ id: '13', name: 'science_pack_2', quantity: 50 }],
        dependencies: [],
        unlocks: [],
        researched: false,
      },
      {
        id: 'research_speed_2',
        name: 'Research Speed II',
        description: 'Increase research speed by 40%',
        paradigm: 'research' as TechParadigm,
        cost: [{ id: '14', name: 'science_pack_3', quantity: 100 }],
        dependencies: ['research_speed_1'],
        unlocks: [],
        researched: false,
      },
    ]
  }

  getTechTree(): TechNode[] {
    return this.techTree
  }

  canResearch(techId: string): boolean {
    const tech = this.techTree.find(t => t.id === techId)
    if (!tech || tech.researched) return false

    // Check if all dependencies are researched
    return tech.dependencies.every(depId => {
      const dep = this.techTree.find(t => t.id === depId)
      return dep?.researched === true
    })
  }

  researchTech(techId: string): boolean {
    const tech = this.techTree.find(t => t.id === techId)
    if (!tech) return false

    tech.researched = true
    return true
  }

  getUnlockedRecipes(): string[] {
    const unlocks: string[] = []
    this.techTree.forEach(tech => {
      if (tech.researched) {
        unlocks.push(...tech.unlocks)
      }
    })
    return unlocks
  }

  // Prestige system
  calculatePrestigeReward(level: number): {
    bonusMultiplier: number
    unlockedFeatures: string[]
  } {
    return {
      bonusMultiplier: 1 + (level * 0.1),
      unlockedFeatures: level > 0 ? ['advanced_start', 'custom_colors'] : [],
    }
  }

  // Experience and leveling
  addExperience(playerStats: PlayerStats, amount: number): void {
    playerStats.experience += amount
    
    // Level up calculation
    const xpForNextLevel = this.getXPForLevel(playerStats.level + 1)
    if (playerStats.experience >= xpForNextLevel) {
      playerStats.level++
      playerStats.experience -= xpForNextLevel
    }
  }

  private getXPForLevel(level: number): number {
    // Exponential XP curve
    return Math.floor(100 * Math.pow(1.5, level - 1))
  }

  // Meta progression bonuses
  getMetaProgressionBonuses(prestigeLevel: number): {
    productionSpeed: number
    researchSpeed: number
    startingResources: number
  } {
    return {
      productionSpeed: 1 + (prestigeLevel * 0.05),
      researchSpeed: 1 + (prestigeLevel * 0.1),
      startingResources: prestigeLevel * 50,
    }
  }
}
