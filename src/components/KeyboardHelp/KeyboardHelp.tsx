import { useState } from 'react'
import './KeyboardHelp.css'

const KeyboardHelp = () => {
  const [isVisible, setIsVisible] = useState(false)

  const shortcuts = [
    { category: 'Camera Controls', items: [
      { keys: ['W', 'A', 'S', 'D'], description: 'Pan camera' },
      { keys: ['Arrow Keys'], description: 'Pan camera' },
      { keys: ['Mouse Wheel'], description: 'Zoom in/out' },
      { keys: ['+', '-'], description: 'Zoom in/out' },
      { keys: ['0'], description: 'Reset camera' },
      { keys: ['Shift + Click'], description: 'Pan camera (drag)' },
      { keys: ['Middle Click'], description: 'Pan camera (drag)' },
    ]},
    { category: 'Game Controls', items: [
      { keys: ['Space'], description: 'Pause/Resume game' },
      { keys: ['B'], description: 'Toggle build menu' },
      { keys: ['T'], description: 'Toggle tech tree' },
      { keys: ['N'], description: 'Toggle node editor' },
      { keys: ['M'], description: 'Toggle minimap' },
      { keys: ['Esc'], description: 'Cancel/Close' },
    ]},
    { category: 'Multiplayer', items: [
      { keys: ['Enter'], description: 'Open chat / Send message' },
      { keys: ['Esc'], description: 'Close chat' },
    ]},
    { category: 'Building', items: [
      { keys: ['Click'], description: 'Select machine / Place building' },
      { keys: ['Esc'], description: 'Cancel building mode' },
      { keys: ['Delete'], description: 'Destroy selected machine' },
    ]},
  ]

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
