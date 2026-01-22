import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

/**
 * Hook to enable auto-save functionality
 * Saves the game every 5 minutes to a special auto-save slot
 */
export const useAutoSave = (enabled: boolean = true) => {
  const saveGame = useGameStore(state => state.saveGame)
  const isPaused = useGameStore(state => state.isPaused)
  const lastSaveTime = useRef(Date.now())

  useEffect(() => {
    if (!enabled) return

    const AUTO_SAVE_INTERVAL = 5 * 60 * 1000 // 5 minutes

    const interval = setInterval(() => {
      // Don't auto-save if game is paused
      if (isPaused) return

      const now = Date.now()
      if (now - lastSaveTime.current >= AUTO_SAVE_INTERVAL) {
        try {
          const saveData = saveGame()
          const autoSaveSlot = {
            metadata: {
              id: 'factory_bound_autosave',
              name: 'Auto Save',
              timestamp: Date.now(),
              playtime: 0,
              level: 1,
              version: '1.0.0',
            },
            data: saveData,
          }

          localStorage.setItem('factory_bound_autosave', JSON.stringify(autoSaveSlot))
          lastSaveTime.current = now

          // Show a subtle notification (could be enhanced with a notification system)
          console.log('✅ Game auto-saved')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [enabled, isPaused, saveGame])
}
