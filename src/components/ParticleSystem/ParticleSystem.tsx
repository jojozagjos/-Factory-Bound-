import { useEffect, useRef } from 'react'
import './ParticleSystem.css'

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'explosion' | 'smoke' | 'spark' | 'resource'
}

interface ParticleSystemProps {
  particles: Particle[]
  onUpdate: (particles: Particle[]) => void
}

const ParticleSystem = ({ particles, onUpdate }: ParticleSystemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const updatedParticles = particles.map(p => {
        // Update position
        const newP = {
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // Gravity
          life: p.life - 1,
        }

        // Render based on type
        const alpha = newP.life / newP.maxLife
        ctx.globalAlpha = alpha

        switch (p.type) {
          case 'explosion':
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(newP.x, newP.y, p.size * alpha, 0, Math.PI * 2)
            ctx.fill()
            break
          case 'smoke':
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(newP.x, newP.y, p.size + (1 - alpha) * 5, 0, Math.PI * 2)
            ctx.fill()
            break
          case 'spark':
            ctx.strokeStyle = p.color
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(newP.x, newP.y)
            ctx.lineTo(newP.x - newP.vx * 2, newP.y - newP.vy * 2)
            ctx.stroke()
            break
          case 'resource':
            ctx.fillStyle = p.color
            ctx.fillRect(newP.x - p.size / 2, newP.y - p.size / 2, p.size, p.size)
            break
        }

        ctx.globalAlpha = 1

        return newP
      }).filter(p => p.life > 0)

      onUpdate(updatedParticles)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [particles, onUpdate])

  return <canvas ref={canvasRef} className="particle-canvas" />
}

export default ParticleSystem

// Helper functions to create particles
export const createExplosion = (x: number, y: number, count: number = 20): Particle[] => {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    const speed = 2 + Math.random() * 3
    particles.push({
      id: `explosion-${Date.now()}-${i}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`,
      size: 3 + Math.random() * 4,
      type: 'explosion',
    })
  }
  return particles
}

export const createResourceParticle = (x: number, y: number, color: string): Particle => ({
  id: `resource-${Date.now()}-${Math.random()}`,
  x,
  y,
  vx: (Math.random() - 0.5) * 2,
  vy: -2 - Math.random() * 2,
  life: 40,
  maxLife: 40,
  color,
  size: 6,
  type: 'resource',
})

export const createSmoke = (x: number, y: number): Particle => ({
  id: `smoke-${Date.now()}-${Math.random()}`,
  x,
  y,
  vx: (Math.random() - 0.5) * 0.5,
  vy: -0.5 - Math.random() * 0.5,
  life: 60,
  maxLife: 60,
  color: 'rgba(100, 100, 100, 0.5)',
  size: 4,
  type: 'smoke',
})
