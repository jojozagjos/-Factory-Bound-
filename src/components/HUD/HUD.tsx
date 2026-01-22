import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import './HUD.css'

interface HUDProps {
  onOpenNodeEditor: () => void
  onReturnToMenu: () => void
  onOpenBuildMenu: () => void
  onOpenTechTree: () => void
  onSave: () => void
  onLoad: () => void
}

const HUD = ({ onOpenNodeEditor, onReturnToMenu, onOpenBuildMenu, onOpenTechTree, onSave, onLoad }: HUDProps) => {
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const selectedMachine = useGameStore(state => state.selectedMachine)
  const isPaused = useGameStore(state => state.isPaused)
  const togglePause = useGameStore(state => state.togglePause)
  const showInventory = useGameStore(state => state.showInventory)
  const toggleInventory = useGameStore(state => state.toggleInventory)
  const gameTime = useGameStore(state => state.gameTime)
  const gameModeManager = useGameStore(state => state.gameModeManager)
  const session = useGameStore(state => state.session)
  
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPlayerList, setShowPlayerList] = useState(false)
  
  const isMultiplayer = session?.settings?.maxPlayers && session.settings.maxPlayers > 1
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle player list with Tab (only in multiplayer)
      if (e.key === 'Tab' && isMultiplayer) {
        e.preventDefault()
        setShowPlayerList(prev => !prev)
      }
      
      // Toggle pause menu with Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        if (showPauseMenu) {
          if (isPaused) {
            togglePause()
          }
          setShowPauseMenu(false)
          setShowSettings(false)
        } else {
          if (!isPaused) {
            togglePause()
            setShowPauseMenu(true)
          } else {
            togglePause()
            setShowPauseMenu(false)
            setShowSettings(false)
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMultiplayer, showPauseMenu, isPaused, togglePause])
  
  // Format game time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Get resource counts from inventory
  const getResourceCount = (resourceName: string) => {
    const item = currentPlayer?.inventory.find(i => i.name === resourceName)
    return item?.quantity || 0
  }
  
  const handlePauseToggle = () => {
    if (!isPaused) {
      togglePause()
      setShowPauseMenu(true)
    } else {
      togglePause()
      setShowPauseMenu(false)
      setShowSettings(false)
    }
  }
  
  const handleReturnToMenu = () => {
    setShowPauseMenu(false)
    setShowSettings(false)
    onReturnToMenu()
  }
  
  const handleResume = () => {
    if (isPaused) {
      togglePause()
    }
    setShowPauseMenu(false)
    setShowSettings(false)
  }

  return (
    <div className="hud">
      {/* Top Bar */}
      <div className="hud-top">
        <div className="player-stats">
          <div className="stat">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(gameTime)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Level</span>
            <span className="stat-value">{currentPlayer?.stats.level ?? 1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">XP</span>
            <span className="stat-value">{currentPlayer?.stats.experience ?? 0}</span>
          </div>
          {gameModeManager && (
            <div className="stat">
              <span className="stat-label">Progress</span>
              <span className="stat-value">{Math.floor(gameModeManager.getVictoryProgress())}%</span>
            </div>
          )}
        </div>

        <div className="game-controls">
          {isMultiplayer && (
            <button 
              className={`control-btn ${showPlayerList ? 'active' : ''}`}
              onClick={() => setShowPlayerList(!showPlayerList)}
              aria-label="Toggle player list"
              title="Player List (Tab)"
            >
              👥
            </button>
          )}
          <button 
            className="control-btn"
            onClick={onSave}
            aria-label="Save game"
            title="Save game"
          >
            💾
          </button>
          <button 
            className="control-btn"
            onClick={onLoad}
            aria-label="Load game"
            title="Load game"
          >
            📁
          </button>
          <button 
            className={`control-btn ${isPaused ? 'active' : ''}`}
            onClick={handlePauseToggle}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            title="Pause Menu (ESC)"
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="hud-quick-actions">
        <button 
          className="quick-btn"
          onClick={toggleInventory}
          aria-label="Toggle inventory"
        >
          📦 Inventory
        </button>
        <button 
          className="quick-btn"
          onClick={onOpenNodeEditor}
          aria-label="Open node editor"
        >
          🔌 Node Editor
        </button>
        <button 
          className="quick-btn" 
          onClick={onOpenTechTree}
          aria-label="Open tech tree"
        >
          🔬 Tech Tree
        </button>
        <button 
          className="quick-btn" 
          onClick={onOpenBuildMenu}
          aria-label="Open build menu"
        >
          🏭 Build
        </button>
      </div>

      {/* Bottom Info Bar */}
      <div className="hud-bottom">
        {selectedMachine && (
          <div className="machine-info">
            <h3>{selectedMachine.type.toUpperCase()}</h3>
            <div className="machine-stats">
              <div className="stat-row">
                <span>Health:</span>
                <div className="health-bar">
                  <div 
                    className="health-fill"
                    style={{ width: `${(selectedMachine.health / selectedMachine.maxHealth) * 100}%` }}
                  />
                </div>
                <span>{selectedMachine.health}/{selectedMachine.maxHealth}</span>
              </div>
              <div className="stat-row">
                <span>Power:</span>
                <span className={selectedMachine.power.connected ? 'powered' : 'no-power'}>
                  {selectedMachine.power.connected 
                    ? `${selectedMachine.power.available}/${selectedMachine.power.required} W`
                    : 'Not Connected'
                  }
                </span>
              </div>
              {selectedMachine.inventory.length > 0 && (
                <div className="stat-row">
                  <span>Inventory:</span>
                  <span>{selectedMachine.inventory.length} items</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="resource-display">
          <div className="resource">
            <span className="resource-icon">⚙</span>
            <span className="resource-name">Iron Plate</span>
            <span className="resource-amount">{getResourceCount('iron_plate')}</span>
          </div>
          <div className="resource">
            <span className="resource-icon">🔩</span>
            <span className="resource-name">Copper</span>
            <span className="resource-amount">{getResourceCount('copper_plate')}</span>
          </div>
          <div className="resource">
            <span className="resource-icon">⚡</span>
            <span className="resource-name">Circuits</span>
            <span className="resource-amount">{getResourceCount('electronic_circuit')}</span>
          </div>
        </div>
      </div>

      {/* Inventory Panel */}
      {showInventory && (
        <div className="inventory-panel">
          <div className="panel-header">
            <h2>Inventory</h2>
            <button 
              className="close-btn"
              onClick={toggleInventory}
              aria-label="Close inventory"
            >
              ✕
            </button>
          </div>
          <div className="inventory-grid">
            {currentPlayer?.inventory.map((item, index) => (
              <div key={index} className="inventory-item">
                <div className="item-icon">{item.icon || '📦'}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-quantity">{item.quantity}</div>
              </div>
            )) ?? <p className="empty-inventory">Inventory is empty</p>}
          </div>
        </div>
      )}

      {/* Player List (Multiplayer Only) */}
      {isMultiplayer && showPlayerList && (
        <div className="player-list-panel">
          <div className="panel-header">
            <h2>Players</h2>
            <button 
              className="close-btn"
              onClick={() => setShowPlayerList(false)}
              aria-label="Close player list"
            >
              ✕
            </button>
          </div>
          <div className="player-list-content">
            {session?.players && session.players.length > 0 ? (
              session.players.map((player) => (
                <div key={player.id} className="player-list-item">
                  <div className="player-info">
                    <span className="player-name">{player.username}</span>
                    <span className="player-level">Level {player.stats.level}</span>
                  </div>
                  <div className="player-health">
                    <div className="health-bar-small">
                      <div 
                        className="health-fill"
                        style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                      />
                    </div>
                    <span className="health-text">{player.health}/{player.maxHealth}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-players">No other players</p>
            )}
          </div>
        </div>
      )}

      {/* Pause Menu */}
      {showPauseMenu && isPaused && (
        <div className="pause-menu-overlay">
          <div className="pause-menu">
            <h1>PAUSED</h1>
            {!showSettings ? (
              <div className="pause-menu-buttons">
                <button 
                  className="menu-btn primary" 
                  onClick={handleResume}
                >
                  Resume Game
                </button>
                <button 
                  className="menu-btn" 
                  onClick={() => setShowSettings(true)}
                >
                  Settings
                </button>
                <button 
                  className="menu-btn" 
                  onClick={onSave}
                >
                  Save Game
                </button>
                <button 
                  className="menu-btn danger" 
                  onClick={handleReturnToMenu}
                >
                  Return to Menu
                </button>
              </div>
            ) : (
              <div className="pause-menu-settings">
                <h2>Settings</h2>
                <div className="settings-section">
                  <h3>Graphics</h3>
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
                <button 
                  className="menu-btn" 
                  onClick={() => setShowSettings(false)}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simple Pause Overlay (when pause menu is not shown) */}
      {isPaused && !showPauseMenu && (
        <div className="pause-overlay">
          <h1>PAUSED</h1>
          <p>Press ESC or click ⏸ to resume</p>
        </div>
      )}
    </div>
  )
}

export default HUD
