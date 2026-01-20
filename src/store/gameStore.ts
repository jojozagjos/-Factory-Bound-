import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { 
  Player, 
  Machine, 
  WorldMap, 
  TechNode, 
  GameSession,
  SaveData,
  GameSettings
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
  }))
)
