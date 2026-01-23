import { useState } from 'react'
import { useKeybindStore } from '../../store/keybindStore'
import './KeybindSettings.css'

interface KeybindSettingsProps {
  onClose: () => void
}

const KeybindSettings = ({ onClose }: KeybindSettingsProps) => {
  const keybinds = useKeybindStore(state => state.keybinds)
  const setKeybind = useKeybindStore(state => state.setKeybind)
  const resetToDefaults = useKeybindStore(state => state.resetToDefaults)
  const checkConflict = useKeybindStore(state => state.checkConflict)
  
  const [rebindingAction, setRebindingAction] = useState<string | null>(null)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!rebindingAction) return

    e.preventDefault()
    const key = e.key

    // Check for conflicts
    const conflict = checkConflict(key, rebindingAction)
    if (conflict) {
      const conflictKeybind = keybinds.find(kb => kb.action === conflict)
      setConflictMessage(
        `"${key}" is already bound to "${conflictKeybind?.description || conflict}"`
      )
      setTimeout(() => setConflictMessage(null), 3000)
      setRebindingAction(null)
      return
    }

    // Set the new keybind
    const success = setKeybind(rebindingAction, key)
    if (success) {
      setRebindingAction(null)
      setConflictMessage(null)
    }
  }

  const startRebinding = (action: string) => {
    setRebindingAction(action)
    setConflictMessage(null)

    // Add temporary event listener
    const handleKey = (e: KeyboardEvent) => {
      handleKeyPress(e)
      document.removeEventListener('keydown', handleKey)
    }
    document.addEventListener('keydown', handleKey)
  }

  const cancelRebinding = () => {
    setRebindingAction(null)
    setConflictMessage(null)
  }

  const handleResetDefaults = () => {
    if (confirm('Reset all keybinds to defaults?')) {
      resetToDefaults()
      setRebindingAction(null)
      setConflictMessage(null)
    }
  }

  // Group keybinds by category
  const categories = Array.from(new Set(keybinds.map(kb => kb.category)))

  return (
    <div className="keybind-settings-overlay" onClick={onClose}>
      <div className="keybind-settings" onClick={(e) => e.stopPropagation()}>
        <div className="keybind-header">
          <h1>⌨️ Keybind Settings</h1>
          <button className="keybind-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="keybind-content">
          {conflictMessage && (
            <div className="conflict-message">
              ⚠️ {conflictMessage}
            </div>
          )}

          {rebindingAction && (
            <div className="rebinding-prompt">
              <div className="rebinding-text">
                Press any key to rebind...
              </div>
              <button className="cancel-rebind-btn" onClick={cancelRebinding}>
                Cancel
              </button>
            </div>
          )}

          {categories.map(category => (
            <div key={category} className="keybind-category">
              <h2>{category}</h2>
              <div className="keybind-list">
                {keybinds
                  .filter(kb => kb.category === category)
                  .map(keybind => (
                    <div key={keybind.action} className="keybind-item">
                      <div className="keybind-description">
                        {keybind.description}
                      </div>
                      <button
                        className={`keybind-button ${
                          rebindingAction === keybind.action ? 'rebinding' : ''
                        }`}
                        onClick={() => startRebinding(keybind.action)}
                        disabled={rebindingAction !== null && rebindingAction !== keybind.action}
                      >
                        {rebindingAction === keybind.action ? (
                          <span className="waiting">...</span>
                        ) : (
                          <kbd className="key-display">{keybind.key}</kbd>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="keybind-footer">
          <button className="keybind-btn secondary" onClick={handleResetDefaults}>
            Reset to Defaults
          </button>
          <button className="keybind-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default KeybindSettings
