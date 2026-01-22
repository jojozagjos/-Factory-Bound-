import { useState, useEffect, useRef } from 'react'
import MainMenu from './components/MainMenu/MainMenu'
import GameCanvas from './components/GameCanvas/GameCanvas'
import NodeEditor from './components/NodeEditor/NodeEditor'
import HUD from './components/HUD/HUD'
import Tutorial from './components/Tutorial/Tutorial'
import BuildMenu from './components/BuildMenu/BuildMenu'
import TechTree from './components/TechTree/TechTree'
import SaveManager from './components/SaveManager/SaveManager'
import LoginScreen from './components/LoginScreen/LoginScreen'
import { useTutorialStore } from './store/tutorialStore'
import { useGameStore } from './store/gameStore'
import { useAutoSave } from './hooks/useAutoSave'
import { GameMode } from './types/game'
import type { GameSession } from './types/game'
import './App.css'

type GameState = 'login' | 'menu' | 'game' | 'editor'

function App() {
  const [gameState, setGameState] = useState<GameState>('login')
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [showBuildMenu, setShowBuildMenu] = useState(false)
  const [showTechTree, setShowTechTree] = useState(false)
  const [showSaveManager, setShowSaveManager] = useState(false)
  const [saveManagerMode, setSaveManagerMode] = useState<'save' | 'load'>('save')
  const startTutorial = useTutorialStore(state => state.startTutorial)
  const startGame = useGameStore(state => state.startGame)
  const setPlayer = useGameStore(state => state.setPlayer)
  const selectedMachine = useGameStore(state => state.selectedMachine)
  const updateGame = useGameStore(state => state.updateGame)
  const isRunning = useGameStore(state => state.isRunning)
  const isPaused = useGameStore(state => state.isPaused)
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(Date.now())

  // Enable auto-save when in game
  useAutoSave(gameState === 'game')

  // Game loop
  useEffect(() => {
    if (gameState !== 'game' || !isRunning || isPaused) {
      return
    }

    const gameLoop = () => {
      const now = Date.now()
      const deltaTime = now - lastTimeRef.current
      lastTimeRef.current = now

      // Update game (max 50ms per frame to prevent spiral of death)
      updateGame(Math.min(deltaTime, 50))

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, isRunning, isPaused, updateGame])

  const handleLogin = (username: string) => {
    // Set the player username
    setPlayer({
      id: 'player_1',
      username: username,
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
    })
    setGameState('menu')
  }

  const handleStartGame = (gameMode: GameMode) => {
    // Initialize game with selected mode
    startGame({
      maxPlayers: 1,
      difficulty: 'normal',
      pvpEnabled: false,
      friendlyFire: false,
      worldSeed: Date.now(),
      modifiers: [],
    }, gameMode)
    
    setGameState('game')
  }

  const handleStartTutorial = () => {
    // Initialize game with default settings for tutorial
    startGame({
      maxPlayers: 1,
      difficulty: 'easy',
      pvpEnabled: false,
      friendlyFire: false,
      worldSeed: 12345, // Fixed seed for consistent tutorial experience
      modifiers: [],
    }, GameMode.CUSTOM)
    
    setGameState('game')
    startTutorial()
  }

  const handleStartMultiplayer = (session: GameSession) => {
    // Initialize game with multiplayer session settings
    // In multiplayer, use custom mode by default
    startGame(session.settings, GameMode.CUSTOM)
    setGameState('game')
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
      {gameState === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {gameState === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame}
          onStartTutorial={handleStartTutorial}
          onStartMultiplayer={handleStartMultiplayer}
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
          {showNodeEditor && (
            <NodeEditor onClose={() => setShowNodeEditor(false)} />
          )}
          {showBuildMenu && (
            <BuildMenu 
              onClose={() => setShowBuildMenu(false)}
              onSelectBuilding={() => {
                // TODO: Enter building placement mode
              }}
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
