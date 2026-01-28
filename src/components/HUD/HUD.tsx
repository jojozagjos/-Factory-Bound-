import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { buildermentProgression } from '../../data/buildermentProgression'
import { audioSystem } from '@/systems/AudioSystem/AudioSystem'
import './HUD.css'

interface HUDProps {
  onOpenNodeEditor: () => void
  onReturnToMenu: () => void
  onOpenBuildMenu: () => void
  onOpenTechTree: () => void
  onSave: () => void
  onLoad: () => void
  inTutorial?: boolean
}

const HUD = ({ onOpenNodeEditor, onReturnToMenu, onOpenBuildMenu, onOpenTechTree, onSave, onLoad, inTutorial = false }: HUDProps) => {
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const selectedMachine = useGameStore(state => state.selectedMachine)
  const isPaused = useGameStore(state => state.isPaused)
  const togglePause = useGameStore(state => state.togglePause)
  const showInventory = useGameStore(state => state.showInventory)
  const toggleInventory = useGameStore(state => state.toggleInventory)
  const gameTime = useGameStore(state => state.gameTime)
  const gameModeManager = useGameStore(state => state.gameModeManager)
  const session = useGameStore(state => state.session)
  const buildingMode = useGameStore(state => state.buildingMode)
  
  const [showPauseMenu, setShowPauseMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPlayerList, setShowPlayerList] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  // textScale removed — controlled via CSS/UX decisions; persisted settings handled elsewhere
  const [colorblindMode, setColorblindMode] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [audioLevels, setAudioLevels] = useState({ master: 80, music: 60, sfx: 80 })
  
  const isMultiplayer = session?.settings?.maxPlayers && session.settings.maxPlayers > 1
  
  // Check fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

 
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
  
  const toggleGridSetting = () => {
    setShowGrid(prev => {
      const next = !prev
      try { localStorage.setItem('showGrid', JSON.stringify(next)) } catch {}
      // Dispatch custom event for GameCanvas to listen
      window.dispatchEvent(new CustomEvent('toggleGrid', { detail: next }))
      return next
    })
  }
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle player list with P (only in multiplayer)
      if (e.key === 'p' && isMultiplayer) {
        e.preventDefault()
        setShowPlayerList(prev => !prev)
      }
      
      // Toggle pause menu with Escape
      if (e.key === 'Escape') {
        // If a build mode is active, ignore Escape here so build mode handler can cancel it
        if (buildingMode) return
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

  // Load settings from localStorage and listen for menu-originated updates
  useEffect(() => {
    try {
      const cb = localStorage.getItem('colorblindMode')
      if (cb != null) setColorblindMode(JSON.parse(cb))
    } catch {}

    try {
      const hc = localStorage.getItem('highContrast')
      if (hc != null) setHighContrast(JSON.parse(hc))
    } catch {}

    try {
      const audio = localStorage.getItem('audioLevels')
      if (audio) setAudioLevels(JSON.parse(audio))
    } catch {}

    try {
      const res = localStorage.getItem('resolution')
      if (res) {
        document.documentElement.style.setProperty('--game-resolution', res)
      }
    } catch {}

    try {
      const sg = localStorage.getItem('showGrid')
      if (sg != null) setShowGrid(JSON.parse(sg))
    } catch {}

    try {
      const rm = localStorage.getItem('reduceMotion')
      if (rm != null) setReduceMotion(JSON.parse(rm))
    } catch {}

    const handleSettingsUpdate = (e: Event) => {
      const custom = e as CustomEvent<Partial<Record<string, any>>>
      const data = custom.detail || {}
      if (data.colorblindMode != null) {
        setColorblindMode(!!data.colorblindMode)
        try { localStorage.setItem('colorblindMode', JSON.stringify(!!data.colorblindMode)) } catch {}
      }
      if (data.highContrast != null) {
        setHighContrast(!!data.highContrast)
        try { localStorage.setItem('highContrast', JSON.stringify(!!data.highContrast)) } catch {}
      }
      if (data.audioLevels) {
        setAudioLevels(data.audioLevels)
        try { localStorage.setItem('audioLevels', JSON.stringify(data.audioLevels)) } catch {}
        audioSystem.updateSettings({
          masterVolume: data.audioLevels.master / 100,
          musicVolume: data.audioLevels.music / 100,
          sfxVolume: data.audioLevels.sfx / 100,
        })
      }
      if (data.showGrid != null) {
        setShowGrid(!!data.showGrid)
        try { localStorage.setItem('showGrid', JSON.stringify(!!data.showGrid)) } catch {}
      }
      if (data.reduceMotion != null) {
        setReduceMotion(!!data.reduceMotion)
        try { localStorage.setItem('reduceMotion', JSON.stringify(!!data.reduceMotion)) } catch {}
      }
      if (data.fullscreen != null) {
        if (data.fullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
          setIsFullscreen(true)
        } else if (!data.fullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
          setIsFullscreen(false)
        }
      }
      if (data.resolution) {
        try { localStorage.setItem('resolution', String(data.resolution)) } catch {}
        document.documentElement.style.setProperty('--game-resolution', String(data.resolution))
      }
    }

    window.addEventListener('updateSettings', handleSettingsUpdate)
    const handleToggleGrid = (ev: Event) => {
      const c = ev as CustomEvent<boolean>
      try { setShowGrid(!!c.detail) } catch {}
    }
    window.addEventListener('toggleGrid', handleToggleGrid as EventListener)

    return () => {
      window.removeEventListener('updateSettings', handleSettingsUpdate)
      window.removeEventListener('toggleGrid', handleToggleGrid as EventListener)
    }
  }, [])

  const handleAudioChange = (type: 'master' | 'music' | 'sfx', value: number) => {
    setAudioLevels(prev => {
      const next = { ...prev, [type]: value }
      audioSystem.updateSettings({
        masterVolume: next.master / 100,
        musicVolume: next.music / 100,
        sfxVolume: next.sfx / 100,
      })
      try { localStorage.setItem('audioLevels', JSON.stringify(next)) } catch {}
      window.dispatchEvent(new CustomEvent('updateSettings', { detail: { audioLevels: next } }))
      return next
    })
  }

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
  
  const visibleInventory = (currentPlayer?.inventory || []).filter(i => i.quantity > 0)

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
    <div className={`hud ${colorblindMode ? 'colorblind' : ''} ${highContrast ? 'high-contrast' : ''}`}>
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
          <div className="stat cash">
            <span className="stat-label">Cash</span>
            <span className="stat-value cash-value">${session?.mode === 'coop' ? (useGameStore.getState().sharedCash || 0) : (currentPlayer?.cash ?? 0)}</span>
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
              title="Player List (P)"
            >
              👥
            </button>
          )}
          {!inTutorial && (
            <>
              {/* Hide save/load buttons for guest players */}
              {!currentPlayer?.isGuest && (
                <>
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
                </>
              )}
              <button 
                className={`control-btn ${isPaused ? 'active' : ''}`}
                onClick={handlePauseToggle}
                aria-label={isPaused ? 'Resume game' : 'Pause game'}
                title="Pause Menu (ESC)"
              >
                {isPaused ? '▶' : '⏸'}
              </button>
            </>
          )}
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
              <div style={{ marginTop: 8 }}>
                {/* Upgrade button: if a higher-tier machine exists for this base type */}
                {(() => {
                  const base = selectedMachine.type.replace(/_\d+$/, '')
                  const variants = buildermentProgression.machines
                    .filter(m => m.id.startsWith(base))
                    .sort((a, b) => (a.tier || 0) - (b.tier || 0))
                  const currentTier = variants.findIndex(v => v.id === selectedMachine.type)
                  const next = variants[currentTier + 1]
                  if (next) {
                    const store = useGameStore.getState()
                    const costVar = store.buildingSystem.getBuildingCost(next.id)
                    return (
                      <button
                        className="quick-btn"
                        onClick={() => {
                          const player = store.currentPlayer
                          if (!player) return alert('No player')
                          if (!costVar) return alert('No upgrade cost info')
                          // Check resources and cash (co-op uses shared cash)
                          const missing: string[] = []
                          ;(costVar.costs || []).forEach((it: any) => {
                            const have = player.inventory.find(i => i.name === (it.name || it.item))?.quantity || 0
                            const need = Number(it.quantity || it.qty || 0) || 0
                            if (have < need) missing.push(`${it.name || it.item} (${have}/${need})`)
                          })
                          const usingShared = store.session?.mode === 'coop'
                          const cashAvailable = usingShared ? (store.sharedCash || 0) : (player.cash || 0)
                          if (missing.length) return alert('Missing: ' + missing.join(', '))
                          if ((costVar.price || 0) > cashAvailable) return alert('Not enough cash')

                          // Perform atomic upgrade: remove old, attempt place new, rollback if fail
                          const oldMachine = { ...selectedMachine }
                          store.removeMachine(selectedMachine.id)
                          const placed = store.placeMachine(next.id as any, selectedMachine.position, selectedMachine.rotation)
                          if (!placed) {
                            // rollback
                            store.addMachine(oldMachine)
                            return alert('Upgrade failed: placement blocked')
                          }
                          alert(`Upgraded to ${next.display_name || next.id}`)
                        }}
                      >
                        Upgrade → {next.display_name || next.id}{costVar?.price ? ` ($${costVar.price})` : ''}
                      </button>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          </div>
        )}
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
          <div className="inventory-sections">
            <div className="inventory-section">
              <h3>Resources</h3>
              <div className="resource-list">
                {getResourceCount('iron_plate') > 0 && (
                  <div className="resource-item">
                    <span className="resource-icon">⚙</span>
                    <span className="resource-name">Iron Plate</span>
                    <span className="resource-amount">{getResourceCount('iron_plate')}</span>
                  </div>
                )}
                {getResourceCount('copper_plate') > 0 && (
                  <div className="resource-item">
                    <span className="resource-icon">🔩</span>
                    <span className="resource-name">Copper Plate</span>
                    <span className="resource-amount">{getResourceCount('copper_plate')}</span>
                  </div>
                )}
                {getResourceCount('electronic_circuit') > 0 && (
                  <div className="resource-item">
                    <span className="resource-icon">⚡</span>
                    <span className="resource-name">Circuits</span>
                    <span className="resource-amount">{getResourceCount('electronic_circuit')}</span>
                  </div>
                )}
                {getResourceCount('iron_gear') > 0 && (
                  <div className="resource-item">
                    <span className="resource-icon">⚙</span>
                    <span className="resource-name">Iron Gear</span>
                    <span className="resource-amount">{getResourceCount('iron_gear')}</span>
                  </div>
                )}
                {getResourceCount('stone') > 0 && (
                  <div className="resource-item">
                    <span className="resource-icon">🪨</span>
                    <span className="resource-name">Stone</span>
                    <span className="resource-amount">{getResourceCount('stone')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="inventory-section">
              <h3>All Items</h3>
              <div className="inventory-grid">
                {visibleInventory.length > 0 ? (
                  visibleInventory.map((item, index) => (
                    <div key={index} className="inventory-item">
                      <div className="item-icon">{item.icon || '📦'}</div>
                      <div className="item-name">{item.name}</div>
                      <div className="item-quantity">{item.quantity}</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-inventory">Inventory is empty</p>
                )}
              </div>
            </div>
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
                
                {/* Hide save button for guest players */}
                {!currentPlayer?.isGuest && (
                  <button 
                    className="menu-btn" 
                    onClick={onSave}
                  >
                    Save Game
                  </button>
                )}
                
                {currentPlayer?.isGuest && (
                  <div className="guest-notice">
                    ⚠️ Guest players cannot save games
                  </div>
                )}
                
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
                  <h3>Display</h3>
                  <label>
                    <span>Fullscreen</span>
                    <input 
                      type="checkbox" 
                      checked={isFullscreen}
                      onChange={toggleFullscreen}
                    />
                  </label>
                  <label>
                    <span>Show Grid</span>
                    <input 
                      type="checkbox" 
                      checked={showGrid}
                      onChange={toggleGridSetting}
                    />
                  </label>
                  {/* Text Scale removed — controlled via CSS/UX decisions */}
                  <label>
                    <span>Colorblind Mode</span>
                    <input
                      type="checkbox"
                      checked={colorblindMode}
                      onChange={(e) => {
                        const val = e.currentTarget.checked
                        setColorblindMode(val)
                        try { localStorage.setItem('colorblindMode', JSON.stringify(val)) } catch {}
                        window.dispatchEvent(new CustomEvent('updateSettings', { detail: { colorblindMode: val } }))
                      }}
                    />
                  </label>
                  <label>
                    <span>High Contrast</span>
                    <input
                      type="checkbox"
                      checked={highContrast}
                      onChange={(e) => setHighContrast(e.target.checked)}
                    />
                  </label>
                  <label>
                    <span>Reduce Motion</span>
                    <input
                      type="checkbox"
                      checked={reduceMotion}
                      onChange={(e) => {
                        const val = e.currentTarget.checked
                        setReduceMotion(val)
                        try { localStorage.setItem('reduceMotion', JSON.stringify(val)) } catch {}
                        window.dispatchEvent(new CustomEvent('updateSettings', { detail: { reduceMotion: val } }))
                      }}
                    />
                  </label>
                </div>
                <div className="settings-section">
                  <h3>Graphics</h3>
                  <label>
                    <span>Quality</span>
                    <select defaultValue="high">
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
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioLevels.master}
                      onChange={(e) => handleAudioChange('master', parseInt(e.target.value))}
                    />
                  </label>
                  <label>
                    <span>Music Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioLevels.music}
                      onChange={(e) => handleAudioChange('music', parseInt(e.target.value))}
                    />
                  </label>
                  <label>
                    <span>SFX Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioLevels.sfx}
                      onChange={(e) => handleAudioChange('sfx', parseInt(e.target.value))}
                    />
                  </label>
                </div>
                <p className="settings-note">Display and audio settings apply instantly; more options coming soon.</p>
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
