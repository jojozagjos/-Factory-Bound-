import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { 
  Player, 
  Machine, 
  WorldMap, 
  TechNode, 
  GameSession,
  SaveData,
  GameSettings,
  Item,
} from '../types/game'

// Helper function to unlock dependent technologies
function unlockDependentTechs(techTree: TechNode[], unlockedTechId: string): void {
  techTree.forEach(tech => {
    if (tech.dependencies.includes(unlockedTechId)) {
      const allDepsResearched = tech.dependencies.every(depId =>
        techTree.find(dep => dep.id === depId)?.researched ?? false
      )
      if (allDepsResearched) {
        tech.researched = true
      }
    }
  })
}

interface GameState {
  // Session
  session: GameSession | null
  currentPlayer: Player | null
  
  // World
  worldMap: WorldMap | null
  machines: Machine[]
  
  // Progression
  techTree: TechNode[]
  
  // UI State
  selectedMachine: Machine | null
  isPaused: boolean
  showInventory: boolean
  
  // Actions
  setSession: (session: GameSession) => void
  setPlayer: (player: Player) => void
  setWorldMap: (map: WorldMap) => void
  addMachine: (machine: Machine) => void
  removeMachine: (id: string) => void
  updateMachine: (id: string, updates: Partial<Machine>) => void
  selectMachine: (id: string | null) => void
  togglePause: () => void
  toggleInventory: () => void
  unlockTech: (techId: string) => void
  saveGame: () => SaveData
  loadGame: (data: SaveData) => void
  startGame: (settings: GameSettings) => void
  addToInventory: (item: Item) => boolean
  removeFromInventory: (itemName: string, quantity: number) => boolean
  gainExperience: (amount: number) => void
}

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    // Initial state
    session: null,
    currentPlayer: null,
    worldMap: null,
    machines: [],
    techTree: [],
    selectedMachine: null,
    isPaused: false,
    showInventory: false,

    // Actions
    setSession: (session) => set({ session }),
    
    setPlayer: (player) => set({ currentPlayer: player }),
    
    setWorldMap: (map) => set({ worldMap: map }),
    
    addMachine: (machine) => set((state) => {
      state.machines.push(machine)
    }),
    
    removeMachine: (id) => set((state) => {
      state.machines = state.machines.filter(m => m.id !== id)
    }),
    
    updateMachine: (id, updates) => set((state) => {
      const machine = state.machines.find(m => m.id === id)
      if (machine) {
        Object.assign(machine, updates)
      }
    }),
    
    selectMachine: (id) => set((state) => {
      state.selectedMachine = id 
        ? state.machines.find(m => m.id === id) ?? null
        : null
    }),
    
    togglePause: () => set((state) => {
      state.isPaused = !state.isPaused
    }),
    
    toggleInventory: () => set((state) => {
      state.showInventory = !state.showInventory
    }),
    
    unlockTech: (techId) => set((state) => {
      const tech = state.techTree.find(t => t.id === techId)
      if (tech) {
        tech.researched = true
        // Unlock dependent techs using helper function
        unlockDependentTechs(state.techTree, techId)
      }
    }),
    
    saveGame: () => {
      const state = get()
      if (!state.worldMap) {
        throw new Error('Cannot save game: world map not initialized')
      }
      const emptySettings: GameSettings = {
        maxPlayers: 1,
        difficulty: 'normal',
        pvpEnabled: false,
        friendlyFire: false,
        worldSeed: 0,
        modifiers: [],
      }
      return {
        version: '1.0.0',
        timestamp: Date.now(),
        sessionId: state.session?.id ?? '',
        world: state.worldMap,
        players: state.session?.players ?? [],
        machines: state.machines,
        techTree: state.techTree,
        gameSettings: state.session?.settings ?? emptySettings,
      }
    },
    
    loadGame: (data) => set((state) => {
      state.worldMap = data.world
      state.machines = data.machines
      state.techTree = data.techTree
    }),

    startGame: (settings) => set((state) => {
      // Initialize new game session
      state.session = {
        id: `session_${Date.now()}`,
        mode: settings.pvpEnabled ? 'pvp' : 'coop',
        players: [],
        host: 'local',
        state: 'active',
        settings,
      }
      
      // Initialize player if not exists
      if (!state.currentPlayer) {
        state.currentPlayer = {
          id: 'player_1',
          username: 'Player',
          position: { x: 50, y: 50 },
          inventory: [],
          health: 100,
          maxHealth: 100,
          stats: {
            level: 1,
            experience: 0,
            prestigeLevel: 0,
            unlockedTech: [],
            completedResearch: [],
          },
        }
      }
    }),

    addToInventory: (item) => {
      const state = get()
      if (!state.currentPlayer) return false

      const stackLimit = 100
      const existingItem = state.currentPlayer.inventory.find(i => i.name === item.name)

      if (existingItem) {
        const spaceAvailable = stackLimit - existingItem.quantity
        const amountToAdd = Math.min(item.quantity, spaceAvailable)
        
        if (amountToAdd > 0) {
          set((state) => {
            const player = state.currentPlayer
            if (player) {
              const existing = player.inventory.find(i => i.name === item.name)
              if (existing) {
                existing.quantity += amountToAdd
              }
            }
          })
          return amountToAdd === item.quantity
        }
        return false
      } else {
        set((state) => {
          const player = state.currentPlayer
          if (player) {
            const amountToAdd = Math.min(item.quantity, stackLimit)
            player.inventory.push({
              ...item,
              quantity: amountToAdd,
            })
          }
        })
        return item.quantity <= stackLimit
      }
    },

    removeFromInventory: (itemName, quantity) => {
      const state = get()
      if (!state.currentPlayer) return false

      const item = state.currentPlayer.inventory.find(i => i.name === itemName)
      if (!item || item.quantity < quantity) return false

      set((state) => {
        const player = state.currentPlayer
        if (player) {
          const itemToRemove = player.inventory.find(i => i.name === itemName)
          if (itemToRemove) {
            itemToRemove.quantity -= quantity
            if (itemToRemove.quantity <= 0) {
              const index = player.inventory.indexOf(itemToRemove)
              player.inventory.splice(index, 1)
            }
          }
        }
      })

      return true
    },

    gainExperience: (amount) => set((state) => {
      const player = state.currentPlayer
      if (!player) return

      player.stats.experience += amount

      // Level up calculation
      const xpForNextLevel = Math.floor(100 * Math.pow(1.5, player.stats.level))
      while (player.stats.experience >= xpForNextLevel) {
        player.stats.level++
        player.stats.experience -= xpForNextLevel
      }
    }),
  }))
)
