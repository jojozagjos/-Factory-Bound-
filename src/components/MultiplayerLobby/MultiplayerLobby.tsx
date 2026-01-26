import { useState, useEffect } from 'react'
import { NetworkManager } from '../../engine/networking/NetworkManager'
import type { GameSession, Player, GameSettings } from '../../types/game'
import './MultiplayerLobby.css'

interface MultiplayerLobbyProps {
  mode: 'host' | 'join' | 'ranked'
  isPvP: boolean
  onStartGame: (session: GameSession) => void
  onCancel: () => void
}

const MultiplayerLobby = ({ mode, isPvP, onStartGame, onCancel }: MultiplayerLobbyProps) => {
  const [networkManager] = useState(() => new NetworkManager())
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const [availableSessions, setAvailableSessions] = useState<GameSession[]>([])
  const [error, setError] = useState<string>('')
  const [lobbyCode, setLobbyCode] = useState('')
  const [serverName, setServerName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [settings, setSettings] = useState<GameSettings>({
    maxPlayers: isPvP ? 4 : 8,
    difficulty: 'normal',
    pvpEnabled: isPvP,
    friendlyFire: false,
    worldSeed: Date.now(),
    modifiers: [],
    enemiesEnabled: false,
    enemyFactoriesEnabled: false,
    oceanEnemiesEnabled: false,
    maxEnemyBases: 5,
    gameMode: isPvP ? 'pvp' : 'coop',
  })

  useEffect(() => {
    connectToServer()
    return () => {
      networkManager.disconnect()
    }
  }, [networkManager])

  const connectToServer = async () => {
    setIsConnecting(true)
    setError('')
    try {
      await networkManager.connect()
      setIsConnected(true)
      setOfflineMode(false)
      
      if (mode === 'join' || mode === 'ranked') {
        // Fetch available sessions
        const sessions = await networkManager.listSessions(isPvP ? 'pvp' : 'coop')
        setAvailableSessions(sessions)
      }
    } catch (err) {
      // Fallback to offline mode
      setOfflineMode(true)
      setIsConnected(false)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Server unavailable: ${errorMessage}\n\nYou can still play in single-player mode.`)
      console.error('Connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCreateSession = async () => {
    if (!isConnected) return
    
    setError('')
    try {
      const session = await networkManager.createSession(settings)
      setCurrentSession(session)
      setLobbyCode(session.id.slice(0, 6).toUpperCase())
    } catch (err) {
      setError('Failed to create session. Please try again.')
      console.error('Create session error:', err)
    }
  }

  const handleJoinSession = async (sessionId: string) => {
    if (!isConnected) return
    
    setError('')
    try {
      const session = await networkManager.joinSession(sessionId)
      setCurrentSession(session)
    } catch (err) {
      setError('Failed to join session. Please try again.')
      console.error('Join session error:', err)
    }
  }

  const handleJoinByCode = async () => {
    if (!lobbyCode.trim()) {
      setError('Please enter a lobby code')
      return
    }
    
    await handleJoinSession(lobbyCode.toLowerCase())
  }

  const handleStartMatch = async () => {
    if (!currentSession) return
    
    try {
      await networkManager.startSession(currentSession.id)
      onStartGame(currentSession)
    } catch (err) {
      setError('Failed to start game. Please try again.')
      console.error('Start game error:', err)
    }
  }

  const handleFindMatch = async () => {
    if (!isConnected) return
    
    setError('')
    setIsConnecting(true)
    try {
      const session = await networkManager.findMatch(isPvP)
      setCurrentSession(session)
      
      // In ranked mode, game starts automatically when match is found
      if (mode === 'ranked' && session.state === 'active') {
        onStartGame(session)
      }
    } catch (err) {
      setError('No matches found. Please try again.')
      console.error('Matchmaking error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  if (isConnecting) {
    return (
      <div className="multiplayer-lobby">
        <div className="lobby-container">
          <div className="lobby-loading">
            <div className="loading-spinner"></div>
            <p>Connecting to game server...</p>
            <p className="connection-status">Attempting to connect to {networkManager.isInOfflineMode() ? 'offline mode' : 'multiplayer server'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected && offlineMode) {
    return (
      <div className="multiplayer-lobby">
        <div className="lobby-container">
          <div className="lobby-error">
            <h2>⚠️ Offline Mode</h2>
            <p className="error-message">{error}</p>
            <div className="offline-info">
              <p>Multiplayer features require an active server connection.</p>
              <p>Please check:</p>
              <ul>
                <li>Server is running on {networkManager['serverUrl']}</li>
                <li>Network connection is active</li>
                <li>Firewall allows connections</li>
              </ul>
            </div>
            <div className="lobby-actions">
              <button className="lobby-button primary" onClick={connectToServer}>
                🔄 Retry Connection
              </button>
              <button className="lobby-button" onClick={onCancel}>
                ← Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lobby view (session created/joined)
  if (currentSession) {
    // TODO: In production, compare with actual authenticated player ID
    const isHost = currentSession.host === 'local' // Placeholder until server integration
    const canStart = isHost && currentSession.players.length >= (isPvP ? 2 : 1)

    return (
      <div className="multiplayer-lobby">
        <div className="lobby-container">
          <div className="lobby-header">
            <h2>{isPvP ? 'PvP Match Lobby' : 'Co-op Game Lobby'}</h2>
            {lobbyCode && (
              <div className="lobby-code">
                <span>Lobby Code:</span>
                <code>{lobbyCode}</code>
              </div>
            )}
          </div>

          <div className="lobby-content">
            <div className="lobby-section">
              <h3>Players ({currentSession.players.length}/{settings.maxPlayers})</h3>
              <div className="player-list">
                {currentSession.players.map((player: Player) => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">{player.username}</span>
                    <span className="player-level">Level {player.stats.level}</span>
                    {player.team && <span className="player-team">Team {player.team}</span>}
                  </div>
                ))}
              </div>
            </div>

            {isHost && (
              <div className="lobby-section">
                <h3>Game Settings</h3>
                <div className="settings-grid">
                  <label>
                    <span>Max Players:</span>
                    <select 
                      value={settings.maxPlayers} 
                      onChange={(e) => setSettings({...settings, maxPlayers: parseInt(e.target.value, 10)})}
                    >
                      {isPvP ? (
                        <>
                          <option value="2">2 Players</option>
                          <option value="4">4 Players</option>
                        </>
                      ) : (
                        <>
                          <option value="2">2 Players</option>
                          <option value="4">4 Players</option>
                          <option value="8">8 Players</option>
                        </>
                      )}
                    </select>
                  </label>
                  <label>
                    <span>Difficulty:</span>
                    <select 
                      value={settings.difficulty}
                      onChange={(e) => setSettings({...settings, difficulty: e.target.value as GameSettings['difficulty']})}
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="nightmare">Nightmare</option>
                    </select>
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.friendlyFire}
                      onChange={(e) => setSettings({...settings, friendlyFire: e.target.checked})}
                    />
                    <span>Friendly Fire</span>
                  </label>
                </div>
              </div>
            )}

            {error && <div className="lobby-error-msg">{error}</div>}
          </div>

          <div className="lobby-actions">
            {isHost && (
              <button 
                className="lobby-button primary" 
                onClick={handleStartMatch}
                disabled={!canStart}
              >
                Start Game
              </button>
            )}
            {!isHost && (
              <div className="lobby-waiting">
                <div className="waiting-spinner"></div>
                <p>Waiting for host to start the game...</p>
              </div>
            )}
            <button className="lobby-button" onClick={onCancel}>
              Leave Lobby
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main lobby view (host/join selection)
  if (mode === 'host') {
    return (
      <div className="multiplayer-lobby">
        <div className="lobby-container">
          <div className="lobby-header">
            <h2>Host {isPvP ? 'PvP' : 'Co-op'} Game</h2>
          </div>

          <div className="lobby-content">
            <div className="lobby-section">
              <h3>Server Settings</h3>
              <div className="settings-grid">
                <label>
                  <span>Server Name:</span>
                  <input 
                    type="text" 
                    placeholder="My Awesome Server"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    maxLength={50}
                  />
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span>Private Server (requires code to join)</span>
                </label>
              </div>
            </div>

            <div className="lobby-section">
              <h3>Game Settings</h3>
              <div className="settings-grid">
                <label>
                  <span>Max Players:</span>
                  <select 
                    value={settings.maxPlayers}
                    onChange={(e) => setSettings({...settings, maxPlayers: parseInt(e.target.value, 10)})}
                  >
                    {isPvP ? (
                      <>
                        <option value="2">2 Players</option>
                        <option value="4">4 Players</option>
                      </>
                    ) : (
                      <>
                        <option value="2">2 Players</option>
                        <option value="4">4 Players</option>
                        <option value="8">8 Players</option>
                      </>
                    )}
                  </select>
                </label>
                <label>
                  <span>Difficulty:</span>
                  <select 
                    value={settings.difficulty}
                    onChange={(e) => setSettings({...settings, difficulty: e.target.value as GameSettings['difficulty']})}
                  >
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                    <option value="nightmare">Nightmare</option>
                  </select>
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.friendlyFire}
                    onChange={(e) => setSettings({...settings, friendlyFire: e.target.checked})}
                  />
                  <span>Friendly Fire</span>
                </label>
                <label>
                  <span>World Seed:</span>
                  <input 
                    type="number" 
                    value={settings.worldSeed}
                    onChange={(e) => setSettings({...settings, worldSeed: parseInt(e.target.value, 10)})}
                  />
                </label>
              </div>
            </div>

            {error && <div className="lobby-error-msg">{error}</div>}
            {offlineMode && (
              <div className="lobby-info-msg">
                ℹ️ Server is offline. You can still create a local game, but multiplayer features won't be available.
              </div>
            )}
          </div>

          <div className="lobby-actions">
            <button className="lobby-button primary" onClick={handleCreateSession}>
              {offlineMode ? 'Create Local Game' : 'Create Server'}
            </button>
            <button className="lobby-button" onClick={onCancel}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    const filteredSessions = availableSessions.filter(session => {
      if (!searchFilter) return true
      const sessionName = session.id.toLowerCase()
      const filter = searchFilter.toLowerCase()
      return sessionName.includes(filter)
    })

    return (
      <div className="multiplayer-lobby">
        <div className="lobby-container">
          <div className="lobby-header">
            <h2>Join {isPvP ? 'PvP' : 'Co-op'} Game</h2>
          </div>

          <div className="lobby-content">
            <div className="lobby-section">
              <h3>Join by Code</h3>
              <div className="code-input-group">
                <input 
                  type="text" 
                  placeholder="Enter lobby code"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button className="lobby-button primary" onClick={handleJoinByCode}>
                  Join
                </button>
              </div>
            </div>

            <div className="lobby-divider">OR</div>

            <div className="lobby-section">
              <h3>Server Browser</h3>
              <div className="server-browser-controls">
                <input 
                  type="text" 
                  placeholder="Search servers..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="search-input"
                />
                <button 
                  className="lobby-button" 
                  onClick={() => connectToServer()}
                  title="Refresh server list"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="session-list">
                {offlineMode ? (
                  <div className="empty-sessions">
                    <p>⚠️ Server is offline</p>
                    <p>Multiplayer features are currently unavailable.</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <p className="empty-sessions">
                    {searchFilter ? 'No servers match your search' : 'No active servers found'}
                  </p>
                ) : (
                  filteredSessions.map((session) => (
                    <div key={session.id} className="session-item">
                      <div className="session-info">
                        <span className="session-name">
                          {session.mode === 'pvp' ? '⚔️ PvP Match' : '🤝 Co-op Game'}
                        </span>
                        <span className="session-players">
                          👥 {session.players.length}/{session.settings.maxPlayers}
                        </span>
                        <span className="session-difficulty">
                          ⭐ {session.settings.difficulty}
                        </span>
                      </div>
                      <button 
                        className="lobby-button primary small"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        Join
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {error && <div className="lobby-error-msg">{error}</div>}
          </div>

          <div className="lobby-actions">
            <button className="lobby-button" onClick={onCancel}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Ranked matchmaking
  return (
    <div className="multiplayer-lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <h2>Ranked PvP Matchmaking</h2>
        </div>

        <div className="lobby-content">
          <div className="matchmaking-info">
            <div className="rank-display">
              <h3>Your Rank</h3>
              <div className="rank-badge">
                <span className="rank-tier">Bronze III</span>
                <span className="rank-rating">1250 MMR</span>
              </div>
            </div>
            <p className="matchmaking-desc">
              You will be matched with players of similar skill level. Games are competitive and count towards your rank.
            </p>
          </div>

          {error && <div className="lobby-error-msg">{error}</div>}
        </div>

        <div className="lobby-actions">
          <button className="lobby-button primary large" onClick={handleFindMatch}>
            Find Match
          </button>
          <button className="lobby-button" onClick={onCancel}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default MultiplayerLobby
