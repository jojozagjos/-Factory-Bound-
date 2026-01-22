import './GameOverScreen.css'

interface GameOverScreenProps {
  isVictory: boolean
  score: number
  playtime: string
  stats: {
    enemiesKilled: number
    itemsProduced: number
    techsResearched: number
    machinesBuilt: number
  }
  onReturnToMenu: () => void
  onRestart: () => void
}

const GameOverScreen = ({
  isVictory,
  score,
  playtime,
  stats,
  onReturnToMenu,
  onRestart,
}: GameOverScreenProps) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-screen">
        <div className={`game-over-header ${isVictory ? 'victory' : 'defeat'}`}>
          <h1>{isVictory ? '🎉 VICTORY!' : '💀 DEFEAT'}</h1>
          <p className="game-over-subtitle">
            {isVictory 
              ? 'Congratulations! You have achieved your goal!' 
              : 'Your factory has fallen... Try again?'}
          </p>
        </div>

        <div className="game-over-content">
          <div className="final-score">
            <h2>Final Score</h2>
            <div className="score-value">{score.toLocaleString()}</div>
          </div>

          <div className="game-stats">
            <h3>Game Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">⏱️</span>
                <span className="stat-label">Playtime</span>
                <span className="stat-value">{playtime}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⚔️</span>
                <span className="stat-label">Enemies Killed</span>
                <span className="stat-value">{stats.enemiesKilled}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <span className="stat-label">Items Produced</span>
                <span className="stat-value">{stats.itemsProduced}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🔬</span>
                <span className="stat-label">Technologies Researched</span>
                <span className="stat-value">{stats.techsResearched}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🏭</span>
                <span className="stat-label">Machines Built</span>
                <span className="stat-value">{stats.machinesBuilt}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="game-over-actions">
          <button 
            className="game-over-btn secondary"
            onClick={onReturnToMenu}
          >
            Return to Menu
          </button>
          <button 
            className="game-over-btn primary"
            onClick={onRestart}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOverScreen
