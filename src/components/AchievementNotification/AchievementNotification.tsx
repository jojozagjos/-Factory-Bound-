import { useState, useEffect } from 'react'
import { achievementSystem, type Achievement } from '../../systems/AchievementSystem/AchievementSystem'
import './AchievementNotification.css'

const AchievementNotification = () => {
  const [notification, setNotification] = useState<Achievement | null>(null)

  useEffect(() => {
    const unsubscribe = achievementSystem.subscribe((achievement) => {
      setNotification(achievement)
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    })

    // Load saved achievements
    achievementSystem.load()

    return unsubscribe
  }, [])

  if (!notification) return null

  const rarityClass = notification.rarity || 'common'

  return (
    <div className={`achievement-notification achievement-${rarityClass}`}>
      <div className="achievement-icon">{notification.icon}</div>
      <div className="achievement-details">
        <div className="achievement-title">Achievement Unlocked!</div>
        <div className="achievement-name">{notification.name}</div>
        <div className="achievement-description">{notification.description}</div>
      </div>
      <div className="achievement-rarity">{rarityClass.toUpperCase()}</div>
    </div>
  )
}

export default AchievementNotification
