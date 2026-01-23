import { useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import './ProfileScreen.css'

interface ProfileScreenProps {
  onClose: () => void
}

const ProfileScreen = ({ onClose }: ProfileScreenProps) => {
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const profilePictureFile = useGameStore(state => state.profilePictureFile)
  const setProfilePictureFile = useGameStore(state => state.setProfilePictureFile)
  const globalStats = useGameStore(state => state.globalStats)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string>('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be smaller than 2MB')
      return
    }

    // Read and convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setProfilePictureFile(result)
      localStorage.setItem('factory_bound_profile_picture', result)
      setUploadError('')
    }
    reader.onerror = () => {
      setUploadError('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProfilePictureFile(null)
    localStorage.removeItem('factory_bound_profile_picture')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getRankColor = (rank: string) => {
    const ranks: Record<string, string> = {
      'Unranked': '#888',
      'Bronze': '#cd7f32',
      'Silver': '#c0c0c0',
      'Gold': '#ffd700',
      'Platinum': '#e5e4e2',
      'Diamond': '#b9f2ff',
      'Master': '#ff00ff',
      'Grandmaster': '#ff6b6b',
    }
    return ranks[rank] || '#888'
  }

  return (
    <div className="profile-screen-overlay" onClick={onClose}>
      <div className="profile-screen" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h1>👤 Player Profile</h1>
          <button className="profile-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="profile-content">
          {/* Profile Info Section */}
          <div className="profile-section">
            <h2>Profile Information</h2>
            <div className="profile-info-grid">
              <div className="profile-avatar-display">
                {profilePictureFile ? (
                  <div className="custom-avatar">
                    <img src={profilePictureFile} alt="Profile" />
                  </div>
                ) : (
                  <div className="default-avatar">👤</div>
                )}
                <div className="profile-username">{currentPlayer?.username || 'Guest'}</div>
                <div className="profile-rank" style={{ color: getRankColor(globalStats.currentRank) }}>
                  {globalStats.currentRank}
                </div>
              </div>
              <div className="profile-stats-summary">
                <div className="stat-item">
                  <span className="stat-label">Current Level</span>
                  <span className="stat-value">{currentPlayer?.stats.level || 1}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Experience</span>
                  <span className="stat-value">{currentPlayer?.stats.experience || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Prestige</span>
                  <span className="stat-value">{currentPlayer?.stats.prestigeLevel || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ranked Record</span>
                  <span className="stat-value">{globalStats.rankedWins}W - {globalStats.rankedLosses}L</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Profile Picture Upload */}
          <div className="profile-section">
            <h2>Profile Picture</h2>
            <div className="avatar-upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="profile-picture-upload"
              />
              <div className="upload-controls">
                <button 
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📸 Upload Custom Image
                </button>
                {profilePictureFile && (
                  <button 
                    className="remove-btn"
                    onClick={handleRemoveImage}
                  >
                    🗑️ Remove Image
                  </button>
                )}
              </div>
              {uploadError && <div className="upload-error">{uploadError}</div>}
              <div className="upload-hint">
                💡 Upload a profile picture (Max 2MB, JPG/PNG/GIF)
              </div>
            </div>
          </div>

          {/* Global Statistics */}
          <div className="profile-section">
            <h2>📊 Career Statistics</h2>
            <p className="stats-description">These statistics are tracked across all your saves</p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏭</div>
                <div className="stat-info">
                  <div className="stat-label">Machines Placed</div>
                  <div className="stat-value">{globalStats.totalMachinesPlaced.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💥</div>
                <div className="stat-info">
                  <div className="stat-label">Machines Destroyed</div>
                  <div className="stat-value">{globalStats.totalMachinesDestroyed.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⛏️</div>
                <div className="stat-info">
                  <div className="stat-label">Resources Gathered</div>
                  <div className="stat-value">{globalStats.totalResourcesGathered.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔨</div>
                <div className="stat-info">
                  <div className="stat-label">Items Crafted</div>
                  <div className="stat-value">{globalStats.totalItemsCrafted.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚔️</div>
                <div className="stat-info">
                  <div className="stat-label">Enemies Killed</div>
                  <div className="stat-value">{globalStats.totalEnemiesKilled.toLocaleString()}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <div className="stat-label">Total Playtime</div>
                  <div className="stat-value">{formatTime(globalStats.totalPlaytime)}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎮</div>
                <div className="stat-info">
                  <div className="stat-label">Games Played</div>
                  <div className="stat-value">{globalStats.totalGamesPlayed}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-label">Games Won</div>
                  <div className="stat-value">{globalStats.totalGamesWon}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="profile-section">
            <h2>🎖️ Ranked Badges ({globalStats.badges.length})</h2>
            <div className="badges-grid">
              {globalStats.badges.length > 0 ? (
                globalStats.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`badge-item ${badge.rarity}`}
                  >
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-info">
                      <div className="badge-title">{badge.name}</div>
                      <div className="badge-description">{badge.description}</div>
                      <div className="badge-date">
                        Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-badges">
                  🎯 Play ranked matches to earn badges!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-footer">
          <button className="profile-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileScreen
