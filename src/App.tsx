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
import GameOverScreen from './components/GameOverScreen/GameOverScreen'
import ChatSystem from './components/ChatSystem/ChatSystem'
import Minimap from './components/Minimap/Minimap'
import KeyboardHelp from './components/KeyboardHelp/KeyboardHelp'
import AchievementNotification from './components/AchievementNotification/AchievementNotification'
import ParticleSystem, { type Particle } from './components/ParticleSystem/ParticleSystem'
import Tooltips, { useTooltips } from './components/Tooltips/Tooltips'
import UnlockProgress from './components/UnlockProgress/UnlockProgress'
import { useTutorialStore } from './store/tutorialStore'
import { useGameStore } from './store/gameStore'
import { useAutoSave } from './hooks/useAutoSave'
import { useScreenShake } from './hooks/useScreenShake'
import { achievementSystem } from './systems/AchievementSystem/AchievementSystem'
import { GameMode } from './types/game'
import type { GameSession } from './types/game'
import { audioSystem } from './systems/AudioSystem/AudioSystem'
import './App.css'

type GameState = 'intro' | 'login' | 'menu' | 'game' | 'editor'

function App() {
  const [gameState, setGameState] = useState<GameState>('login')
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [showBuildMenu, setShowBuildMenu] = useState(false)
  const [showTechTree, setShowTechTree] = useState(false)
  const [showSaveManager, setShowSaveManager] = useState(false)
  const [saveManagerMode, setSaveManagerMode] = useState<'save' | 'load'>('save')
  const startTutorial = useTutorialStore(state => state.startTutorial)
  const isInTutorial = useTutorialStore(state => state.isActive)
  const startGame = useGameStore(state => state.startGame)
  const setPlayer = useGameStore(state => state.setPlayer)
  const selectedMachine = useGameStore(state => state.selectedMachine)
  const updateGame = useGameStore(state => state.updateGame)
  const isRunning = useGameStore(state => state.isRunning)
  const isPaused = useGameStore(state => state.isPaused)
  const gameModeManager = useGameStore(state => state.gameModeManager)
  const gameTime = useGameStore(state => state.gameTime)
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const machines = useGameStore(state => state.machines)
  const stopGame = useGameStore(state => state.stopGame)
  const session = useGameStore(state => state.session)
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(Date.now())
  const [showGameOver, setShowGameOver] = useState(false)
  const [isVictory, setIsVictory] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const { tooltips } = useTooltips()
  const { shakeOffset } = useScreenShake()

  // Enable auto-save when in game
  useAutoSave(gameState === 'game')

  // Load profile picture from localStorage on mount
  useEffect(() => {
    const savedPicture = localStorage.getItem('factory_bound_profile_picture')
    if (savedPicture) {
      useGameStore.getState().setProfilePictureFile(savedPicture)
    }
  }, [])

  // Listen for tutorial completion
  useEffect(() => {
    const handleTutorialComplete = () => {
      handleReturnToMenu()
    }
    
    window.addEventListener('tutorialComplete', handleTutorialComplete)
    return () => window.removeEventListener('tutorialComplete', handleTutorialComplete)
  }, [])

  // Apply screen shake effect
  useEffect(() => {
    if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
      document.body.style.transform = `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`
    } else {
      document.body.style.transform = ''
    }
  }, [shakeOffset])


  // Track achievements
  useEffect(() => {
    if (gameState === 'game' && machines.length === 1) {
      achievementSystem.unlock('first_machine')
    }
    if (machines.length >= 10) {
      achievementSystem.setProgress('builder_10', machines.length)
    }
    if (machines.length >= 50) {
      achievementSystem.setProgress('builder_50', machines.length)
    }
    if (machines.length >= 100) {
      achievementSystem.setProgress('builder_100', machines.length)
    }
  }, [machines.length, gameState])


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

      // Check for game over
      if (gameModeManager) {
        const result = gameModeManager.update(deltaTime)
        if (result.isVictory) {
          setIsVictory(true)
          setShowGameOver(true)
          stopGame()
          return
        } else if (result.isDefeat) {
          setIsVictory(false)
          setShowGameOver(true)
          stopGame()
          return
        }
      }

      // Check player death
      if (currentPlayer && currentPlayer.health <= 0) {
        setIsVictory(false)
        setShowGameOver(true)
        stopGame()
        return
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, isRunning, isPaused, updateGame, gameModeManager, currentPlayer, stopGame])

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

  const handleStartGame = (settings: {
    worldName: string
    seed: number
    gameMode: GameMode
    enemiesEnabled: boolean
    enemyFactoriesEnabled: boolean
    oceanEnemiesEnabled: boolean
    maxEnemyBases: number
    difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  }) => {
    // Initialize game with all settings
    startGame({
      maxPlayers: 1,
      difficulty: settings.difficulty,
      pvpEnabled: false,
      friendlyFire: false,
      worldSeed: settings.seed,
      modifiers: [],
      enemiesEnabled: settings.enemiesEnabled,
      enemyFactoriesEnabled: settings.enemyFactoriesEnabled,
      oceanEnemiesEnabled: settings.oceanEnemiesEnabled,
      maxEnemyBases: settings.maxEnemyBases,
      gameMode: 'automation',
    }, settings.gameMode)
    
    console.log('World name:', settings.worldName)
    
    setGameState('game')
    // TODO: Implement audioSystem.playBackgroundMusic() - audio system pending
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
      enemiesEnabled: false,
      enemyFactoriesEnabled: false,
      oceanEnemiesEnabled: false,
      maxEnemyBases: 5,
      gameMode: 'automation',
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

  const handleReturnToMenu = () => {
    stopGame()
    setGameState('menu')
    setShowGameOver(false)
    
    // Return to menu music
    audioSystem.stopMusic(true)
    audioSystem.playMusic('menu_theme', true)
  }

  const handleLogout = () => {
    stopGame()
    setGameState('login')
  }

  const handleRetry = () => {
    // Get current game mode
    const currentMode = useGameStore.getState().currentGameMode

    // Restart with same mode using default settings
    if (currentMode) {
      startGame({
        maxPlayers: 1,
        difficulty: 'normal',
        pvpEnabled: false,
        friendlyFire: false,
        worldSeed: Date.now(),
        modifiers: [],
        enemiesEnabled: false,
        enemyFactoriesEnabled: false,
        oceanEnemiesEnabled: false,
        maxEnemyBases: 5,
        gameMode: 'automation',
      }, currentMode)

      setGameState('game')
    }

    setShowGameOver(false)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    return `${minutes}m ${seconds}s`
  }

  const calculateScore = () => {
    if (!gameModeManager) return 0
    
    // TODO: Implement proper tracking for these statistics
    const enemiesKilled = 0 // Will be tracked in future update
    const itemsProduced = 0 // Will be tracked in future update
    
    return gameModeManager.calculateScore(
      enemiesKilled,
      itemsProduced,
      currentPlayer?.stats.completedResearch.length || 0,
      machines.length
    )
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
          onLogout={handleLogout}
        />
      )}
      {gameState === 'game' && (
        <>
          <GameCanvas />
          <HUD 
            onOpenNodeEditor={handleOpenNodeEditor}
            onReturnToMenu={handleReturnToMenu}
            onOpenBuildMenu={() => setShowBuildMenu(true)}
            onOpenTechTree={() => setShowTechTree(true)}
            onSave={() => handleOpenSaveManager('save')}
            onLoad={() => handleOpenSaveManager('load')}
            inTutorial={isInTutorial}
          />
          <UnlockProgress />
          {showNodeEditor && (
            <NodeEditor onClose={() => setShowNodeEditor(false)} />
          )}
          {showBuildMenu && (
            <BuildMenu 
              onClose={() => setShowBuildMenu(false)}
              onSelectBuilding={() => {
                // Building placement handled by canvas
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
          {session?.settings?.maxPlayers && session.settings.maxPlayers > 1 && (
            <ChatSystem />
          )}
          <Minimap />
          <KeyboardHelp />
          <ParticleSystem particles={particles} onUpdate={setParticles} />
          <Tooltips tooltips={tooltips} />
          <AchievementNotification />
          {showGameOver && (
            <GameOverScreen 
              isVictory={isVictory}
              score={calculateScore()}
              playtime={formatTime(gameTime)}
              stats={{
                enemiesKilled: 0,
                itemsProduced: 0,
                techsResearched: currentPlayer?.stats.completedResearch.length || 0,
                machinesBuilt: machines.length,
              }}
              onReturnToMenu={handleReturnToMenu}
              onRestart={handleRetry}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
