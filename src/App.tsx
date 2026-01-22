import { useState } from 'react'
import MainMenu from './components/MainMenu/MainMenu'
import GameCanvas from './components/GameCanvas/GameCanvas'
import NodeEditor from './components/NodeEditor/NodeEditor'
import HUD from './components/HUD/HUD'
import Tutorial from './components/Tutorial/Tutorial'
import BuildMenu from './components/BuildMenu/BuildMenu'
import TechTree from './components/TechTree/TechTree'
import { useTutorialStore } from './store/tutorialStore'
import type { MachineType } from './types/game'
import './App.css'

type GameState = 'menu' | 'game' | 'editor'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [showBuildMenu, setShowBuildMenu] = useState(false)
  const [showTechTree, setShowTechTree] = useState(false)
  const [_selectedBuilding, setSelectedBuilding] = useState<MachineType | null>(null)
  const startTutorial = useTutorialStore(state => state.startTutorial)

  const handleStartGame = (withTutorial: boolean = false) => {
    setGameState('game')
    if (withTutorial) {
      startTutorial()
    }
  }

  const handleSelectBuilding = (type: MachineType) => {
    setSelectedBuilding(type)
    // TODO: Enter building placement mode
  }

  return (
    <div className="app">
      {gameState === 'menu' && (
        <MainMenu onStartGame={() => handleStartGame(true)} />
      )}
      {gameState === 'game' && (
        <>
          <GameCanvas />
          <HUD 
            onOpenNodeEditor={() => setShowNodeEditor(true)}
            onReturnToMenu={() => setGameState('menu')}
            onOpenBuildMenu={() => setShowBuildMenu(true)}
            onOpenTechTree={() => setShowTechTree(true)}
          />
          {showNodeEditor && (
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
          <Tutorial />
        </>
      )}
    </div>
  )
}

export default App
