import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import CameraControls, { type CameraState } from '../CameraControls/CameraControls'
import type { MachineType } from '../../types/game'
import './GameCanvas.css'

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const machines = useGameStore(state => state.machines)
  const enemies = useGameStore(state => state.enemies)
  const projectiles = useGameStore(state => state.projectiles)
  const worldMap = useGameStore(state => state.worldMap)
  const selectedMachine = useGameStore(state => state.selectedMachine)
  const placeMachine = useGameStore(state => state.placeMachine)
  const selectMachine = useGameStore(state => state.selectMachine)
  const [buildingMode, setBuildingMode] = useState<MachineType | null>(null)
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null)
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, zoom: 1 })

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

      // Apply camera transform
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(camera.zoom, camera.zoom)
      ctx.translate(-camera.x, -camera.y)

      // Draw world tiles (if map exists)
      if (worldMap) {
        // Convert Map to array for iteration
        const tilesArray = Array.from(worldMap.tiles.values())
        tilesArray.forEach(tile => {
          const screenX = tile.x * gridSize
          const screenY = tile.y * gridSize

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

      // Draw ghost building if in building mode
      if (buildingMode && ghostPosition) {
        const x = ghostPosition.x * gridSize + canvas.width / 2
        const y = ghostPosition.y * gridSize + canvas.height / 2
        
        ctx.save()
        ctx.translate(x + gridSize / 2, y + gridSize / 2)
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#4a9eff'
        ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)
        ctx.globalAlpha = 1
        ctx.restore()
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
        let color = '#4a9eff' // Default blue
        switch (machine.type) {
          case 'miner':
            color = '#fbbf24'
            break
          case 'assembler':
            color = '#4ade80'
            break
          case 'smelter':
            color = '#f97316'
            break
          case 'belt':
            color = '#94a3b8'
            break
          case 'inserter':
            color = '#a78bfa'
            break
          case 'turret':
            color = '#ef4444'
            break
          case 'power_plant':
            color = '#8b5cf6'
            break
          case 'storage':
            color = '#fbbf24'
            break
          default:
            color = '#4a9eff'
        }

        ctx.fillStyle = color
        ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)

        // Draw health bar
        const healthPercent = machine.health / machine.maxHealth
        if (healthPercent < 1) {
          ctx.fillStyle = '#2a2a2a'
          ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 - 8, gridSize - 10, 4)
          ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444'
          ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 - 8, (gridSize - 10) * healthPercent, 4)
        }

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

      // Draw enemies
      enemies.forEach(enemy => {
        const x = enemy.position.x * gridSize + canvas.width / 2
        const y = enemy.position.y * gridSize + canvas.height / 2

        ctx.save()
        ctx.translate(x, y)

        // Draw enemy body
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(0, 0, 15, 0, Math.PI * 2)
        ctx.fill()

        // Draw health bar
        const healthPercent = enemy.health / enemy.maxHealth
        ctx.fillStyle = '#2a2a2a'
        ctx.fillRect(-15, -25, 30, 4)
        ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444'
        ctx.fillRect(-15, -25, 30 * healthPercent, 4)

        ctx.restore()
      })

      // Draw projectiles
      projectiles.forEach(projectile => {
        const x = projectile.position.x * gridSize + canvas.width / 2
        const y = projectile.position.y * gridSize + canvas.height / 2

        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
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
  }, [machines, enemies, projectiles, worldMap, selectedMachine, buildingMode, ghostPosition])

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

    // If in building mode, place machine
    if (buildingMode) {
      const success = placeMachine(buildingMode, { x: gridX, y: gridY })
      if (success) {
        setBuildingMode(null)
        setGhostPosition(null)
      }
      return
    }

    // Find clicked machine
    const clickedMachine = machines.find(
      m => m.position.x === gridX && m.position.y === gridY
    )

    selectMachine(clickedMachine?.id ?? null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!buildingMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const gridSize = 50
    const gridX = Math.floor((x - canvas.width / 2) / gridSize)
    const gridY = Math.floor((y - canvas.height / 2) / gridSize)

    setGhostPosition({ x: gridX, y: gridY })
  }

  // Expose building mode setter for build menu
  useEffect(() => {
    const handleBuildModeChange = (type: MachineType | null) => {
      setBuildingMode(type)
      if (!type) {
        setGhostPosition(null)
      }
    }

    // Listen for custom event from build menu
    // Using custom event for loose coupling between components
    const listener = (e: Event) => {
      const customEvent = e as CustomEvent<MachineType | null>
      handleBuildModeChange(customEvent.detail)
    }
    window.addEventListener('setBuildingMode', listener)

    return () => {
      window.removeEventListener('setBuildingMode', listener)
    }
  }, [])

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        aria-label="Game world canvas"
        style={{ cursor: buildingMode ? 'crosshair' : 'default' }}
      />
      <CameraControls
        camera={camera}
        onCameraChange={setCamera}
        canvasRef={canvasRef}
      />
    </>
  )
}

export default GameCanvas
