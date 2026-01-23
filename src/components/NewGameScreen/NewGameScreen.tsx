import { useState, useEffect, useRef } from 'react'
import { ProceduralGenerator } from '../../engine/procedural/MapGenerator'
import { GameMode } from '../../types/game'
import './NewGameScreen.css'

interface NewGameScreenProps {
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
  onCancel: () => void
}

const NewGameScreen = ({ onStartGame, onCancel }: NewGameScreenProps) => {
  const [worldName, setWorldName] = useState('My Factory World')
  const [seed, setSeed] = useState(Date.now().toString())
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CUSTOM)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // New Builderment-style game settings
  const [enemiesEnabled, setEnemiesEnabled] = useState(false)
  const [enemyFactoriesEnabled, setEnemyFactoriesEnabled] = useState(false)
  const [oceanEnemiesEnabled, setOceanEnemiesEnabled] = useState(false)
  const [maxEnemyBases, setMaxEnemyBases] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'nightmare'>('normal')

  const gameModes = [
    { mode: GameMode.PRODUCTION, name: 'Production', description: 'Focus on building and optimization', icon: '🏭' },
    { mode: GameMode.SURVIVAL, name: 'Survival', description: 'Gather resources, defend against waves', icon: '⚔️' },
    { mode: GameMode.EXPLORATION, name: 'Exploration', description: 'Discover and expand your factory', icon: '🗺️' },
    { mode: GameMode.CUSTOM, name: 'Custom', description: 'Build and automate at your own pace', icon: '⚙️' },
  ]

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000000).toString()
    setSeed(randomSeed)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const previewSize = 30
    const tileSize = canvas.width / previewSize

    // Debounce preview generation
    const timeoutId = setTimeout(() => {
      try {
        const seedNumber = parseInt(seed) || Date.now()
        const generator = new ProceduralGenerator(seedNumber)
        const map = generator.generateMap(previewSize, previewSize, [])

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let y = 0; y < previewSize; y++) {
          for (let x = 0; x < previewSize; x++) {
            const tile = map.tiles.get(`${x},${y}`)
            if (!tile) continue

            let color = '#1a1a1a'
            switch (tile.type) {
              case 'water':
                color = '#2563eb'
                break
              case 'grass':
                color = '#16a34a'
                break
              case 'stone':
                color = '#71717a'
              break
            case 'sand':
              color = '#eab308'
              break
          }

          ctx.fillStyle = color
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)

          // Draw resource
          if (tile.resource) {
            ctx.fillStyle = tile.resource.type === 'iron_ore' ? '#a1a1aa' : '#f97316'
            ctx.beginPath()
            ctx.arc(
              x * tileSize + tileSize / 2,
              y * tileSize + tileSize / 2,
              tileSize / 4,
              0,
              Math.PI * 2
            )
            ctx.fill()
          }
        }
      }
      } catch (error) {
        console.error('Error generating preview:', error)
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Preview unavailable', canvas.width / 2, canvas.height / 2)
      }
    }, 300) // Debounce delay: 300ms

    return () => clearTimeout(timeoutId)
  }, [seed])

  const handleStart = () => {
    const seedNumber = parseInt(seed) || Date.now()
    onStartGame({
      worldName,
      seed: seedNumber,
      gameMode: selectedMode,
      enemiesEnabled,
      enemyFactoriesEnabled,
      oceanEnemiesEnabled,
      maxEnemyBases,
      difficulty,
    })
  }

  return (
    <div className="new-game-screen-overlay" onClick={onCancel}>
      <div className="new-game-screen" onClick={(e) => e.stopPropagation()}>
        <div className="new-game-header">
          <h1>🎮 New Game</h1>
          <button className="new-game-close-btn" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="new-game-content">
          {/* World Settings */}
          <div className="new-game-section">
            <h2>World Settings</h2>
            <div className="form-group">
              <label htmlFor="world-name">World Name</label>
              <input
                id="world-name"
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="Enter world name..."
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label htmlFor="seed">World Seed</label>
              <div className="seed-input-group">
                <input
                  id="seed"
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Enter seed..."
                />
                <button className="random-seed-btn" onClick={generateRandomSeed}>
                  🎲 Random
                </button>
              </div>
              <p className="help-text">Use the same seed to generate identical worlds</p>
            </div>
          </div>

          {/* World Preview */}
          <div className="new-game-section">
            <h2>World Preview</h2>
            <div className="preview-container">
              <canvas ref={canvasRef} width={300} height={300} className="world-preview-canvas" />
              <div className="preview-legend">
                <div className="legend-item">
                  <span className="legend-color water"></span>
                  <span>Water</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color grass"></span>
                  <span>Grass</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color stone"></span>
                  <span>Stone</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color sand"></span>
                  <span>Sand</span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="new-game-section">
            <h2>Game Mode</h2>
            <div className="game-mode-grid">
              {gameModes.map((mode) => (
                <button
                  key={mode.mode}
                  className={`game-mode-card ${selectedMode === mode.mode ? 'selected' : ''}`}
                  onClick={() => setSelectedMode(mode.mode)}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-description">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Enemy Settings */}
          <div className="new-game-section">
            <h2>⚔️ Enemy Settings</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enemiesEnabled}
                    onChange={(e) => setEnemiesEnabled(e.target.checked)}
                  />
                  <span>Enable Enemies</span>
                </label>
                <p className="setting-description">Enemies will spawn and attack your base</p>
              </div>

              {enemiesEnabled && (
                <>
                  <div className="setting-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={enemyFactoriesEnabled}
                        onChange={(e) => setEnemyFactoriesEnabled(e.target.checked)}
                      />
                      <span>Enemy Factories</span>
                    </label>
                    <p className="setting-description">Enemy bases will spawn and produce enemies</p>
                  </div>

                  <div className="setting-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={oceanEnemiesEnabled}
                        onChange={(e) => setOceanEnemiesEnabled(e.target.checked)}
                      />
                      <span>Ocean Enemies</span>
                    </label>
                    <p className="setting-description">Enemies can spawn from the ocean</p>
                  </div>

                  {enemyFactoriesEnabled && (
                    <div className="setting-item">
                      <label htmlFor="max-enemy-bases">Max Enemy Bases</label>
                      <input
                        id="max-enemy-bases"
                        type="number"
                        min="1"
                        max="20"
                        value={maxEnemyBases}
                        onChange={(e) => setMaxEnemyBases(parseInt(e.target.value) || 5)}
                      />
                      <p className="setting-description">Maximum number of enemy factories that can exist</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Difficulty Settings */}
          <div className="new-game-section">
            <h2>⚙️ Difficulty</h2>
            <div className="difficulty-buttons">
              {(['easy', 'normal', 'hard', 'nightmare'] as const).map((level) => (
                <button
                  key={level}
                  className={`difficulty-btn ${difficulty === level ? 'selected' : ''}`}
                  onClick={() => setDifficulty(level)}
                >
                  <div className="difficulty-name">{level.charAt(0).toUpperCase() + level.slice(1)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="new-game-footer">
          <button className="new-game-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="new-game-btn primary" onClick={handleStart} disabled={!worldName.trim()}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewGameScreen
