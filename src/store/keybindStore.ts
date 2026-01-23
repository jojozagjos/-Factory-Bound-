import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Keybind {
  action: string
  key: string
  description: string
  category: string
}

interface KeybindState {
  keybinds: Keybind[]
  setKeybind: (action: string, newKey: string) => boolean
  getKeybind: (action: string) => string | undefined
  resetToDefaults: () => void
  checkConflict: (key: string, excludeAction?: string) => string | null
}

const defaultKeybinds: Keybind[] = [
  // Camera Controls
  { action: 'camera_zoom_in', key: '+', description: 'Zoom in', category: 'Camera' },
  { action: 'camera_zoom_out', key: '-', description: 'Zoom out', category: 'Camera' },
  { action: 'camera_reset', key: '0', description: 'Reset camera', category: 'Camera' },
  
  // Game Controls
  { action: 'pause', key: ' ', description: 'Pause/Resume game', category: 'Game' },
  { action: 'inventory', key: 'i', description: 'Toggle inventory', category: 'Game' },
  { action: 'build_menu', key: 'b', description: 'Toggle build menu', category: 'Game' },
  { action: 'tech_tree', key: 't', description: 'Toggle tech tree', category: 'Game' },
  { action: 'node_editor', key: 'n', description: 'Toggle node editor', category: 'Game' },
  { action: 'minimap', key: 'm', description: 'Toggle minimap', category: 'Game' },
  { action: 'cancel', key: 'Escape', description: 'Cancel/Close', category: 'Game' },
  
  // Multiplayer
  { action: 'chat', key: 'Enter', description: 'Open chat / Send message', category: 'Multiplayer' },
  { action: 'player_list', key: 'p', description: 'Toggle player list', category: 'Multiplayer' },
  
  // Building
  { action: 'delete_machine', key: 'Delete', description: 'Destroy selected machine', category: 'Building' },
]

export const useKeybindStore = create<KeybindState>()(
  persist(
    (set, get) => ({
      keybinds: defaultKeybinds,

      setKeybind: (action: string, newKey: string) => {
        const conflict = get().checkConflict(newKey, action)
        if (conflict) {
          return false // Has conflict
        }

        set((state) => ({
          keybinds: state.keybinds.map((kb) =>
            kb.action === action ? { ...kb, key: newKey } : kb
          ),
        }))
        return true
      },

      getKeybind: (action: string) => {
        const keybind = get().keybinds.find((kb) => kb.action === action)
        return keybind?.key
      },

      resetToDefaults: () => {
        set({ keybinds: defaultKeybinds })
      },

      checkConflict: (key: string, excludeAction?: string) => {
        const existingKeybind = get().keybinds.find(
          (kb) => kb.key.toLowerCase() === key.toLowerCase() && kb.action !== excludeAction
        )
        return existingKeybind ? existingKeybind.action : null
      },
    }),
    {
      name: 'keybind-storage',
    }
  )
)
