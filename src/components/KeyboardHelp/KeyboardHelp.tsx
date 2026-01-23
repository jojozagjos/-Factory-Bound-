import { useState, useMemo } from 'react'
import { useKeybindStore } from '../../store/keybindStore'
import './KeyboardHelp.css'

const KeyboardHelp = () => {
  const [isVisible, setIsVisible] = useState(false)
  const keybinds = useKeybindStore(state => state.keybinds)

  const shortcuts = useMemo(() => {
    const groupedKeybinds = keybinds.reduce((acc, kb) => {
      if (!acc[kb.category]) {
        acc[kb.category] = []
      }
      acc[kb.category].push({
        keys: [kb.key],
        description: kb.description
      })
      return acc
    }, {} as Record<string, Array<{ keys: string[], description: string }>>)

    return Object.entries(groupedKeybinds).map(([category, items]) => ({
      category,
      items
    }))
  }, [keybinds])

  return (
    <>
      <button
        className="keyboard-help-button"
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Toggle keyboard shortcuts"
      >
        ?
      </button>

      {isVisible && (
        <div className="keyboard-help-overlay" onClick={() => setIsVisible(false)}>
          <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="keyboard-help-header">
              <h2>⌨️ Keyboard Shortcuts</h2>
              <button
                className="keyboard-help-close"
                onClick={() => setIsVisible(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="keyboard-help-content">
              {shortcuts.map((section) => (
                <div key={section.category} className="shortcut-section">
                  <h3>{section.category}</h3>
                  <div className="shortcut-list">
                    {section.items.map((item, index) => (
                      <div key={index} className="shortcut-item">
                        <div className="shortcut-keys">
                          {item.keys.map((key, keyIndex) => (
                            <kbd key={keyIndex} className="key">{key}</kbd>
                          ))}
                        </div>
                        <div className="shortcut-description">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="keyboard-help-footer">
              <p>Press <kbd className="key">?</kbd> anytime to toggle this help</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default KeyboardHelp
