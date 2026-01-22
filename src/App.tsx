import { useState } from 'react'
import MainMenu from './components/MainMenu/MainMenu'
import GameCanvas from './components/GameCanvas/GameCanvas'
import NodeEditor from './components/NodeEditor/NodeEditor'
import HUD from './components/HUD/HUD'
import Tutorial from './components/Tutorial/Tutorial'
import BuildMenu from './components/BuildMenu/BuildMenu'
import TechTree from './components/TechTree/TechTree'
import SaveManager from './components/SaveManager/SaveManager'
import { useTutorialStore } from './store/tutorialStore'
import { useGameStore } from './store/gameStore'
import { useAutoSave } from './hooks/useAutoSave'
import type { MachineType } from './types/game'
import './App.css'

type GameState = 'menu' | 'game' | 'editor'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [showBuildMenu, setShowBuildMenu] = useState(false)
  const [showTechTree, setShowTechTree] = useState(false)
  const [showSaveManager, setShowSaveManager] = useState(false)
  const [saveManagerMode, setSaveManagerMode] = useState<'save' | 'load'>('save')
  const [_selectedBuilding, setSelectedBuilding] = useState<MachineType | null>(null)
  const startTutorial = useTutorialStore(state => state.startTutorial)
  const startGame = useGameStore(state => state.startGame)
  const selectedMachine = useGameStore(state => state.selectedMachine)

  // Enable auto-save when in game
  useAutoSave(gameState === 'game')

  const handleStartGame = (withTutorial: boolean = false) => {
    // Initialize game with default settings
    startGame({
      maxPlayers: 1,
      difficulty: 'normal',
      pvpEnabled: false,
      friendlyFire: false,
      worldSeed: Date.now(),
      modifiers: [],
    })
    
    setGameState('game')
    if (withTutorial) {
      startTutorial()
    }
  }

  const handleSelectBuilding = (type: MachineType) => {
    setSelectedBuilding(type)
    // TODO: Enter building placement mode
  }

  const handleOpenSaveManager = (mode: 'save' | 'load') => {
    setSaveManagerMode(mode)
    setShowSaveManager(true)
  }

  const handleOpenNodeEditor = () => {
    // Only open node editor if a machine is selected
    if (selectedMachine) {
      setShowNodeEditor(true)
    }
  }

  return (
    <div className="app">
      {gameState === 'menu' && (
        <MainMenu 
          onStartGame={() => handleStartGame(false)}
          onStartTutorial={() => handleStartGame(true)}
        />
      )}
      {gameState === 'game' && (
        <>
          <GameCanvas />
          <HUD 
            onOpenNodeEditor={handleOpenNodeEditor}
            onReturnToMenu={() => setGameState('menu')}
            onOpenBuildMenu={() => setShowBuildMenu(true)}
            onOpenTechTree={() => setShowTechTree(true)}
            onSave={() => handleOpenSaveManager('save')}
            onLoad={() => handleOpenSaveManager('load')}
          />
          {showNodeEditor && selectedMachine && (
            <NodeEditor onClose={() => setShowNodeEditor(false)} />
          )}
          {showBuildMenu && (
            <BuildMenu 
              onClose={() => setShowBuildMenu(false)}
              onSelectBuilding={handleSelectBuilding}
            />
          )}
          {showTechTree && (
            <TechTree onClose={() => setShowTechTree(false)} />
          )}
          {showSaveManager && (
            <SaveManager 
              onClose={() => setShowSaveManager(false)}
              mode={saveManagerMode}
            />
          )}
          <Tutorial />
        </>
      )}
    </div>
  )
}

export default App
