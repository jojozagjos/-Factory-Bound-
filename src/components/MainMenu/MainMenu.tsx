import { useState } from 'react'
import './MainMenu.css'

interface MainMenuProps {
  onStartGame: () => void
}

const MainMenu = ({ onStartGame }: MainMenuProps) => {
  const [showSinglePlayer, setShowSinglePlayer] = useState(false)
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="main-menu">
      <div className="menu-background" />
      <div className="menu-content">
        <h1 className="game-title">Factory Bound</h1>
        <p className="game-subtitle">Automation • Strategy • Programming</p>

        {!showSinglePlayer && !showMultiplayer && !showSettings && (
          <div className="menu-buttons">
            <button 
              className="menu-button primary"
              onClick={() => setShowSinglePlayer(true)}
              aria-label="Start Single Player"
            >
              Single Player
            </button>
            <button 
              className="menu-button primary"
              onClick={() => setShowMultiplayer(true)}
              aria-label="Start Multiplayer"
            >
              Multiplayer
            </button>
            <button 
              className="menu-button"
              onClick={() => setShowSettings(true)}
              aria-label="Open Settings"
            >
              Settings
            </button>
            <button className="menu-button" aria-label="View Credits">
              Credits
            </button>
          </div>
        )}

        {showSinglePlayer && (
          <div className="sub-menu">
            <h2>Single Player</h2>
            <button className="menu-button primary" onClick={onStartGame}>
              New Game
            </button>
            <button className="menu-button">Load Game</button>
            <button className="menu-button">Tutorial</button>
            <button 
              className="menu-button back" 
              onClick={() => setShowSinglePlayer(false)}
            >
              Back
            </button>
          </div>
        )}

        {showMultiplayer && (
          <div className="sub-menu">
            <h2>Multiplayer</h2>
            <button className="menu-button primary">Host Co-op Game</button>
            <button className="menu-button">Join Co-op Game</button>
            <button className="menu-button">Ranked PvP</button>
            <button className="menu-button">Custom PvP</button>
            <button 
              className="menu-button back" 
              onClick={() => setShowMultiplayer(false)}
            >
              Back
            </button>
          </div>
        )}

        {showSettings && (
          <div className="sub-menu">
            <h2>Settings</h2>
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
      </div>
    </div>
  )
}

export default MainMenu
