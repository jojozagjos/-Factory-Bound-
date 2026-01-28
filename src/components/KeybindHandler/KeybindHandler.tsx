import { useEffect } from 'react'
import { useKeybindStore } from '../../store/keybindStore'
import { useGameStore } from '../../store/gameStore'

const KeybindHandler = () => {
  const keybinds = useKeybindStore(state => state.keybinds)

  const togglePause = useGameStore(state => state.togglePause)
  const toggleInventory = useGameStore(state => state.toggleInventory)
  const toggleShowBuildMenu = () => window.dispatchEvent(new CustomEvent('toggleBuildMenu'))
  const toggleShowTechTree = () => window.dispatchEvent(new CustomEvent('toggleTechTree'))
  const toggleShowNodeEditor = () => window.dispatchEvent(new CustomEvent('toggleNodeEditor'))
  const toggleMinimap = () => window.dispatchEvent(new CustomEvent('toggleMinimap'))
  const deleteSelected = () => {
    const s = useGameStore.getState().selectedMachine
    if (s) useGameStore.getState().removeMachine(s.id)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Normalize key matching (handle single-char keys vs special keys)
      const pressed = e.key

      for (const kb of keybinds) {
        if (!kb.key) continue
        if (kb.key.length === 1) {
          if (pressed.toLowerCase() === kb.key.toLowerCase()) {
            e.preventDefault()
            switch (kb.action) {
              case 'pause':
                togglePause()
                break
              case 'inventory':
                toggleInventory()
                break
              case 'build_menu':
                toggleShowBuildMenu()
                break
              case 'tech_tree':
                toggleShowTechTree()
                break
              case 'node_editor':
                toggleShowNodeEditor()
                break
              case 'minimap':
                toggleMinimap()
                break
              case 'delete_machine':
                deleteSelected()
                break
              case 'cancel':
                // let components that have focused handlers handle cancel; dispatch global event
                window.dispatchEvent(new CustomEvent('globalCancel'))
                break
              default:
                break
            }
            return
          }
        } else {
          // Special keys like Escape, Enter, Delete
          if (pressed === kb.key) {
            e.preventDefault()
            switch (kb.action) {
              case 'pause':
                togglePause()
                break
              case 'inventory':
                toggleInventory()
                break
              case 'build_menu':
                toggleShowBuildMenu()
                break
              case 'tech_tree':
                toggleShowTechTree()
                break
              case 'node_editor':
                toggleShowNodeEditor()
                break
              case 'minimap':
                toggleMinimap()
                break
              case 'delete_machine':
                deleteSelected()
                break
              case 'cancel':
                window.dispatchEvent(new CustomEvent('globalCancel'))
                break
              default:
                break
            }
            return
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [keybinds, toggleInventory, togglePause, deleteSelected])

  return null
}

export default KeybindHandler
