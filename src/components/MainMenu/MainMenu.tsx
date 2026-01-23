import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import MultiplayerLobby from '../MultiplayerLobby/MultiplayerLobby'
import ProfileScreen from '../ProfileScreen/ProfileScreen'
import KeybindSettings from '../KeybindSettings/KeybindSettings'
import NewGameScreen from '../NewGameScreen/NewGameScreen'
import type { GameSession, GameMode } from '../../types/game'
import './MainMenu.css'

interface MainMenuProps {
  onStartGame: (settings: {
    worldName: string
    seed: number
    gameMode: GameMode
    enemiesEnabled: boolean
    enemyFactoriesEnabled: boolean
    oceanEnemiesEnabled: boolean
    maxEnemyBases: number
    difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  }) => void
  onStartTutorial: () => void
  onStartMultiplayer?: (session: GameSession) => void
  onLogout?: () => void
}

const MainMenu = ({ onStartGame, onStartTutorial, onStartMultiplayer, onLogout }: MainMenuProps) => {
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const [showSinglePlayer, setShowSinglePlayer] = useState(false)
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCredits, setShowCredits] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showKeybinds, setShowKeybinds] = useState(false)
  const [showNewGame, setShowNewGame] = useState(false)
  const [multiplayerMode, setMultiplayerMode] = useState<'host' | 'join' | 'ranked' | null>(null)
  const [isPvP, setIsPvP] = useState(false)

  const isGuest = !currentPlayer || currentPlayer.username === 'Guest'

  const handleMultiplayerStart = (session: GameSession) => {
    if (onStartMultiplayer) {
      onStartMultiplayer(session)
    }
  }

  const handleCancelMultiplayer = () => {
    setMultiplayerMode(null)
    setShowMultiplayer(false)
  }

  const handleNewGame = (settings: {
    worldName: string
    seed: number
    gameMode: GameMode
    enemiesEnabled: boolean
    enemyFactoriesEnabled: boolean
    oceanEnemiesEnabled: boolean
    maxEnemyBases: number
    difficulty: 'easy' | 'normal' | 'hard' | 'nightmare'
  }) => {
    // Pass settings object to game initialization
    onStartGame(settings)
    setShowNewGame(false)
  }

  const handleCancelNewGame = () => {
    setShowNewGame(false)
    setShowSinglePlayer(false)
  }

  // Show new game screen
  if (showNewGame) {
    return (
      <NewGameScreen
        onStartGame={handleNewGame}
        onCancel={handleCancelNewGame}
      />
    )
  }

  // Show profile screen
  if (showProfile) {
    return <ProfileScreen onClose={() => setShowProfile(false)} />
  }

  // Show keybind settings
  if (showKeybinds) {
    return <KeybindSettings onClose={() => setShowKeybinds(false)} />
  }

  // Show multiplayer lobby if mode is selected
  if (multiplayerMode) {
    return (
      <MultiplayerLobby 
        mode={multiplayerMode}
        isPvP={isPvP}
        onStartGame={handleMultiplayerStart}
        onCancel={handleCancelMultiplayer}
      />
    )
  }

  return (
    <div className="main-menu">
      <div className="menu-background" />
      <div className="menu-content">
        <h1 className="game-title">Factory Bound</h1>
        <p className="game-subtitle">Automation • Strategy • Programming</p>

        {!showSinglePlayer && !showMultiplayer && !showSettings && !showCredits && (
          <div className="menu-buttons">
            <button 
              className="menu-button primary"
              onClick={() => setShowSinglePlayer(true)}
              aria-label="Start Single Player"
            >
              🎮 Single Player
            </button>
            <button 
              className="menu-button primary"
              onClick={() => setShowMultiplayer(true)}
              aria-label="Start Multiplayer"
              disabled={isGuest}
              title={isGuest ? 'Login required for multiplayer' : ''}
            >
              🌐 Multiplayer
            </button>
            <button 
              className="menu-button primary"
              onClick={onStartTutorial}
              aria-label="Start Tutorial"
            >
              📚 Tutorial
            </button>
            
            {/* Hide profile for guest players */}
            {!isGuest && (
              <button 
                className="menu-button"
                onClick={() => setShowProfile(true)}
                aria-label="Open Profile"
              >
                👤 Profile
              </button>
            )}
            
            <button 
              className="menu-button"
              onClick={() => setShowSettings(true)}
              aria-label="Open Settings"
            >
              ⚙️ Settings
            </button>
            <button 
              className="menu-button" 
              onClick={() => setShowCredits(true)}
              aria-label="View Credits"
            >
              ℹ️ Credits
            </button>
            {onLogout && (
              <button 
                className="menu-button logout-btn" 
                onClick={onLogout}
                aria-label="Logout"
              >
                🚪 Logout
              </button>
            )}
          </div>
        )}

        {showSinglePlayer && (
          <div className="sub-menu slide-in">
            <h2>Single Player</h2>
            <button 
              className="menu-button primary" 
              onClick={() => setShowNewGame(true)}
            >
              New Game
            </button>
            <button className="menu-button">Load Game</button>
            <button 
              className="menu-button back" 
              onClick={() => setShowSinglePlayer(false)}
            >
              Back
            </button>
          </div>
        )}

        {showMultiplayer && (
          <div className="sub-menu slide-in">
            <h2>Multiplayer</h2>
            {isGuest ? (
              <p className="warning-message">⚠️ Please login to access multiplayer features</p>
            ) : (
              <>
                <button 
                  className="menu-button primary" 
                  onClick={() => {
                    setIsPvP(false)
                    setMultiplayerMode('host')
                  }}
                >
                  Host Co-op Game
                </button>
                <button 
                  className="menu-button" 
                  onClick={() => {
                    setIsPvP(false)
                    setMultiplayerMode('join')
                  }}
                >
                  Join Co-op Game
                </button>
                <button 
                  className="menu-button" 
                  onClick={() => {
                    setIsPvP(true)
                    setMultiplayerMode('ranked')
                  }}
                >
                  Ranked PvP
                </button>
                <button 
                  className="menu-button" 
                  onClick={() => {
                    setIsPvP(true)
                    setMultiplayerMode('host')
                  }}
                >
                  Custom PvP
                </button>
              </>
            )}
            <button 
              className="menu-button back" 
              onClick={() => setShowMultiplayer(false)}
            >
              Back
            </button>
          </div>
        )}

        {showSettings && (
          <div className="sub-menu slide-in">
            <h2>Settings</h2>
            <button 
              className="menu-button primary" 
              onClick={() => setShowKeybinds(true)}
            >
              ⌨️ Keybind Settings
            </button>
            <div className="settings-section">
              <h3>Graphics</h3>
              <label>
                <span>Resolution</span>
                <select>
                  <option>1920x1080</option>
                  <option>2560x1440</option>
                  <option>3840x2160</option>
                </select>
              </label>
              <label>
                <span>Quality</span>
                <select>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Ultra</option>
                </select>
              </label>
            </div>
            <div className="settings-section">
              <h3>Audio</h3>
              <label>
                <span>Master Volume</span>
                <input type="range" min="0" max="100" defaultValue="80" />
              </label>
              <label>
                <span>Music Volume</span>
                <input type="range" min="0" max="100" defaultValue="60" />
              </label>
              <label>
                <span>SFX Volume</span>
                <input type="range" min="0" max="100" defaultValue="80" />
              </label>
            </div>
            <div className="settings-section">
              <h3>Accessibility</h3>
              <label>
                <input type="checkbox" />
                <span>Colorblind Mode</span>
              </label>
              <label>
                <input type="checkbox" />
                <span>Screen Reader Support</span>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Reduce Motion</span>
              </label>
            </div>
            <button 
              className="menu-button back" 
              onClick={() => setShowSettings(false)}
            >
              Back
            </button>
          </div>
        )}

        {showCredits && (
          <div className="sub-menu slide-in">
            <h2>Credits</h2>
            <div className="credits-content">
              <div className="credit-section">
                <h3>Development</h3>
                <p className="credit-name">Joseph Slade</p>
                <p className="credit-role">Lead Developer & Designer</p>
              </div>
              
              <div className="credit-section">
                <h3>Special Thanks</h3>
                <p>To all the players and supporters of Factory Bound</p>
              </div>
              
              <div className="credit-section">
                <p className="game-version">Version 0.1.0</p>
                <p className="copyright">© 2026 Factory Bound. All rights reserved.</p>
              </div>
            </div>
            <button 
              className="menu-button back" 
              onClick={() => setShowCredits(false)}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MainMenu
