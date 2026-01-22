import { useState } from 'react'
import { GameMode } from '../../types/game'
import './GameModeSelect.css'

interface GameModeSelectProps {
  onSelectMode: (mode: GameMode) => void
  onCancel: () => void
}

const GameModeSelect = ({ onSelectMode, onCancel }: GameModeSelectProps) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.SURVIVAL)

  const gameModes = [
    {
      mode: GameMode.SURVIVAL,
      name: 'Survival',
      description: 'Survive waves of enemies while building your factory',
      objective: 'Survive for 30 minutes',
      difficulty: 'Medium',
      icon: '🛡️',
    },
    {
      mode: GameMode.PRODUCTION,
      name: 'Production',
      description: 'Focus on optimization and production goals',
      objective: 'Produce 1000 electronic circuits',
      difficulty: 'Easy',
      icon: '🏭',
    },
    {
      mode: GameMode.EXPLORATION,
      name: 'Exploration',
      description: 'Research all technologies and explore the world',
      objective: 'Research all tier 5 technologies',
      difficulty: 'Medium',
      icon: '🔬',
    },
    {
      mode: GameMode.CUSTOM,
      name: 'Custom',
      description: 'Play without specific objectives',
      objective: 'None - play at your own pace',
      difficulty: 'Variable',
      icon: '⚙️',
    },
  ]

  return (
    <div className="game-mode-select">
      <div className="mode-select-container">
        <div className="mode-select-header">
          <h2>Select Game Mode</h2>
          <p>Choose your gameplay style and objective</p>
        </div>

        <div className="mode-grid">
          {gameModes.map((mode) => (
            <div
              key={mode.mode}
              className={`mode-card ${selectedMode === mode.mode ? 'selected' : ''}`}
              onClick={() => setSelectedMode(mode.mode)}
            >
              <div className="mode-icon">{mode.icon}</div>
              <h3>{mode.name}</h3>
              <p className="mode-description">{mode.description}</p>
              <div className="mode-details">
                <div className="mode-detail">
                  <span className="detail-label">Objective:</span>
                  <span className="detail-value">{mode.objective}</span>
                </div>
                <div className="mode-detail">
                  <span className="detail-label">Difficulty:</span>
                  <span className="detail-value">{mode.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mode-select-actions">
          <button
            className="mode-button primary"
            onClick={() => onSelectMode(selectedMode)}
          >
            Start Game
          </button>
          <button className="mode-button" onClick={onCancel}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameModeSelect
