export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
  hidden?: boolean
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

export class AchievementSystem {
  private achievements: Map<string, Achievement>
  private listeners: Set<(achievement: Achievement) => void>

  constructor() {
    this.achievements = new Map()
    this.listeners = new Set()
    this.initializeAchievements()
  }

  private initializeAchievements(): void {
    const baseAchievements: Achievement[] = [
      // First steps
      {
        id: 'first_machine',
        name: 'First Steps',
        description: 'Place your first machine',
        icon: '🏭',
        unlocked: false,
        rarity: 'common',
      },
      {
        id: 'first_production',
        name: 'Productive!',
        description: 'Craft your first item',
        icon: '⚙️',
        unlocked: false,
        rarity: 'common',
      },
      // Building achievements
      {
        id: 'builder_10',
        name: 'Getting Started',
        description: 'Build 10 machines',
        icon: '🔧',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        rarity: 'common',
      },
      {
        id: 'builder_50',
        name: 'Factory Floor',
        description: 'Build 50 machines',
        icon: '🏗️',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        rarity: 'rare',
      },
      {
        id: 'builder_100',
        name: 'Industrial Complex',
        description: 'Build 100 machines',
        icon: '🏙️',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
        rarity: 'epic',
      },
      // Combat achievements
      {
        id: 'first_kill',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        icon: '⚔️',
        unlocked: false,
        rarity: 'common',
      },
      {
        id: 'slayer_100',
        name: 'Pest Control',
        description: 'Defeat 100 enemies',
        icon: '💀',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
        rarity: 'rare',
      },
      {
        id: 'slayer_1000',
        name: 'Exterminator',
        description: 'Defeat 1000 enemies',
        icon: '☠️',
        unlocked: false,
        progress: 0,
        maxProgress: 1000,
        rarity: 'epic',
      },
      // Production achievements
      {
        id: 'iron_plates_100',
        name: 'Iron Worker',
        description: 'Produce 100 iron plates',
        icon: '🔩',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
        rarity: 'common',
      },
      {
        id: 'circuits_50',
        name: 'Electrician',
        description: 'Produce 50 electronic circuits',
        icon: '💡',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        rarity: 'rare',
      },
      // Research achievements
      {
        id: 'first_research',
        name: 'Researcher',
        description: 'Complete your first research',
        icon: '🔬',
        unlocked: false,
        rarity: 'common',
      },
      {
        id: 'all_tech',
        name: 'Technological Singularity',
        description: 'Research all technologies',
        icon: '🚀',
        unlocked: false,
        rarity: 'legendary',
        hidden: true,
      },
      // Game mode victories
      {
        id: 'victory_survival',
        name: 'Survivor',
        description: 'Complete Survival mode',
        icon: '🛡️',
        unlocked: false,
        rarity: 'rare',
      },
      {
        id: 'victory_production',
        name: 'Production Master',
        description: 'Complete Production mode',
        icon: '📈',
        unlocked: false,
        rarity: 'rare',
      },
      {
        id: 'victory_exploration',
        name: 'Explorer',
        description: 'Complete Exploration mode',
        icon: '🗺️',
        unlocked: false,
        rarity: 'rare',
      },
      {
        id: 'all_victories',
        name: 'Master of All',
        description: 'Complete all game modes',
        icon: '👑',
        unlocked: false,
        rarity: 'legendary',
        hidden: true,
      },
      // Speed achievements
      {
        id: 'speedrun_30min',
        name: 'Speed Demon',
        description: 'Win a game in under 30 minutes',
        icon: '⚡',
        unlocked: false,
        rarity: 'epic',
        hidden: true,
      },
      // Multiplayer achievements
      {
        id: 'multiplayer_first',
        name: 'Together Stronger',
        description: 'Complete a co-op game',
        icon: '🤝',
        unlocked: false,
        rarity: 'rare',
      },
      {
        id: 'pvp_victory',
        name: 'Champion',
        description: 'Win a PvP match',
        icon: '🏆',
        unlocked: false,
        rarity: 'epic',
      },
    ]

    baseAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement)
    })
  }

  /**
   * Check and unlock an achievement
   */
  unlock(id: string): boolean {
    const achievement = this.achievements.get(id)
    if (!achievement || achievement.unlocked) {
      return false
    }

    achievement.unlocked = true
    achievement.unlockedAt = new Date()

    // Notify listeners
    this.listeners.forEach(listener => listener(achievement))

    // Save to localStorage
    this.save()

    return true
  }

  /**
   * Update progress on an achievement
   */
  updateProgress(id: string, amount: number): void {
    const achievement = this.achievements.get(id)
    if (!achievement || achievement.unlocked || achievement.maxProgress === undefined) {
      return
    }

    achievement.progress = (achievement.progress || 0) + amount

    if (achievement.progress >= achievement.maxProgress) {
      this.unlock(id)
    } else {
      this.save()
    }
  }

  /**
   * Set progress directly
   */
  setProgress(id: string, progress: number): void {
    const achievement = this.achievements.get(id)
    if (!achievement || achievement.unlocked || achievement.maxProgress === undefined) {
      return
    }

    achievement.progress = Math.min(progress, achievement.maxProgress)

    if (achievement.progress >= achievement.maxProgress) {
      this.unlock(id)
    } else {
      this.save()
    }
  }

  /**
   * Get an achievement
   */
  get(id: string): Achievement | undefined {
    return this.achievements.get(id)
  }

  /**
   * Get all achievements
   */
  getAll(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  /**
   * Get unlocked achievements
   */
  getUnlocked(): Achievement[] {
    return this.getAll().filter(a => a.unlocked)
  }

  /**
   * Get locked achievements (excluding hidden)
   */
  getLocked(): Achievement[] {
    return this.getAll().filter(a => !a.unlocked && !a.hidden)
  }

  /**
   * Subscribe to achievement unlocks
   */
  subscribe(listener: (achievement: Achievement) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Save to localStorage
   */
  private save(): void {
    const data = this.getAll().map(a => ({
      id: a.id,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedAt,
      progress: a.progress,
    }))
    localStorage.setItem('achievements', JSON.stringify(data))
  }

  /**
   * Load from localStorage
   */
  load(): void {
    const saved = localStorage.getItem('achievements')
    if (!saved) return

    try {
      const data = JSON.parse(saved)
      data.forEach((saved: { id: string; unlocked: boolean; unlockedAt?: string; progress?: number }) => {
        const achievement = this.achievements.get(saved.id)
        if (achievement) {
          achievement.unlocked = saved.unlocked
          achievement.unlockedAt = saved.unlockedAt ? new Date(saved.unlockedAt) : undefined
          achievement.progress = saved.progress
        }
      })
    } catch (e) {
      console.error('Failed to load achievements:', e)
    }
  }

  /**
   * Reset all achievements
   */
  reset(): void {
    this.achievements.forEach(achievement => {
      achievement.unlocked = false
      achievement.unlockedAt = undefined
      achievement.progress = 0
    })
    localStorage.removeItem('achievements')
  }
}

// Singleton instance
export const achievementSystem = new AchievementSystem()
