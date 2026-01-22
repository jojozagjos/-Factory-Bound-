import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { SaveSlot, SaveMetadata } from '../../types/game'
import './SaveManager.css'

interface SaveManagerProps {
  onClose: () => void
  mode: 'save' | 'load'
}

const SaveManager = ({ onClose, mode }: SaveManagerProps) => {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([])
  const [saveName, setSaveName] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const saveGame = useGameStore(state => state.saveGame)
  const loadGame = useGameStore(state => state.loadGame)

  // Load existing saves from localStorage
  useEffect(() => {
    loadSaveSlots()
  }, [])

  const loadSaveSlots = () => {
    const slots: SaveSlot[] = []
    for (let i = 0; i < 5; i++) {
      const slotKey = `factory_bound_save_${i}`
      const savedData = localStorage.getItem(slotKey)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          slots.push({
            metadata: parsed.metadata,
            data: parsed.data,
          })
        } catch (e) {
          console.error(`Failed to parse save slot ${i}:`, e)
        }
      } else {
        // Empty slot
        slots.push({
          metadata: {
            id: slotKey,
            name: `Empty Slot ${i + 1}`,
            timestamp: 0,
            playtime: 0,
            level: 0,
            version: '1.0.0',
          },
          data: {
            version: '1.0.0',
            timestamp: 0,
            sessionId: '',
            world: {
              seed: 0,
              width: 0,
              height: 0,
              tiles: new Map(),
              modifiers: [],
            },
            players: [],
            machines: [],
            techTree: [],
            gameSettings: {
              maxPlayers: 1,
              difficulty: 'normal',
              pvpEnabled: false,
              friendlyFire: false,
              worldSeed: 0,
              modifiers: [],
            },
          },
        })
      }
    }
    setSaveSlots(slots)
  }

  const handleSave = (slotIndex: number) => {
    const saveData = saveGame()
    const slotKey = `factory_bound_save_${slotIndex}`
    
    const metadata: SaveMetadata = {
      id: slotKey,
      name: saveName || `Save ${slotIndex + 1}`,
      timestamp: Date.now(),
      playtime: 0, // TODO: Get actual playtime from game state
      level: 1, // TODO: Get actual level from player
      version: '1.0.0',
    }

    const slot: SaveSlot = {
      metadata,
      data: saveData,
    }

    localStorage.setItem(slotKey, JSON.stringify(slot))
    loadSaveSlots()
    setSaveName('')
  }

  const handleLoad = (slotIndex: number) => {
    const slotKey = `factory_bound_save_${slotIndex}`
    const savedData = localStorage.getItem(slotKey)
    
    if (savedData) {
      try {
        const parsed: SaveSlot = JSON.parse(savedData)
        loadGame(parsed.data)
        onClose()
      } catch (e) {
        console.error('Failed to load save:', e)
        alert('Failed to load save file')
      }
    }
  }

  const handleDelete = (slotIndex: number) => {
    if (confirm('Are you sure you want to delete this save?')) {
      const slotKey = `factory_bound_save_${slotIndex}`
      localStorage.removeItem(slotKey)
      loadSaveSlots()
    }
  }

  const handleExport = (slotIndex: number) => {
    const slotKey = `factory_bound_save_${slotIndex}`
    const savedData = localStorage.getItem(slotKey)
    
    if (savedData) {
      const blob = new Blob([savedData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factory_bound_save_${slotIndex}_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        JSON.parse(content) // Validate JSON
        
        // Find first empty slot or ask user
        let targetSlot = 0
        for (let i = 0; i < saveSlots.length; i++) {
          if (saveSlots[i].metadata.timestamp === 0) {
            targetSlot = i
            break
          }
        }
        
        const slotKey = `factory_bound_save_${targetSlot}`
        localStorage.setItem(slotKey, content)
        loadSaveSlots()
      } catch (e) {
        console.error('Failed to import save:', e)
        alert('Failed to import save file')
      }
    }
    reader.readAsText(file)
  }

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Empty'
    return new Date(timestamp).toLocaleString()
  }

  const formatPlaytime = (playtime: number) => {
    const hours = Math.floor(playtime / 3600)
    const minutes = Math.floor((playtime % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="save-manager-overlay" onClick={onClose}>
      <div className="save-manager" onClick={(e) => e.stopPropagation()}>
        <div className="save-manager-header">
          <h2>{mode === 'save' ? '💾 Save Game' : '📁 Load Game'}</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close save manager"
          >
            ✕
          </button>
        </div>

        <div className="save-manager-content">
          {mode === 'save' && (
            <div className="save-name-input">
              <input
                type="text"
                placeholder="Enter save name (optional)"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          <div className="save-slots">
            {saveSlots.map((slot, index) => {
              const isEmpty = slot.metadata.timestamp === 0

              return (
                <div
                  key={index}
                  className={`save-slot ${isEmpty ? 'empty' : ''} ${selectedSlot === slot.metadata.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot.metadata.id)}
                >
                  <div className="save-slot-header">
                    <h3>Slot {index + 1}</h3>
                    {!isEmpty && (
                      <div className="save-slot-actions">
                        <button
                          className="action-btn export"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExport(index)
                          }}
                          title="Export save"
                        >
                          📤
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(index)
                          }}
                          title="Delete save"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="save-slot-info">
                    {isEmpty ? (
                      <div className="empty-slot-label">Empty Slot</div>
                    ) : (
                      <>
                        <div className="save-info-row">
                          <span className="info-label">Name:</span>
                          <span className="info-value">{slot.metadata.name}</span>
                        </div>
                        <div className="save-info-row">
                          <span className="info-label">Date:</span>
                          <span className="info-value">{formatDate(slot.metadata.timestamp)}</span>
                        </div>
                        <div className="save-info-row">
                          <span className="info-label">Level:</span>
                          <span className="info-value">{slot.metadata.level}</span>
                        </div>
                        <div className="save-info-row">
                          <span className="info-label">Playtime:</span>
                          <span className="info-value">{formatPlaytime(slot.metadata.playtime)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="save-slot-button">
                    {mode === 'save' ? (
                      <button
                        className="primary-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSave(index)
                        }}
                      >
                        {isEmpty ? 'Save Here' : 'Overwrite'}
                      </button>
                    ) : (
                      <button
                        className="primary-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLoad(index)
                        }}
                        disabled={isEmpty}
                      >
                        Load
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="save-manager-footer">
          <div className="import-section">
            <label className="import-btn">
              📥 Import Save
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="save-manager-hint">
            💡 {mode === 'save' ? 'Select a slot to save your progress' : 'Select a save to load'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaveManager
