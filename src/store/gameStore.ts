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
  MachineType,
  GlobalStats,
  MachineUnlock,
  ResourceDelivery,
  EnemyFactory,
} from '../types/game'
import { ProceduralGenerator } from '../engine/procedural/MapGenerator'
import { SimulationEngine } from '../engine/simulation/SimulationEngine'
import { BuildingSystem } from '../systems/BuildingSystem'
import { ResourceSystem } from '../systems/ResourceSystem'
import { CombatSystem } from '../systems/CombatSystem'
import { GameModeManager } from '../systems/GameModeManager'
import { ProgressionSystem } from '../engine/progression/ProgressionSystem'

// Enemy spawn configuration constants
const ENEMY_SPAWN_CONFIG = {
  easy: { count: 1, health: 50 },
  normal: { count: 2, health: 50 },
  hard: { count: 3, health: 75 },
  nightmare: { count: 5, health: 100 },
  factory: { health: 75 },
  factoryBase: { health: 500, spawnRate: 10 }, // enemies per minute
}

// Helper function to generate unique IDs
function generateUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

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
  enemyFactories: EnemyFactory[] // Enemy bases/spawners
  
  // Progression
  techTree: TechNode[]
  machineUnlocks: MachineUnlock[] // Builderment-style unlocking
  resourceDeliveries: ResourceDelivery[] // Track resources delivered to base
  
  // Global Stats (persists across all saves)
  globalStats: GlobalStats
  
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
  profilePicture: string
  profilePictureFile: string | null // Base64 or URL for custom uploaded image
  
  // Actions
  setSession: (session: GameSession) => void
  setPlayer: (player: Player) => void
  setProfilePicture: (avatar: string) => void
  setProfilePictureFile: (fileData: string | null) => void
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
  placeMachine: (machineType: MachineType, position: { x: number; y: number }) => boolean
  updateGlobalStats: (updates: Partial<GlobalStats>) => void
  loadGlobalStats: () => void
  saveGlobalStats: () => void
  // New Builderment-style actions
  deliverResourceToBase: (itemName: string, quantity: number) => void
  checkAndUnlockMachines: () => void
  isMachineUnlocked: (machineType: MachineType) => boolean
  addEnemyFactory: (factory: EnemyFactory) => void
  removeEnemyFactory: (id: string) => void
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
    enemyFactories: [],
    techTree: [],
    selectedMachine: null,
    isPaused: false,
    showInventory: false,
    profilePicture: '👤',
    profilePictureFile: null,
    
    // Initialize machine unlocks (Builderment-style progression)
    machineUnlocks: [
      // Tier 0 - Always unlocked
      { machineType: 'belt' as MachineType, requiredDeliveries: [], unlocked: true, order: 0 },
      { machineType: 'inserter' as MachineType, requiredDeliveries: [], unlocked: true, order: 0 },
      
      // Tier 1 - Requires basic resources
      { machineType: 'miner' as MachineType, requiredDeliveries: [
        { id: 'iron_ore', name: 'iron_ore', quantity: 10 }
      ], unlocked: false, order: 1 },
      
      // Tier 2 - Requires processed materials
      { machineType: 'smelter' as MachineType, requiredDeliveries: [
        { id: 'iron_ore', name: 'iron_ore', quantity: 50 },
        { id: 'stone', name: 'stone', quantity: 20 }
      ], unlocked: false, order: 2 },
      
      // Tier 3 - Requires refined products
      { machineType: 'assembler' as MachineType, requiredDeliveries: [
        { id: 'iron_plate', name: 'iron_plate', quantity: 30 },
        { id: 'copper_plate', name: 'copper_plate', quantity: 20 }
      ], unlocked: false, order: 3 },
      
      { machineType: 'storage' as MachineType, requiredDeliveries: [
        { id: 'iron_plate', name: 'iron_plate', quantity: 20 }
      ], unlocked: false, order: 3 },
      
      // Tier 4 - Advanced machines
      { machineType: 'power_plant' as MachineType, requiredDeliveries: [
        { id: 'iron_plate', name: 'iron_plate', quantity: 50 },
        { id: 'copper_plate', name: 'copper_plate', quantity: 50 },
        { id: 'iron_gear', name: 'iron_gear', quantity: 30 }
      ], unlocked: false, order: 4 },
      
      { machineType: 'turret' as MachineType, requiredDeliveries: [
        { id: 'iron_plate', name: 'iron_plate', quantity: 40 },
        { id: 'copper_plate', name: 'copper_plate', quantity: 30 },
        { id: 'electronic_circuit', name: 'electronic_circuit', quantity: 20 }
      ], unlocked: false, order: 4 },
    ],
    
    // Track resource deliveries to base
    resourceDeliveries: [],
    
    // Global Stats - load from localStorage on init
    globalStats: (() => {
      const saved = localStorage.getItem('factory_bound_global_stats')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load global stats:', e)
        }
      }
      return {
        totalMachinesPlaced: 0,
        totalMachinesDestroyed: 0,
        totalResourcesGathered: 0,
        totalItemsCrafted: 0,
        totalEnemiesKilled: 0,
        totalPlaytime: 0,
        totalGamesPlayed: 0,
        totalGamesWon: 0,
        rankedWins: 0,
        rankedLosses: 0,
        currentRank: 'Unranked',
        badges: [],
      }
    })(),
    
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
    
    setProfilePicture: (avatar) => set({ profilePicture: avatar }),
    
    setProfilePictureFile: (fileData) => set({ profilePictureFile: fileData }),
    
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
        enemiesEnabled: false,
        enemyFactoriesEnabled: false,
        oceanEnemiesEnabled: false,
        maxEnemyBases: 5,
        gameMode: 'automation',
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
      // Ensure settings have all required fields
      const fullSettings: GameSettings = {
        maxPlayers: settings.maxPlayers || 1,
        difficulty: settings.difficulty || 'normal',
        pvpEnabled: settings.pvpEnabled || false,
        friendlyFire: settings.friendlyFire || false,
        worldSeed: settings.worldSeed || Date.now(),
        modifiers: settings.modifiers || [],
        // New Builderment-style settings with defaults
        enemiesEnabled: settings.enemiesEnabled ?? false,
        enemyFactoriesEnabled: settings.enemyFactoriesEnabled ?? false,
        oceanEnemiesEnabled: settings.oceanEnemiesEnabled ?? false,
        maxEnemyBases: settings.maxEnemyBases || 5,
        gameMode: settings.gameMode || 'automation',
      }

      // Initialize new game session
      state.session = {
        id: `session_${Date.now()}`,
        mode: fullSettings.pvpEnabled ? 'pvp' : 'coop',
        players: [],
        host: 'local',
        state: 'active',
        settings: fullSettings,
      }
      
      // Initialize player if not exists
      if (!state.currentPlayer) {
        state.currentPlayer = {
          id: 'player_1',
          username: 'Player',
          position: { x: 50, y: 50 },
          inventory: [
            // Starting resources for Builderment-style gameplay
            { id: 'iron_plate', name: 'iron_plate', quantity: 10 },
            { id: 'iron_gear', name: 'iron_gear', quantity: 5 },
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

      // Generate world map (increased size from 100x100 to 200x200 for Builderment-style gameplay)
      const generator = new ProceduralGenerator(fullSettings.worldSeed)
      state.worldMap = generator.generateMap(200, 200, fullSettings.modifiers)
      
      // Place starting base in center of map (Builderment-style)
      const centerX = Math.floor(state.worldMap.width / 2)
      const centerY = Math.floor(state.worldMap.height / 2)
      const startingBase = state.buildingSystem.createStartingBase({ x: centerX, y: centerY })
      state.machines.push(startingBase)
      
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
        
        // Update global playtime stats
        draft.globalStats.totalPlaytime += deltaTime
        if (draft.gameTime % 10 < deltaTime) { // Save every ~10 seconds
          localStorage.setItem('factory_bound_global_stats', JSON.stringify(draft.globalStats))
        }
        
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
        
        // Check for resource deliveries to base (Builderment-style)
        const base = draft.machines.find(m => m.type === 'base')
        if (base && base.baseEntrances) {
          // Check each entrance for nearby items on belts/inserters
          base.baseEntrances.forEach(entrance => {
            // Find machines at entrance positions that might have items
            draft.machines.forEach(machine => {
              // Check if machine is adjacent to entrance and has items
              const isAdjacent = 
                Math.abs(machine.position.x - entrance.x) <= 1 &&
                Math.abs(machine.position.y - entrance.y) <= 1
              
              if (isAdjacent && machine.inventory.length > 0) {
                // Transfer items from machine to base (simulating delivery)
                const itemsToDeliver = [...machine.inventory]
                itemsToDeliver.forEach(item => {
                  if (item.quantity > 0) {
                    // Deliver resource to base
                    let delivery = draft.resourceDeliveries.find(d => d.itemName === item.name)
                    if (!delivery) {
                      delivery = { itemName: item.name, quantityDelivered: 0, quantityRequired: 0 }
                      draft.resourceDeliveries.push(delivery)
                    }
                    delivery.quantityDelivered += item.quantity
                    
                    // Update global stats
                    draft.globalStats.totalResourcesGathered += item.quantity
                  }
                })
                // Clear machine inventory after successful delivery
                machine.inventory = []
              }
            })
          })
          
          // Check and unlock machines based on deliveries
          draft.machineUnlocks.forEach(unlock => {
            if (unlock.unlocked) return
            
            const allRequirementsMet = unlock.requiredDeliveries.every(required => {
              const delivery = draft.resourceDeliveries.find(d => d.itemName === required.name)
              return delivery && delivery.quantityDelivered >= required.quantity
            })
            
            if (allRequirementsMet) {
              unlock.unlocked = true
              console.log(`🎉 Unlocked machine: ${unlock.machineType}`)
            }
          })
        }
        
        // Update game mode manager
        if (draft.gameModeManager) {
          const modeResult = draft.gameModeManager.update(deltaTime)
          
          if (modeResult.isVictory || modeResult.isDefeat) {
            draft.isRunning = false
          }
        }
        
        // Spawn enemies if enabled
        if (draft.session?.settings.enemiesEnabled && draft.worldMap) {
          // Simple enemy spawning logic
          const spawnInterval = 30 // seconds
          if (draft.gameTime % spawnInterval < deltaTime) {
            const difficulty = draft.session.settings.difficulty
            const config = ENEMY_SPAWN_CONFIG[difficulty]
            
            for (let i = 0; i < config.count; i++) {
              const enemy: Enemy = {
                id: generateUniqueId('enemy'),
                type: 'basic',
                position: {
                  x: Math.floor(Math.random() * draft.worldMap.width),
                  y: Math.floor(Math.random() * draft.worldMap.height),
                },
                health: config.health,
                maxHealth: config.health,
                target: base?.id,
              }
              draft.enemies.push(enemy)
            }
          }
          
          // Spawn enemy factories if enabled
          if (draft.session.settings.enemyFactoriesEnabled) {
            const maxBases = draft.session.settings.maxEnemyBases || 5
            if (draft.enemyFactories.length < maxBases && draft.gameTime % 60 < deltaTime) {
              const factory: EnemyFactory = {
                id: generateUniqueId('factory'),
                position: {
                  x: Math.floor(Math.random() * draft.worldMap.width),
                  y: Math.floor(Math.random() * draft.worldMap.height),
                },
                health: ENEMY_SPAWN_CONFIG.factoryBase.health,
                maxHealth: ENEMY_SPAWN_CONFIG.factoryBase.health,
                spawnRate: ENEMY_SPAWN_CONFIG.factoryBase.spawnRate,
                lastSpawnTime: draft.gameTime,
                isOceanBase: draft.session.settings.oceanEnemiesEnabled && Math.random() < 0.3,
              }
              draft.enemyFactories.push(factory)
            }
          }
          
          // Enemy factories spawn enemies
          draft.enemyFactories.forEach(factory => {
            const spawnDelay = 60 / factory.spawnRate // seconds between spawns
            if (draft.gameTime - factory.lastSpawnTime >= spawnDelay) {
              const enemy: Enemy = {
                id: generateUniqueId('enemy'),
                type: 'factory_spawn',
                position: { ...factory.position },
                health: ENEMY_SPAWN_CONFIG.factory.health,
                maxHealth: ENEMY_SPAWN_CONFIG.factory.health,
                target: base?.id,
                spawnedFrom: factory.id,
              }
              draft.enemies.push(enemy)
              factory.lastSpawnTime = draft.gameTime
            }
          })
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
      
      // Check if machine is unlocked (Builderment-style)
      if (!state.isMachineUnlocked(machineType)) {
        console.log(`Machine ${machineType} is not yet unlocked`)
        return false
      }
      
      // Check if can place
      const canPlace = buildingSystem.canPlaceAt(
        position,
        worldMap,
        machines
      )
      
      if (!canPlace) return false
      
      // Check building cost
      const cost = buildingSystem.getBuildingCost(machineType)
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
        id: generateUniqueId('machine'),
        type: machineType,
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
        // Update global stats
        state.globalStats.totalMachinesPlaced++
        localStorage.setItem('factory_bound_global_stats', JSON.stringify(state.globalStats))
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

    updateGlobalStats: (updates) => set((state) => {
      state.globalStats = { ...state.globalStats, ...updates }
      // Save to localStorage automatically
      localStorage.setItem('factory_bound_global_stats', JSON.stringify(state.globalStats))
    }),

    loadGlobalStats: () => {
      const saved = localStorage.getItem('factory_bound_global_stats')
      if (saved) {
        try {
          const stats = JSON.parse(saved)
          set({ globalStats: stats })
        } catch (e) {
          console.error('Failed to load global stats:', e)
        }
      }
    },

    saveGlobalStats: () => {
      const state = get()
      localStorage.setItem('factory_bound_global_stats', JSON.stringify(state.globalStats))
    },

    // Builderment-style resource delivery and unlocking
    deliverResourceToBase: (itemName, quantity) => set((state) => {
      // Find or create delivery tracking
      let delivery = state.resourceDeliveries.find(d => d.itemName === itemName)
      if (!delivery) {
        delivery = { itemName, quantityDelivered: 0, quantityRequired: 0 }
        state.resourceDeliveries.push(delivery)
      }
      
      // Add to delivered quantity
      delivery.quantityDelivered += quantity
      
      // Update global stats
      state.globalStats.totalResourcesGathered += quantity
      localStorage.setItem('factory_bound_global_stats', JSON.stringify(state.globalStats))
    }),

    checkAndUnlockMachines: () => set((state) => {
      // Check each locked machine
      state.machineUnlocks.forEach(unlock => {
        if (unlock.unlocked) return
        
        // Check if all required deliveries are met
        const allRequirementsMet = unlock.requiredDeliveries.every(required => {
          const delivery = state.resourceDeliveries.find(d => d.itemName === required.name)
          return delivery && delivery.quantityDelivered >= required.quantity
        })
        
        if (allRequirementsMet) {
          unlock.unlocked = true
          console.log(`Unlocked machine: ${unlock.machineType}`)
        }
      })
    }),

    isMachineUnlocked: (machineType) => {
      const state = get()
      const unlock = state.machineUnlocks.find(u => u.machineType === machineType)
      return unlock?.unlocked ?? false
    },

    addEnemyFactory: (factory: EnemyFactory) => set((state) => {
      state.enemyFactories.push(factory)
    }),

    removeEnemyFactory: (id: string) => set((state) => {
      state.enemyFactories = state.enemyFactories.filter((f: EnemyFactory) => f.id !== id)
    }),
  }))
)
