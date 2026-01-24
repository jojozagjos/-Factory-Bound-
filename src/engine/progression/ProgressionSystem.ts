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
        id: 'basic_logistics',
        name: 'Basic Logistics',
        description: 'Unlock basic transport and manipulation systems',
        paradigm: 'logistics' as TechParadigm,
        cost: [], // Free starting tech
        dependencies: [],
        unlocks: ['belt', 'inserter'],
        researched: true, // Starting tech
        researchTime: 0,
      },
      {
        id: 'fast_logistics',
        name: 'Fast Logistics',
        description: 'Faster transport belts and inserters',
        paradigm: 'logistics' as TechParadigm,
        cost: [{ id: '1', name: 'science_pack_1', quantity: 50 }],
        dependencies: ['basic_logistics'],
        unlocks: ['fast_belt', 'fast_inserter'],
        researched: false,
        researchTime: 30, // 30 seconds
      },
      {
        id: 'advanced_logistics',
        name: 'Advanced Logistics',
        description: 'Express belts and stack inserters',
        paradigm: 'logistics' as TechParadigm,
        cost: [
          { id: '2', name: 'science_pack_1', quantity: 100 },
          { id: '3', name: 'science_pack_2', quantity: 50 }
        ],
        dependencies: ['fast_logistics'],
        unlocks: ['express_belt', 'stack_inserter', 'splitter', 'underground_belt'],
        researched: false,
        researchTime: 60,
      },

      // Production Paradigm
      {
        id: 'automation',
        name: 'Automation',
        description: 'Unlock automated production facilities',
        paradigm: 'production' as TechParadigm,
        cost: [], // Free starting tech
        dependencies: [],
        unlocks: ['assembler', 'miner'],
        researched: true,
        researchTime: 0,
      },
      {
        id: 'advanced_mining',
        name: 'Advanced Mining',
        description: 'Tier 2 mining drills with increased speed',
        paradigm: 'production' as TechParadigm,
        cost: [{ id: '4', name: 'science_pack_1', quantity: 75 }],
        dependencies: ['automation'],
        unlocks: ['miner_t2'],
        researched: false,
        researchTime: 45,
      },
      {
        id: 'electric_mining',
        name: 'Electric Mining',
        description: 'Tier 3 electric mining drills',
        paradigm: 'production' as TechParadigm,
        cost: [
          { id: '5', name: 'science_pack_1', quantity: 150 },
          { id: '6', name: 'science_pack_2', quantity: 100 }
        ],
        dependencies: ['advanced_mining'],
        unlocks: ['miner_t3'],
        researched: false,
        researchTime: 90,
      },
      {
        id: 'advanced_production',
        name: 'Advanced Production',
        description: 'Faster assembling machines',
        paradigm: 'production' as TechParadigm,
        cost: [{ id: '7', name: 'science_pack_1', quantity: 100 }],
        dependencies: ['automation'],
        unlocks: ['assembler_t2'],
        researched: false,
        researchTime: 60,
      },
      {
        id: 'high_speed_production',
        name: 'High-Speed Production',
        description: 'Highest tier assembling machines',
        paradigm: 'production' as TechParadigm,
        cost: [
          { id: '8', name: 'science_pack_1', quantity: 200 },
          { id: '9', name: 'science_pack_2', quantity: 150 }
        ],
        dependencies: ['advanced_production'],
        unlocks: ['assembler_t3'],
        researched: false,
        researchTime: 120,
      },
      {
        id: 'steel_processing',
        name: 'Steel Processing',
        description: 'Unlock steel furnaces for faster smelting',
        paradigm: 'production' as TechParadigm,
        cost: [{ id: '10', name: 'science_pack_1', quantity: 50 }],
        dependencies: [],
        unlocks: ['steel_furnace'],
        researched: false,
        researchTime: 30,
      },
      {
        id: 'electric_smelting',
        name: 'Electric Smelting',
        description: 'Electric furnaces for maximum efficiency',
        paradigm: 'production' as TechParadigm,
        cost: [
          { id: '11', name: 'science_pack_1', quantity: 100 },
          { id: '12', name: 'science_pack_2', quantity: 75 }
        ],
        dependencies: ['steel_processing'],
        unlocks: ['electric_furnace'],
        researched: false,
        researchTime: 60,
      },

      // Power Paradigm
      {
        id: 'steam_power',
        name: 'Steam Power',
        description: 'Generate power from steam',
        paradigm: 'power' as TechParadigm,
        cost: [{ id: '13', name: 'science_pack_1', quantity: 10 }],
        dependencies: [],
        unlocks: ['steam_engine', 'boiler', 'power_plant'],
        researched: true,
        researchTime: 0,
      },
      {
        id: 'solar_power',
        name: 'Solar Power',
        description: 'Harness the power of the sun',
        paradigm: 'power' as TechParadigm,
        cost: [
          { id: '14', name: 'science_pack_1', quantity: 100 },
          { id: '15', name: 'science_pack_2', quantity: 100 }
        ],
        dependencies: ['steam_power'],
        unlocks: ['solar_panel', 'accumulator'],
        researched: false,
        researchTime: 90,
      },

      // Combat Paradigm
      {
        id: 'military',
        name: 'Military',
        description: 'Basic defensive structures',
        paradigm: 'combat' as TechParadigm,
        cost: [{ id: '16', name: 'science_pack_1', quantity: 20 }],
        dependencies: [],
        unlocks: ['turret', 'wall'],
        researched: false,
        researchTime: 20,
      },
      {
        id: 'laser_turrets',
        name: 'Laser Turrets',
        description: 'Energy-based defensive weapons',
        paradigm: 'combat' as TechParadigm,
        cost: [
          { id: '17', name: 'science_pack_1', quantity: 150 },
          { id: '18', name: 'science_pack_2', quantity: 100 }
        ],
        dependencies: ['military'],
        unlocks: ['laser_turret'],
        researched: false,
        researchTime: 75,
      },

      // Research Paradigm
      {
        id: 'research_labs',
        name: 'Research Labs',
        description: 'Buildings dedicated to scientific research',
        paradigm: 'research' as TechParadigm,
        cost: [{ id: '19', name: 'science_pack_1', quantity: 30 }],
        dependencies: [],
        unlocks: ['research_lab'],
        researched: false,
        researchTime: 25,
      },
      {
        id: 'research_speed_1',
        name: 'Research Speed I',
        description: 'Increase research speed by 20%',
        paradigm: 'research' as TechParadigm,
        cost: [{ id: '20', name: 'science_pack_2', quantity: 50 }],
        dependencies: ['research_labs'],
        unlocks: [],
        researched: false,
        researchTime: 40,
      },
      {
        id: 'research_speed_2',
        name: 'Research Speed II',
        description: 'Increase research speed by 40%',
        paradigm: 'research' as TechParadigm,
        cost: [
          { id: '21', name: 'science_pack_2', quantity: 100 },
          { id: '22', name: 'science_pack_3', quantity: 75 }
        ],
        dependencies: ['research_speed_1'],
        unlocks: [],
        researched: false,
        researchTime: 60,
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
