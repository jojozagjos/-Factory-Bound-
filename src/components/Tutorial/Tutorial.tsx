import { useEffect, useRef } from 'react'
import { useTutorialStore } from '../../store/tutorialStore'
import './Tutorial.css'

const Tutorial = () => {
  const isActive = useTutorialStore(state => state.isActive)
  const currentStep = useTutorialStore(state => state.getCurrentStep())
  const nextStep = useTutorialStore(state => state.nextStep)
  const previousStep = useTutorialStore(state => state.previousStep)
  const skipTutorial = useTutorialStore(state => state.skipTutorial)
  const completeTutorial = useTutorialStore(state => state.completeTutorial)
  const currentStepIndex = useTutorialStore(state => state.currentStep)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleNextStep = () => {
    const totalSteps = 16
    if (currentStepIndex === totalSteps - 1) {
      // Last step - complete tutorial
      completeTutorial()
      // Dispatch custom event to return to menu
      window.dispatchEvent(new CustomEvent('tutorialComplete'))
    } else {
      nextStep()
    }
  }

  useEffect(() => {
    // Highlight target element if specified
    if (currentStep?.target && overlayRef.current) {
      const targetElement = document.querySelector(currentStep.target)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        const overlay = overlayRef.current
        
        // Position the tutorial box near the target
        const tutorialBox = overlay.querySelector('.tutorial-box') as HTMLElement
        if (tutorialBox) {
          tutorialBox.style.position = 'fixed'
          
          // Get tutorial box dimensions
          const boxWidth = 400 // Approximate width
          const boxHeight = 250 // Approximate height
          const padding = 20
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          
          let left = 0
          let top = 0
          let transform = ''
          
          switch (currentStep.position) {
            case 'top':
              left = rect.left + rect.width / 2
              top = rect.top - padding
              transform = 'translate(-50%, -100%)'
              // Keep on screen
              if (top - boxHeight < 0) {
                // Not enough room above, place below instead
                top = rect.bottom + padding
                transform = 'translate(-50%, 0)'
              }
              break
            case 'bottom':
              left = rect.left + rect.width / 2
              top = rect.bottom + padding
              transform = 'translate(-50%, 0)'
              // Keep on screen
              if (top + boxHeight > viewportHeight) {
                // Not enough room below, place above instead
                top = rect.top - padding
                transform = 'translate(-50%, -100%)'
              }
              break
            case 'left':
              left = rect.left - padding
              top = rect.top + rect.height / 2
              transform = 'translate(-100%, -50%)'
              // Keep on screen
              if (left - boxWidth < 0) {
                // Not enough room on left, place on right instead
                left = rect.right + padding
                transform = 'translate(0, -50%)'
              }
              break
            case 'right':
              left = rect.right + padding
              top = rect.top + rect.height / 2
              transform = 'translate(0, -50%)'
              // Keep on screen
              if (left + boxWidth > viewportWidth) {
                // Not enough room on right, place on left instead
                left = rect.left - padding
                transform = 'translate(-100%, -50%)'
              }
              break
            case 'center':
            default:
              left = viewportWidth / 2
              top = viewportHeight / 2
              transform = 'translate(-50%, -50%)'
              break
          }
          
          // Clamp to viewport bounds
          if (transform.includes('-50%')) {
            left = Math.max(boxWidth / 2, Math.min(viewportWidth - boxWidth / 2, left))
          }
          
          tutorialBox.style.left = `${left}px`
          tutorialBox.style.top = `${top}px`
          tutorialBox.style.transform = transform
        }

        // Add highlight effect to target
        targetElement.classList.add('tutorial-highlight')
        
        return () => {
          targetElement.classList.remove('tutorial-highlight')
        }
      }
    }
  }, [currentStep])

  if (!isActive || !currentStep) return null

  const totalSteps = 16 // Total number of tutorial steps
  
  // Don't show backdrop for camera controls step to allow interaction
  const showBackdrop = currentStep.id !== 'camera_controls'

  return (
    <div className="tutorial-overlay" ref={overlayRef}>
      {showBackdrop && (
        <div className="tutorial-backdrop" onClick={(e) => {
          // Prevent clicking through to game elements
          e.stopPropagation()
        }} />
      )}
      
      <div className="tutorial-box">
        <div className="tutorial-header">
          <h2>{currentStep.title}</h2>
          <button 
            className="tutorial-skip-btn"
            onClick={() => {
              skipTutorial()
              // Dispatch custom event to return to menu
              window.dispatchEvent(new CustomEvent('tutorialComplete'))
            }}
            aria-label="Skip tutorial"
          >
            ✕ Skip Tutorial
          </button>
        </div>

        <div className="tutorial-content">
          <p>{currentStep.description}</p>
          {currentStep.objective && (
            <div className="tutorial-objective">
              <strong>Objective:</strong> {currentStep.objective}
            </div>
          )}
        </div>

        <div className="tutorial-footer">
          <div className="tutorial-progress">
            Step {currentStepIndex + 1} of {totalSteps}
            <div className="tutorial-progress-bar">
              <div 
                className="tutorial-progress-fill"
                style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="tutorial-buttons">
            <button
              className="tutorial-btn tutorial-btn-secondary"
              onClick={previousStep}
              disabled={currentStepIndex === 0}
            >
              ← Previous
            </button>
            <button
              className="tutorial-btn tutorial-btn-primary"
              onClick={handleNextStep}
            >
              {currentStepIndex === totalSteps - 1 ? 'Finish Tutorial' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tutorial
