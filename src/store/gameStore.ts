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
  GameMode,
  Enemy,
  Projectile,
} from '../types/game'
import { ProceduralGenerator } from '../engine/procedural/MapGenerator'
import { SimulationEngine } from '../engine/simulation/SimulationEngine'
import { BuildingSystem } from '../systems/BuildingSystem'
import { ResourceSystem } from '../systems/ResourceSystem'
import { CombatSystem } from '../systems/CombatSystem'
import { GameModeManager } from '../systems/GameModeManager'
import { ProgressionSystem } from '../engine/progression/ProgressionSystem'

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
  currentGameMode: GameMode | null
  
  // World
  worldMap: WorldMap | null
  machines: Machine[]
  enemies: Enemy[]
  projectiles: Projectile[]
  
  // Progression
  techTree: TechNode[]
  
  // Game Systems
  simulationEngine: SimulationEngine | null
  buildingSystem: BuildingSystem
  resourceSystem: ResourceSystem
  combatSystem: CombatSystem | null
  gameModeManager: GameModeManager | null
  progressionSystem: ProgressionSystem | null
  
  // Game State
  isRunning: boolean
  gameTime: number
  lastUpdateTime: number
  
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
  startGame: (settings: GameSettings, gameMode?: GameMode) => void
  stopGame: () => void
  updateGame: (deltaTime: number) => void
  addToInventory: (item: Item) => boolean
  removeFromInventory: (itemName: string, quantity: number) => boolean
  gainExperience: (amount: number) => void
  placeMachine: (machineType: string, position: { x: number; y: number }) => boolean
}

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    // Initial state
    session: null,
    currentPlayer: null,
    currentGameMode: null,
    worldMap: null,
    machines: [],
    enemies: [],
    projectiles: [],
    techTree: [],
    selectedMachine: null,
    isPaused: false,
    showInventory: false,
    
    // Game Systems
    simulationEngine: null,
    buildingSystem: new BuildingSystem(),
    resourceSystem: new ResourceSystem(),
    combatSystem: null,
    gameModeManager: null,
    progressionSystem: null,
    
    // Game State
    isRunning: false,
    gameTime: 0,
    lastUpdateTime: Date.now(),

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

    startGame: (settings, gameMode) => set((state) => {
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
          inventory: [
            // Starting resources
            { id: 'iron_plate', name: 'iron_plate', quantity: 50 },
            { id: 'copper_plate', name: 'copper_plate', quantity: 50 },
            { id: 'iron_gear', name: 'iron_gear', quantity: 20 },
            { id: 'electronic_circuit', name: 'electronic_circuit', quantity: 10 },
            { id: 'stone', name: 'stone', quantity: 50 },
          ],
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

      // Generate world map
      const generator = new ProceduralGenerator(settings.worldSeed || Date.now())
      state.worldMap = generator.generateMap(100, 100, settings.modifiers || [])
      
      // Initialize game systems
      state.currentGameMode = gameMode || ('custom' as GameMode)
      state.simulationEngine = new SimulationEngine()
      state.combatSystem = new CombatSystem()
      state.gameModeManager = new GameModeManager(state.currentGameMode)
      state.progressionSystem = new ProgressionSystem()
      
      // Initialize tech tree
      state.techTree = state.progressionSystem.getTechTree()
      
      // Reset game state
      state.machines = []
      state.enemies = []
      state.projectiles = []
      state.isRunning = true
      state.gameTime = 0
      state.lastUpdateTime = Date.now()
      state.isPaused = false
    }),

    stopGame: () => set((state) => {
      state.isRunning = false
      state.simulationEngine = null
      state.combatSystem = null
      state.gameModeManager = null
    }),

    updateGame: (deltaTime) => {
      const state = get()
      if (!state.isRunning || state.isPaused || !state.simulationEngine) return
      
      set((draft) => {
        draft.gameTime += deltaTime
        
        // Update simulation engine
        if (draft.simulationEngine) {
          const simResult = draft.simulationEngine.update(
            deltaTime,
            draft.machines,
            draft.enemies,
            draft.projectiles
          )
          
          draft.machines = simResult.machines
          draft.enemies = simResult.enemies
          draft.projectiles = simResult.projectiles
        }
        
        // Update game mode manager
        if (draft.gameModeManager) {
          const modeResult = draft.gameModeManager.update(deltaTime)
          
          if (modeResult.isVictory || modeResult.isDefeat) {
            draft.isRunning = false
          }
        }
        
        // Check for player death
        if (draft.currentPlayer && draft.currentPlayer.health <= 0) {
          draft.isRunning = false
        }
      })
    },

    placeMachine: (machineType, position) => {
      const state = get()
      const { buildingSystem, worldMap, machines, currentPlayer } = state
      
      if (!worldMap || !currentPlayer) return false
      
      // Check if can place
      const canPlace = buildingSystem.canPlaceAt(
        position,
        worldMap,
        machines
      )
      
      if (!canPlace) return false
      
      // Check building cost
      const cost = buildingSystem.getBuildingCost(machineType as any)
      if (!cost) return false
      
      // Check if player has resources
      const hasResources = cost.costs.every(item => {
        const playerItem = currentPlayer.inventory.find(i => i.name === item.name)
        return playerItem && playerItem.quantity >= item.quantity
      })
      
      if (!hasResources) return false
      
      // Deduct resources
      let success = true
      cost.costs.forEach(item => {
        const removed = get().removeFromInventory(item.name, item.quantity)
        if (!removed) success = false
      })
      
      if (!success) return false
      
      // Create and place machine
      const newMachine: Machine = {
        id: `machine_${Date.now()}_${Math.random()}`,
        type: machineType as any,
        position,
        rotation: 0,
        inventory: [],
        power: {
          required: 0,
          available: 0,
          connected: false,
        },
        health: 100,
        maxHealth: 100,
      }
      
      set((state) => {
        state.machines.push(newMachine)
      })
      
      return true
    },

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
