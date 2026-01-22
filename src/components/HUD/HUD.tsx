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

  return (
    <div className="hud">
      {/* Top Bar */}
      <div className="hud-top">
        <div className="player-stats">
          <div className="stat">
            <span className="stat-label">Level</span>
            <span className="stat-value">{currentPlayer?.stats.level ?? 1}</span>
          </div>
          <div className="stat">
            <span className="stat-label">XP</span>
            <span className="stat-value">{currentPlayer?.stats.experience ?? 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Prestige</span>
            <span className="stat-value prestige">{currentPlayer?.stats.prestigeLevel ?? 0}</span>
          </div>
        </div>

        <div className="game-controls">
          <button 
            className={`control-btn ${isPaused ? 'active' : ''}`}
            onClick={togglePause}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
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
            className="control-btn"
            onClick={onReturnToMenu}
            aria-label="Return to menu"
          >
            ⚙
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
            <span className="resource-name">Iron</span>
            <span className="resource-amount">0</span>
          </div>
          <div className="resource">
            <span className="resource-icon">🔩</span>
            <span className="resource-name">Copper</span>
            <span className="resource-amount">0</span>
          </div>
          <div className="resource">
            <span className="resource-icon">⚡</span>
            <span className="resource-name">Power</span>
            <span className="resource-amount">100 MW</span>
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

      {/* Pause Overlay */}
      {isPaused && (
        <div className="pause-overlay">
          <h1>PAUSED</h1>
          <p>Press ESC or click ▶ to resume</p>
        </div>
      )}
    </div>
  )
}

export default HUD
