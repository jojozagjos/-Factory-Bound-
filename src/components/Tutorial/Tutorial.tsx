import { useEffect, useRef } from 'react'
import { useTutorialStore } from '../../store/tutorialStore'
import './Tutorial.css'

const Tutorial = () => {
  const isActive = useTutorialStore(state => state.isActive)
  const currentStep = useTutorialStore(state => state.getCurrentStep())
  const nextStep = useTutorialStore(state => state.nextStep)
  const previousStep = useTutorialStore(state => state.previousStep)
  const skipTutorial = useTutorialStore(state => state.skipTutorial)
  const currentStepIndex = useTutorialStore(state => state.currentStep)
  const overlayRef = useRef<HTMLDivElement>(null)

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
          
          switch (currentStep.position) {
            case 'top':
              tutorialBox.style.left = `${rect.left + rect.width / 2}px`
              tutorialBox.style.top = `${rect.top - 20}px`
              tutorialBox.style.transform = 'translate(-50%, -100%)'
              break
            case 'bottom':
              tutorialBox.style.left = `${rect.left + rect.width / 2}px`
              tutorialBox.style.top = `${rect.bottom + 20}px`
              tutorialBox.style.transform = 'translate(-50%, 0)'
              break
            case 'left':
              tutorialBox.style.left = `${rect.left - 20}px`
              tutorialBox.style.top = `${rect.top + rect.height / 2}px`
              tutorialBox.style.transform = 'translate(-100%, -50%)'
              break
            case 'right':
              tutorialBox.style.left = `${rect.right + 20}px`
              tutorialBox.style.top = `${rect.top + rect.height / 2}px`
              tutorialBox.style.transform = 'translate(0, -50%)'
              break
            case 'center':
            default:
              tutorialBox.style.left = '50%'
              tutorialBox.style.top = '50%'
              tutorialBox.style.transform = 'translate(-50%, -50%)'
              break
          }
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

  return (
    <div className="tutorial-overlay" ref={overlayRef}>
      <div className="tutorial-backdrop" onClick={(e) => {
        // Prevent clicking through to game elements
        e.stopPropagation()
      }} />
      
      <div className="tutorial-box">
        <div className="tutorial-header">
          <h2>{currentStep.title}</h2>
          <button 
            className="tutorial-skip-btn"
            onClick={skipTutorial}
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
              onClick={nextStep}
            >
              {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tutorial
