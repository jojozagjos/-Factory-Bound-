import { useState, useEffect } from 'react'
import './IntroScreen.css'

interface IntroScreenProps {
  onComplete: () => void
}

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [step, setStep] = useState(0)
  const [isSkippable, setIsSkippable] = useState(false)

  useEffect(() => {
    // Make skippable after 1 second
    const skipTimer = setTimeout(() => {
      setIsSkippable(true)
    }, 1000)

    // Auto-progress through intro steps
    const stepTimers = [
      setTimeout(() => setStep(1), 2000),  // Show title
      setTimeout(() => setStep(2), 4000),  // Show subtitle
      setTimeout(() => setStep(3), 6000),  // Show "click to continue"
    ]

    return () => {
      clearTimeout(skipTimer)
      stepTimers.forEach(clearTimeout)
    }
  }, [])

  const handleClick = () => {
    if (isSkippable) {
      onComplete()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isSkippable && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
      onComplete()
    }
  }

  return (
    <div 
      className="intro-screen" 
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label="Skip intro"
    >
      <div className="intro-background">
        <div className="intro-particles">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="intro-content">
        {step >= 1 && (
          <div className={`intro-element fade-in ${step >= 1 ? 'visible' : ''}`}>
            <h1 className="intro-title">FACTORY BOUND</h1>
          </div>
        )}
        
        {step >= 2 && (
          <div className={`intro-element fade-in-delay ${step >= 2 ? 'visible' : ''}`}>
            <p className="intro-subtitle">
              Build • Automate • Optimize
            </p>
          </div>
        )}

        {step >= 3 && (
          <div className={`intro-element fade-in-delay-2 ${step >= 3 ? 'visible' : ''}`}>
            <p className="intro-prompt">
              Click to continue
            </p>
          </div>
        )}
      </div>

      {isSkippable && step < 3 && (
        <div className="intro-skip">
          Press any key to skip
        </div>
      )}
    </div>
  )
}

export default IntroScreen
