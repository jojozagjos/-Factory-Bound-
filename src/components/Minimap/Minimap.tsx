import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import './Minimap.css'

interface MinimapProps {
  width?: number
  height?: number
}

const Minimap = ({ width = 200, height = 200 }: MinimapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const machines = useGameStore(state => state.machines)
  const enemies = useGameStore(state => state.enemies)
  const worldMap = useGameStore(state => state.worldMap)
  const currentPlayer = useGameStore(state => state.currentPlayer)
  
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [mapZoom, setMapZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Constants for better code clarity
  const ZOOM_SPEED = 0.001
  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 3
  const DRAG_SENSITIVITY = 0.1 // Reduces drag speed for smoother control

  // Handle mouse wheel for zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = -e.deltaY * ZOOM_SPEED
      setMapZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + zoomDelta)))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Handle mouse drag for panning
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      setMapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, mapOffset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    if (!worldMap) return

    // Calculate map bounds
    const tiles = Array.from(worldMap.tiles.values())
    if (tiles.length === 0) return

    const minX = Math.min(...tiles.map(t => t.x))
    const maxX = Math.max(...tiles.map(t => t.x))
    const minY = Math.min(...tiles.map(t => t.y))
    const maxY = Math.max(...tiles.map(t => t.y))

    // Include inclusive tile extents (+1) so edges render correctly
    const mapWidth = maxX - minX + 1
    const mapHeight = maxY - minY + 1
    const baseScale = Math.min(width / mapWidth, height / mapHeight) * 0.9
    const scale = baseScale * mapZoom

    const offsetX = (width - mapWidth * scale) / 2 + mapOffset.x * DRAG_SENSITIVITY
    const offsetY = (height - mapHeight * scale) / 2 + mapOffset.y * DRAG_SENSITIVITY

    // Helper to convert world coords to minimap coords
    const toMinimapX = (x: number) => (x - minX) * scale + offsetX
    const toMinimapY = (y: number) => (y - minY) * scale + offsetY

    // Draw terrain per-tile so the minimap better reflects the world
    tiles.forEach(tile => {
      const tx = toMinimapX(tile.x)
      const ty = toMinimapY(tile.y)
      let terrainColor = '#2a2a2a'
      switch (tile.type) {
        case 'grass':
          terrainColor = '#1f7a3a'
          break
        case 'stone':
          terrainColor = '#94a3b8'
          break
        case 'ore':
          terrainColor = '#a16207'
          break
        case 'water':
          terrainColor = '#2563eb'
          break
        case 'sand':
          terrainColor = '#eab308'
          break
        default:
          terrainColor = '#2a2a2a'
      }

      ctx.fillStyle = terrainColor
      ctx.fillRect(tx, ty, Math.max(1, scale), Math.max(1, scale))
    })

    // Draw resource deposits on top of terrain
    tiles.forEach(tile => {
      if (tile.resource) {
        const x = toMinimapX(tile.x)
        const y = toMinimapY(tile.y)
        ctx.fillStyle = tile.resource.type === 'iron' ? '#94a3b8' : '#f97316'
        ctx.fillRect(x, y, Math.max(2, scale), Math.max(2, scale))
      }
    })

    // Draw machines
    machines.forEach(machine => {
      const x = toMinimapX(machine.position.x)
      const y = toMinimapY(machine.position.y)
      
      // Color by type
      switch (machine.type) {
        case 'turret':
          ctx.fillStyle = '#ef4444'
          break
        case 'miner':
          ctx.fillStyle = '#fbbf24'
          break
        case 'assembler':
          ctx.fillStyle = '#4ade80'
          break
        default:
          ctx.fillStyle = '#60a5fa'
      }
      
      ctx.fillRect(x - 1, y - 1, 3, 3)
    })

    // Draw enemies
    enemies.forEach(enemy => {
      const x = toMinimapX(enemy.position.x)
      const y = toMinimapY(enemy.position.y)
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(x - 1, y - 1, 2, 2)
    })

    // Draw base position (prefer base machine position; fall back to player position)
    const baseMachine = machines.find(m => m.type === 'base' || m.isBase)
    const baseWorldX = baseMachine?.position?.x ?? currentPlayer?.position?.x ?? 0
    const baseWorldY = baseMachine?.position?.y ?? currentPlayer?.position?.y ?? 0
    const bx = toMinimapX(baseWorldX)
    const by = toMinimapY(baseWorldY)
    ctx.fillStyle = '#22c55e'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(bx, by, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)
  }, [machines, enemies, worldMap, currentPlayer, width, height, mapOffset, mapZoom])

  return (
    <div className="minimap-container" ref={containerRef} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <canvas ref={canvasRef} width={width} height={height} className="minimap-canvas" />
      <div className="minimap-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#22c55e' }} />
          <span>Base</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#60a5fa' }} />
          <span>Machines</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#dc2626' }} />
          <span>Enemies</span>
        </div>
      </div>
      <div className="minimap-controls">
        <span className="zoom-indicator">Zoom: {Math.round(mapZoom * 100)}%</span>
      </div>
    </div>
  )
}

export default Minimap
