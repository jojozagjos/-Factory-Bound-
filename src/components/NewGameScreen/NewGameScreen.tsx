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
  // No starting base chosen from the menu: player must place base in-game
  
  // New Builderment-style game settings
  const [enemiesEnabled, setEnemiesEnabled] = useState(false)
  const [enemyFactoriesEnabled, setEnemyFactoriesEnabled] = useState(false)
  const [oceanEnemiesEnabled, setOceanEnemiesEnabled] = useState(false)
  const [maxEnemyBases, setMaxEnemyBases] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'nightmare'>('normal')

  const gameModes = [
    { mode: GameMode.PRODUCTION, name: 'Production', description: 'Focus on building and optimization', objective: 'Produce 1,000 electronic circuits', icon: '🏭' },
    { mode: GameMode.SURVIVAL, name: 'Survival', description: 'Gather resources, defend against waves', objective: 'Survive for 30 minutes or defeat 10 waves', icon: '⚔️' },
    { mode: GameMode.EXPLORATION, name: 'Exploration', description: 'Discover and expand your factory', objective: 'Research all tier 5 technologies', icon: '🗺️' },
    { mode: GameMode.CUSTOM, name: 'Custom', description: 'Build and automate at your own pace', objective: 'No specific objective — play freely', icon: '⚙️' },
  ]

  // Draw the preview into the canvas; handles high-DPI displays
  const drawPreview = (seedStr?: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Always use fixed preview size for canvas, avoid shrinking
    const cssWidth = 300
    const cssHeight = 300
    const dpr = window.devicePixelRatio || 1

    // Resize backing store for crisp rendering on high-DPI screens
    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(cssHeight * dpr)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale drawing operations to account for DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Always render a full-map scaled preview for better visibility
    const previewSize = 150
    const tileSize = Math.max(1, Math.floor(cssWidth / previewSize))

    try {
        const seedNumber = parseInt(seedStr ?? seed) || Date.now()
        const generator = new ProceduralGenerator(seedNumber)
        // Derive expected world map size the same way `startGame` does
        const expectedMapSize = (seedNumber % 100 === 0) ? 300 : 500

        // Generate full map once (seeded) and sample it at a lower resolution for preview
        const fullMap = generator.generateMap(expectedMapSize, expectedMapSize, [])

        for (let py = 0; py < previewSize; py++) {
          for (let px = 0; px < previewSize; px++) {
            const worldX = Math.floor((px / previewSize) * expectedMapSize)
            const worldY = Math.floor((py / previewSize) * expectedMapSize)
            const tile = fullMap.tiles.get(`${worldX},${worldY}`)
            if (!tile) continue

            let color = '#1a1a1a'
            switch (tile.type) {
              case 'water': color = '#2563eb'; break
              case 'grass': color = '#16a34a'; break
              case 'stone': color = '#71717a'; break
              case 'sand': color = '#eab308'; break
            }

            ctx.fillStyle = color
            ctx.fillRect(px * tileSize, py * tileSize, tileSize, tileSize)

            if (tile.resource) {
              let resourceColor = '#a1a1aa'
              switch (tile.resource.type) {
                case 'iron_ore': resourceColor = '#94a3b8'; break
                case 'copper_ore': resourceColor = '#f97316'; break
                case 'coal': resourceColor = '#27272a'; break
                case 'stone': resourceColor = '#78716c'; break
              }
              ctx.fillStyle = resourceColor
              ctx.beginPath()
              ctx.arc(px * tileSize + tileSize / 2, py * tileSize + tileSize / 2, Math.max(1, tileSize / 4), 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }

        // Note: preview is read-only — starting base selection is done in-game

      // Note: preview is informational only; drawing complete above.
    } catch (error) {
      console.error('Error generating preview:', error)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Preview unavailable', cssWidth / 2, cssHeight / 2)
    }
  }

  useEffect(() => {
    // initial draw and redraw on resize
    drawPreview()
    const handleResize = () => drawPreview()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Redraw when seed changes
  useEffect(() => {
    drawPreview()
  }, [seed])

  // No click handler: preview is informational only

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
                  onChange={(e) => { setSeed(e.target.value); drawPreview(e.target.value); }}
                  placeholder="Enter seed..."
                />
                <button type="button" className="random-seed-btn" onClick={() => { const s = Math.floor(Math.random() * 1000000000).toString(); setSeed(s); drawPreview(s); }}>
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
                <div className="legend-item">
                  <span className="legend-color iron"></span>
                  <span>Iron Ore</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color copper"></span>
                  <span>Copper Ore</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color coal"></span>
                  <span>Coal</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color stone-resource"></span>
                  <span>Stone Resource</span>
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

            <div className="mode-objective">
              <h3>Goal</h3>
              <p>
                {gameModes.find(m => m.mode === selectedMode)?.objective ?? 'No specific objective'}
              </p>
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
