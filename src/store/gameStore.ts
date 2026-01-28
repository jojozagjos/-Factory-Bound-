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
import { MachineUnlockSystem } from '../systems/MachineUnlockSystem'

// Enemy spawn configuration constants
const ENEMY_SPAWN_CONFIG = {
  easy: { count: 1, health: 50 },
  normal: { count: 2, health: 50 },
  hard: { count: 3, health: 75 },
  nightmare: { count: 5, health: 100 },
  factory: { health: 75 },
  factoryBase: { health: 500, spawnRate: 10 }, // enemies per minute
}

const machineUnlockSystem = new MachineUnlockSystem()
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const getUnlockState = () => {
  const { unlocks, deliveries } = machineUnlockSystem.getState()
  return { unlocks: clone(unlocks), deliveries: clone(deliveries) }
}

// Helper function to generate unique IDs
function generateUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// (removed) unlockDependentTechs helper — dependency unlocking handled inline in `unlockTech`

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
  recentUnlocks: MachineType[] // Newly unlocked machines for UI hints
  trackedUnlocks: MachineType[] // Player-selected unlocks to track in the UI
  
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
  sharedCash?: number
  lastPlaceError?: { message: string; details?: any } | null
  
  // UI State
  selectedMachine: Machine | null
  isPaused: boolean
  showInventory: boolean
  buildingMode: MachineType | null
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
  setBuildingMode: (type: MachineType | null) => void
  unlockTech: (techId: string) => void
  saveGame: () => SaveData
  loadGame: (data: SaveData) => void
  startGame: (settings: GameSettings, gameMode?: GameMode) => void
  stopGame: () => void
  updateGame: (deltaTime: number) => void
  addToInventory: (item: Item) => boolean
  removeFromInventory: (itemName: string, quantity: number) => boolean
  gainExperience: (amount: number) => void
  placeMachine: (machineType: MachineType, position: { x: number; y: number }, rotation?: number) => boolean
  updateGlobalStats: (updates: Partial<GlobalStats>) => void
  loadGlobalStats: () => void
  saveGlobalStats: () => void
  // New Builderment-style actions
  deliverResourceToBase: (itemName: string, quantity: number) => void
  checkAndUnlockMachines: () => void
  isMachineUnlocked: (machineType: MachineType) => boolean
  markUnlockSeen: (machineType: MachineType) => void
  toggleTrackUnlock: (machineType: MachineType) => void
  setTrackedUnlocks: (list: MachineType[]) => void
  addEnemyFactory: (factory: EnemyFactory) => void
  removeEnemyFactory: (id: string) => void
}

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    // Initial state
    session: null,
    currentPlayer: null,
    lastPlaceError: null,
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
    buildingMode: null,
    profilePicture: '👤',
    profilePictureFile: null,
    
    // Initialize machine unlocks (Builderment-style progression)
    machineUnlocks: getUnlockState().unlocks,
    
    // Track resource deliveries to base
    resourceDeliveries: getUnlockState().deliveries,

    // Track recently unlocked machines for UI hints
    recentUnlocks: [],
    // Tracked unlocks: player-selected machines to monitor in Unlock Progress
    trackedUnlocks: [],
    
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
    sharedCash: 0,

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
      const machine = state.machines.find(m => m.id === id)
      if (machine) {
        // Refund partial resources to player when demolishing
        const refund = state.buildingSystem.demolishMachine(machine.type)
        if (state.currentPlayer && refund.length) {
          refund.forEach(item => {
            const existing = state.currentPlayer!.inventory.find(i => i.name === item.name)
            if (existing) {
              existing.quantity += item.quantity
            } else {
              state.currentPlayer!.inventory.push({ ...item })
            }
          })
        }
      }
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
    setBuildingMode: (type) => set((state) => { state.buildingMode = type }),
    
    unlockTech: (techId) => {
      const state = get()
      const tech = state.techTree.find(t => t.id === techId)
      
      if (!tech) {
        console.error(`Tech ${techId} not found`)
        return
      }
      
      if (tech.researched) {
        console.log(`Tech ${techId} already researched`)
        return
      }
      
      // Check if all dependencies are met
      const allDependenciesMet = tech.dependencies.every(depId => {
        const depTech = state.techTree.find(t => t.id === depId)
        return depTech?.researched === true
      })
      
      if (!allDependenciesMet) {
        console.error(`Cannot research ${tech.name}: dependencies not met`)
        return
      }
      
      // Check if player has required resources
      if (!state.currentPlayer) {
        console.error('No current player')
        return
      }
      
      const hasResources = tech.cost.every(costItem => {
        const playerItem = state.currentPlayer!.inventory.find(i => i.name === costItem.name)
        return playerItem && playerItem.quantity >= costItem.quantity
      })
      
      if (!hasResources) {
        console.error(`Cannot research ${tech.name}: insufficient resources`)
        return
      }
      
      // Deduct resources
      set((state) => {
        tech.cost.forEach(costItem => {
          const playerItem = state.currentPlayer!.inventory.find(i => i.name === costItem.name)
          if (playerItem) {
            playerItem.quantity -= costItem.quantity
            // Remove item if quantity reaches 0
            if (playerItem.quantity <= 0) {
              const index = state.currentPlayer!.inventory.indexOf(playerItem)
              state.currentPlayer!.inventory.splice(index, 1)
            }
          }
        })
        
        // Mark tech as researched
        tech.researched = true
        
        // Add to player stats
        if (!state.currentPlayer!.stats.completedResearch.includes(techId)) {
          state.currentPlayer!.stats.completedResearch.push(techId)
        }
        
        console.log(`✓ Researched: ${tech.name}`)
      })
    },
    
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
        machineUnlocks: machineUnlockSystem.getState().unlocks,
        resourceDeliveries: machineUnlockSystem.getState().deliveries,
      }
    },
    
    loadGame: (data) => set((state) => {
      state.worldMap = data.world
      state.machines = data.machines
      state.techTree = data.techTree

      if (data.machineUnlocks && data.resourceDeliveries) {
        machineUnlockSystem.setState({ unlocks: clone(data.machineUnlocks), deliveries: clone(data.resourceDeliveries) })
      } else {
        machineUnlockSystem.reset()
      }

      const { unlocks, deliveries } = getUnlockState()
      state.machineUnlocks = unlocks
      state.resourceDeliveries = deliveries
      state.recentUnlocks = []
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

      // Reset unlock progression for a fresh session
      machineUnlockSystem.reset()
      const freshUnlocks = getUnlockState()
      state.machineUnlocks = freshUnlocks.unlocks
      state.resourceDeliveries = freshUnlocks.deliveries
      state.recentUnlocks = []
      
      // Initialize player if not exists
      const isSolo = (fullSettings.maxPlayers || 1) <= 1
      if (!state.currentPlayer) {
        state.currentPlayer = {
          id: 'player_1',
          username: 'Player',
          position: { x: 50, y: 50 },
          inventory: [],
          health: 100,
          maxHealth: 100,
          // Single-player gets personal cash; coop uses sharedCash
          cash: isSolo ? 2000 : 0,
          stats: {
            level: 1,
            experience: 0,
            prestigeLevel: 0,
            unlockedTech: [],
            completedResearch: [],
          },
        }
        if (state.session?.mode === 'coop') {
          state.sharedCash = 2000
        }
        // For convenience in single-player also set sharedCash to 2000 so HUD has a stable value
        if (isSolo) {
          state.sharedCash = 2000
        }
      }

      // Generate world map (increased size from 200x200 to 500x500 for Builderment-style large world gameplay)
      const mapSize = fullSettings.worldSeed % 100 === 0 ? 300 : 500 // Vary size based on seed
      const generator = new ProceduralGenerator(fullSettings.worldSeed)
      state.worldMap = generator.generateMap(mapSize, mapSize, fullSettings.modifiers)
      
      // Initialize game systems
      state.currentGameMode = gameMode || ('custom' as GameMode)
      state.simulationEngine = new SimulationEngine()
      state.combatSystem = new CombatSystem()
      state.gameModeManager = new GameModeManager(state.currentGameMode)
      state.progressionSystem = new ProgressionSystem()
      
      // Initialize tech tree
      state.techTree = state.progressionSystem.getTechTree()
      
      // Reset game state BEFORE adding bases
      state.machines = []
      state.enemies = []
      state.projectiles = []
      state.gameTime = 0
      state.lastUpdateTime = Date.now()
      state.isPaused = false
      
      // Place starting base(s) - single base for single-player/coop, multiple for PVP
      if (fullSettings.pvpEnabled && fullSettings.maxPlayers >= 2 && fullSettings.maxPlayers <= 4) {
        // PVP mode: Auto-place multiple bases for 2-4 players
        const pvpBases = state.buildingSystem.createPVPBases(
          state.worldMap.width,
          state.worldMap.height,
          fullSettings.maxPlayers
        )
        state.machines.push(...pvpBases)
        console.log(`🏭 PVP mode: Placed ${pvpBases.length} bases for ${fullSettings.maxPlayers} players`)
      } else {
        // Single-player/Co-op mode: do NOT auto-place a starter base.
        // The player must place their starter base in-game before other machines can be built.
        console.log('Single-player: starter base will be placed by the player in-game')
      }
      
      state.isRunning = true
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
        
        // Check for resource deliveries to research lab (formerly base)
        const base = draft.machines.find(m => m.type === 'research_lab')
        if (base && base.baseEntrances) {
          let deliveredAny = false
          const newlyUnlocked: MachineType[] = []

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
                    const { unlockedMachines } = machineUnlockSystem.deliverToBase(item.name, item.quantity)
                    deliveredAny = true
                    draft.globalStats.totalResourcesGathered += item.quantity
                    if (unlockedMachines.length) {
                      newlyUnlocked.push(...unlockedMachines)
                      console.log(`🎉 Unlocked machines: ${unlockedMachines.join(', ')}`)
                    }
                  }
                })
                // Clear machine inventory after successful delivery
                machine.inventory = []
              }
            })
          })

          if (deliveredAny) {
            const { unlocks, deliveries } = getUnlockState()
            draft.machineUnlocks = unlocks
            draft.resourceDeliveries = deliveries
            if (newlyUnlocked.length) {
              draft.recentUnlocks = Array.from(new Set([...draft.recentUnlocks, ...newlyUnlocked]))
            }
          }
        }

        // Research Labs: accept any items and contribute to global unlock progression.
        // Items entering a `research_lab` are consumed. If they match required deliveries
        // for progression, they count toward unlocking machines/tech (global state).
        const researchLabs = draft.machines.filter(m => m.type === 'research_lab')
        if (researchLabs.length > 0) {
          let labDeliveredAny = false
          const newlyUnlockedFromLabs: string[] = []

          researchLabs.forEach(lab => {
            if (!lab.inventory || lab.inventory.length === 0) return

            // Deliver every item in the lab (they are consumed on entry)
            const itemsToDeliver = [...lab.inventory]
            itemsToDeliver.forEach(item => {
              if (item.quantity > 0) {
                const { unlockedMachines } = machineUnlockSystem.deliverToBase(item.name, item.quantity)
                labDeliveredAny = true
                draft.globalStats.totalResourcesGathered += item.quantity
                if (unlockedMachines.length) {
                  newlyUnlockedFromLabs.push(...unlockedMachines)
                  console.log(`🎓 Research Lab contributed: unlocked ${unlockedMachines.join(', ')}`)
                }
              }
            })

            // Clear the lab's inventory after consumption
            lab.inventory = []
          })

          if (labDeliveredAny) {
            const { unlocks, deliveries } = getUnlockState()
            draft.machineUnlocks = unlocks
            draft.resourceDeliveries = deliveries
            if (newlyUnlockedFromLabs.length) {
              // cast to MachineType[] because unlock system returns machine IDs compatible with MachineType
              draft.recentUnlocks = Array.from(new Set([...draft.recentUnlocks, ...newlyUnlockedFromLabs])) as unknown as any
            }
          }
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

    placeMachine: (machineType, position, rotation = 0) => {
      const state = get()
      const { buildingSystem, worldMap, machines, currentPlayer } = state
      
      if (!worldMap || !currentPlayer) {
        console.log('placeMachine failed: missing worldMap or currentPlayer', { worldMap: !!worldMap, currentPlayer: !!currentPlayer })
        return false
      }

      // Allow building before a base exists (Builderment-style): players may build anywhere.
      // Still enforce that only one `base` can exist.
      const hasBase = state.machines.some(m => m.type === 'research_lab')
      if (machineType === 'research_lab') {
        if (hasBase) {
          console.log('placeMachine failed: a research lab already exists; only one allowed')
          set((s) => { s.lastPlaceError = { message: 'research_lab_already_exists' } })
          return false
        }
      }
      
      // Check if machine is unlocked (Builderment-style).
      // Allow the player to place the starting `research_lab` even if it's not unlocked by progression.
      if (machineType !== 'research_lab' && !state.isMachineUnlocked(machineType)) {
        console.log(`placeMachine failed: machine ${machineType} is not yet unlocked`)
        return false
      }
      
      // Check if can place. Special-case `research_lab` which occupies a 3x3 area.
      let canPlace = false
      if (machineType === 'research_lab') {
        // Ensure a 3x3 centered on `position` is within bounds, not water and no collisions
        const offsets = [-1, 0, 1]
        canPlace = true
        for (const dx of offsets) {
          for (const dy of offsets) {
            const p = { x: position.x + dx, y: position.y + dy }
            // Out of bounds or water
            if (
              p.x < 0 || p.y < 0 || p.x >= worldMap.width || p.y >= worldMap.height
            ) {
              canPlace = false
              break
            }
            const tile = worldMap.tiles.get(`${p.x},${p.y}`)
            if (tile?.type === 'water') {
              canPlace = false
              break
            }
            const collides = machines.some(m => m.position.x === p.x && m.position.y === p.y)
            if (collides) {
              canPlace = false
              break
            }
          }
          if (!canPlace) break
        }
      } else {
        canPlace = buildingSystem.canPlaceAt(position, worldMap, machines, machineType)
      }

      if (!canPlace) {
        console.log('placeMachine failed: spatial validation failed for', machineType, position)
        set((s) => { s.lastPlaceError = { message: 'spatial_validation_failed', details: { machineType, position } } })
        return false
      }
      
      // Check building cost
      const cost = buildingSystem.getBuildingCost(machineType)
      if (!cost) {
        console.log('placeMachine failed: no cost info for', machineType)
        set((s) => { s.lastPlaceError = { message: 'no_cost_info', details: { machineType } } })
        return false
      }
      // Check player's cash balance or shared cash for priced buildings
      const usingShared = state.session?.mode === 'coop'
      if (cost.price) {
        if (usingShared) {
          const shared = state.sharedCash || 0
          if (shared < cost.price) {
              console.log('placeMachine failed: insufficient shared cash for', machineType, { required: cost.price, shared })
              set((s) => { s.lastPlaceError = { message: 'insufficient_shared_cash', details: { required: cost.price, shared } } })
              return false
            }
        } else if (currentPlayer.cash !== undefined) {
          if (currentPlayer.cash < cost.price) {
            console.log('placeMachine failed: insufficient cash for', machineType, { required: cost.price, cash: currentPlayer.cash })
            set((s) => { s.lastPlaceError = { message: 'insufficient_cash', details: { required: cost.price, cash: currentPlayer.cash } } })
            return false
          }
        }
      }
      
      // Check if player has resources
      const hasResources = cost.costs.every(item => {
        const playerItem = currentPlayer.inventory.find(i => i.name === item.name)
        return playerItem && playerItem.quantity >= item.quantity
      })
      
      if (!hasResources) {
        console.log('placeMachine failed: player lacks required resources for', machineType, { required: cost.costs, inventory: currentPlayer.inventory })
        set((s) => { s.lastPlaceError = { message: 'missing_resources', details: { required: cost.costs, inventory: currentPlayer.inventory } } })
        return false
      }
      
      // Deduct resources
      let success = true
      cost.costs.forEach(item => {
        const removed = get().removeFromInventory(item.name, item.quantity)
        if (!removed) success = false
      })
      
      if (!success) {
        console.log('placeMachine failed: could not deduct resources for', machineType)
        set((s) => { s.lastPlaceError = { message: 'deduction_failed', details: { machineType } } })
        return false
      }

      // Deduct cash price (if any) from player or shared pool
      if (cost.price) {
        if (state.session?.mode === 'coop') {
          set((s) => { s.sharedCash = (s.sharedCash || 0) - (cost.price || 0) })
        } else {
          set((s) => { if (s.currentPlayer) s.currentPlayer.cash = (s.currentPlayer.cash || 0) - (cost.price || 0) })
        }
      }
      
      // Create and place machine
      const newMachine: Machine = {
        id: generateUniqueId('machine'),
        type: machineType,
        position,
        rotation,
        inventory: [],
        power: {
          required: state.buildingSystem.getMachinePowerRequirement(machineType as any),
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
        state.lastPlaceError = null
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

    // Builderment-style: no XP progression. Convert experience rewards into cash.
    gainExperience: (amount) => set((state) => {
      const player = state.currentPlayer
      if (!player) return

      // Award cash instead of XP. Use amount as direct currency for simplicity.
      player.cash = (player.cash || 0) + amount
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
      const { unlockedMachines } = machineUnlockSystem.deliverToBase(itemName, quantity)
      const { unlocks, deliveries } = getUnlockState()
      state.machineUnlocks = unlocks
      state.resourceDeliveries = deliveries
      if (unlockedMachines.length) {
        state.recentUnlocks = Array.from(new Set([...state.recentUnlocks, ...unlockedMachines]))
        console.log(`Unlocked machines: ${unlockedMachines.join(', ')}`)
      }
      state.globalStats.totalResourcesGathered += quantity
      localStorage.setItem('factory_bound_global_stats', JSON.stringify(state.globalStats))
    }),

    checkAndUnlockMachines: () => set((state) => {
      const { unlocks, deliveries } = getUnlockState()
      state.machineUnlocks = unlocks
      state.resourceDeliveries = deliveries
    }),

    isMachineUnlocked: (machineType) => machineUnlockSystem.isMachineUnlocked(machineType),

    markUnlockSeen: (machineType) => set((state) => {
      state.recentUnlocks = state.recentUnlocks.filter(type => type !== machineType)
    }),
    toggleTrackUnlock: (machineType) => set((state) => {
      const idx = state.trackedUnlocks.indexOf(machineType)
      if (idx >= 0) {
        state.trackedUnlocks.splice(idx, 1)
      } else {
        state.trackedUnlocks.push(machineType)
      }
    }),
    setTrackedUnlocks: (list) => set((state) => {
      state.trackedUnlocks = list
    }),

    addEnemyFactory: (factory: EnemyFactory) => set((state) => {
      state.enemyFactories.push(factory)
    }),

    removeEnemyFactory: (id: string) => set((state) => {
      state.enemyFactories = state.enemyFactories.filter((f: EnemyFactory) => f.id !== id)
    }),
  }))
)
