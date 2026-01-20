import { useState } from 'react'
import MainMenu from './components/MainMenu/MainMenu'
import GameCanvas from './components/GameCanvas/GameCanvas'
import NodeEditor from './components/NodeEditor/NodeEditor'
import HUD from './components/HUD/HUD'
import './App.css'

type GameState = 'menu' | 'game' | 'editor'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [showNodeEditor, setShowNodeEditor] = useState(false)

  return (
    <div className="app">
      {gameState === 'menu' && (
        <MainMenu onStartGame={() => setGameState('game')} />
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
        </>
      )}
    </div>
  )
}

export default App
