import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { achievementSystem } from '../../systems/AchievementSystem/AchievementSystem'
import './ProfileScreen.css'

interface ProfileScreenProps {
  onClose: () => void
}

const AVATAR_OPTIONS = [
  '👤', '👨', '👩', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🔬', '👩‍🔬',
  '🤖', '👽', '🦊', '🐻', '🐼', '🐯', '🦁', '🐮',
  '⚙️', '🔧', '🏭', '🚀', '⚡', '🔥', '💎', '⭐'
]

const ProfileScreen = ({ onClose }: ProfileScreenProps) => {
  const currentPlayer = useGameStore(state => state.currentPlayer)
  const profilePicture = useGameStore(state => state.profilePicture)
  const setProfilePicture = useGameStore(state => state.setProfilePicture)
  const [selectedAvatar, setSelectedAvatar] = useState(profilePicture)

  const achievements = achievementSystem.getAll()
  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const totalAchievements = achievements.length

  const handleSaveAvatar = () => {
    setProfilePicture(selectedAvatar)
    onClose()
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
                <div className="current-avatar">{profilePicture}</div>
                <div className="profile-username">{currentPlayer?.username || 'Guest'}</div>
              </div>
              <div className="profile-stats-summary">
                <div className="stat-item">
                  <span className="stat-label">Level</span>
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
                  <span className="stat-label">Research</span>
                  <span className="stat-value">{currentPlayer?.stats.completedResearch.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="profile-section">
            <h2>Choose Avatar</h2>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  aria-label={`Select avatar ${avatar}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
            {selectedAvatar !== profilePicture && (
              <button className="save-avatar-btn" onClick={handleSaveAvatar}>
                Save Avatar
              </button>
            )}
          </div>

          {/* Achievements Section */}
          <div className="profile-section">
            <h2>
              🏆 Achievements ({unlockedAchievements.length}/{totalAchievements})
            </h2>
            <div className="achievements-list">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <div className="achievement-title">{achievement.name}</div>
                      <div className="achievement-description">{achievement.description}</div>
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                              }}
                            />
                          </div>
                          <span className="progress-text">
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                      )}
                    </div>
                    {achievement.unlocked && (
                      <div className="achievement-unlocked-badge">✓</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-achievements">No achievements yet. Start playing to unlock!</p>
              )}
            </div>
          </div>

          {/* Player Stats */}
          <div className="profile-section">
            <h2>📊 Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">❤️</div>
                <div className="stat-info">
                  <div className="stat-label">Health</div>
                  <div className="stat-value">
                    {currentPlayer?.health || 0}/{currentPlayer?.maxHealth || 100}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎒</div>
                <div className="stat-info">
                  <div className="stat-label">Inventory Items</div>
                  <div className="stat-value">{currentPlayer?.inventory.length || 0}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔬</div>
                <div className="stat-info">
                  <div className="stat-label">Techs Unlocked</div>
                  <div className="stat-value">{currentPlayer?.stats.unlockedTech.length || 0}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <div className="stat-label">Level Progress</div>
                  <div className="stat-value">
                    {currentPlayer?.stats.experience || 0} XP
                  </div>
                </div>
              </div>
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
