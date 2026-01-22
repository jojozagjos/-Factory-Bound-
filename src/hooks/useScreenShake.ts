import { useState } from 'react'

interface ScreenShakeOptions {
  intensity?: number
  duration?: number
}

export const useScreenShake = () => {
  const [isShaking, setIsShaking] = useState(false)
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 })

  const shake = ({ intensity = 10, duration = 500 }: ScreenShakeOptions = {}) => {
    setIsShaking(true)

    const startTime = Date.now()
    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1) {
        clearInterval(shakeInterval)
        setIsShaking(false)
        setShakeOffset({ x: 0, y: 0 })
        return
      }

      // Decrease intensity over time
      const currentIntensity = intensity * (1 - progress)
      setShakeOffset({
        x: (Math.random() - 0.5) * currentIntensity,
        y: (Math.random() - 0.5) * currentIntensity,
      })
    }, 16) // ~60fps

    return () => clearInterval(shakeInterval)
  }

  return { shake, isShaking, shakeOffset }
}
