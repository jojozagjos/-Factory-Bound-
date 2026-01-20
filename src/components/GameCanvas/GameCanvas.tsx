import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import './GameCanvas.css'

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const machines = useGameStore(state => state.machines)
  const worldMap = useGameStore(state => state.worldMap)
  const selectedMachine = useGameStore(state => state.selectedMachine)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Simple render loop
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      const gridSize = 50
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw world tiles (if map exists)
      if (worldMap) {
        worldMap.tiles.forEach(tile => {
          const screenX = tile.x * gridSize + canvas.width / 2
          const screenY = tile.y * gridSize + canvas.height / 2

          // Draw tile based on type
          switch (tile.type) {
            case 'water':
              ctx.fillStyle = '#1e40af'
              break
            case 'grass':
              ctx.fillStyle = '#16a34a'
              break
            case 'stone':
              ctx.fillStyle = '#737373'
              break
            case 'sand':
              ctx.fillStyle = '#d97706'
              break
            default:
              ctx.fillStyle = '#1a1a1a'
          }
          ctx.fillRect(screenX, screenY, gridSize - 2, gridSize - 2)

          // Draw resources
          if (tile.resource) {
            ctx.fillStyle = tile.resource.type === 'iron_ore' ? '#94a3b8' : '#ea580c'
            ctx.beginPath()
            ctx.arc(screenX + gridSize / 2, screenY + gridSize / 2, 8, 0, Math.PI * 2)
            ctx.fill()
          }
        })
      }

      // Draw machines
      machines.forEach(machine => {
        const x = machine.position.x * gridSize + canvas.width / 2
        const y = machine.position.y * gridSize + canvas.height / 2

        // Draw machine based on type
        ctx.save()
        ctx.translate(x + gridSize / 2, y + gridSize / 2)
        ctx.rotate((machine.rotation * Math.PI) / 180)

        // Machine color by type
        let color = '#4a9eff'
        switch (machine.type) {
          case 'miner':
            color = '#fbbf24'
            break
          case 'assembler':
            color = '#4ade80'
            break
          case 'belt':
            color = '#94a3b8'
            break
          case 'turret':
            color = '#ef4444'
            break
          case 'power_plant':
            color = '#8b5cf6'
            break
        }

        ctx.fillStyle = color
        ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)

        // Draw selection highlight
        if (selectedMachine?.id === machine.id) {
          ctx.strokeStyle = '#4a9eff'
          ctx.lineWidth = 3
          ctx.strokeRect(-gridSize / 2 + 2, -gridSize / 2 + 2, gridSize - 4, gridSize - 4)
        }

        // Draw power status
        if (machine.power.connected) {
          ctx.fillStyle = machine.power.available >= machine.power.required ? '#4ade80' : '#ef4444'
          ctx.beginPath()
          ctx.arc(gridSize / 2 - 10, -gridSize / 2 + 10, 4, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      requestAnimationFrame(render)
    }

    render()

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [machines, worldMap, selectedMachine])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert screen coords to grid coords
    const gridSize = 50
    const gridX = Math.floor((x - canvas.width / 2) / gridSize)
    const gridY = Math.floor((y - canvas.height / 2) / gridSize)

    // Find clicked machine
    const clickedMachine = machines.find(
      m => m.position.x === gridX && m.position.y === gridY
    )

    useGameStore.getState().selectMachine(clickedMachine?.id ?? null)
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="game-canvas"
      onClick={handleCanvasClick}
      aria-label="Game world canvas"
    />
  )
}

export default GameCanvas
