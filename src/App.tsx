import { useState } from 'react'
import MainMenu from './components/MainMenu/MainMenu'
import GameCanvas from './components/GameCanvas/GameCanvas'
import NodeEditor from './components/NodeEditor/NodeEditor'
import HUD from './components/HUD/HUD'
import Tutorial from './components/Tutorial/Tutorial'
import { useTutorialStore } from './store/tutorialStore'
import './App.css'

type GameState = 'menu' | 'game' | 'editor'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const startTutorial = useTutorialStore(state => state.startTutorial)

  const handleStartGame = (withTutorial: boolean = false) => {
    setGameState('game')
    if (withTutorial) {
      startTutorial()
    }
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
          />
          {showNodeEditor && (
            <NodeEditor onClose={() => setShowNodeEditor(false)} />
          )}
          <Tutorial />
        </>
      )}
    </div>
  )
}

export default App
