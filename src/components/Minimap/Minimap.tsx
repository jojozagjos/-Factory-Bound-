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
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('showGrid')
      return v == null ? true : JSON.parse(v)
    } catch (e) {
      return true
    }
  })
  const [isDragging, setIsDragging] = useState(false)
  const mapOffsetRef = useRef(mapOffset)
  const mapZoomRef = useRef(mapZoom)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const pendingOffsetRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const size = Math.min(width, height)
  
  // Constants for better code clarity
  // - MIN_ZOOM is 1 so you can't zoom out smaller than the fit-to-map scale
  // - MAX_ZOOM is much larger to allow deep zoom-in for detail
  const ZOOM_SPEED = 0.002
  const MIN_ZOOM = 1.11
  const MAX_ZOOM = 20
  // Increase drag responsiveness so panning feels stronger
  const DRAG_SENSITIVITY = 1.2

  // Handle mouse wheel for zoom
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>
      setShowGrid(customEvent.detail)
      try { localStorage.setItem('showGrid', JSON.stringify(customEvent.detail)) } catch {}
    }
    window.addEventListener('toggleGrid', handleToggle)
    return () => window.removeEventListener('toggleGrid', handleToggle)
  }, [])

  // Clamp mapOffset so the map remains fully visible inside the square minimap
  const clampOffset = (offsetX: number, offsetY: number, mapWidth: number, mapHeight: number, scale: number) => {
    const contentW = mapWidth * scale
    const contentH = mapHeight * scale
    const minX = Math.min(0, size - contentW)
    const maxX = Math.max(0, size - contentW)
    const minY = Math.min(0, size - contentH)
    const maxY = Math.max(0, size - contentH)
    return {
      x: Math.max(minX, Math.min(offsetX, maxX)),
      y: Math.max(minY, Math.min(offsetY, maxY))
    }
  }

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const zoomDelta = -e.deltaY * ZOOM_SPEED
        setMapZoom(prev => {
          const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + zoomDelta))
          // If zoom reached the maximum, reset offsets to center the map
          if (next >= MAX_ZOOM) {
            const zero = { x: 0, y: 0 }
            mapOffsetRef.current = zero
            // update state immediately so render reflects centering
            setMapOffset(zero)
          }
          return next
        })
      }

      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }, [])

  // Handle mouse drag for panning
  // Attach listeners once; handlers use refs so we don't need to reattach on state changes.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use refs + requestAnimationFrame to throttle high-frequency mousemove updates
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      isDraggingRef.current = true
      dragStartRef.current = { x: e.clientX - mapOffsetRef.current.x, y: e.clientY - mapOffsetRef.current.y }
    }

    const scheduleOffsetUpdate = () => {
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (pendingOffsetRef.current) {
          mapOffsetRef.current = pendingOffsetRef.current
          setMapOffset(pendingOffsetRef.current)
          pendingOffsetRef.current = null
        }
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const next = { x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y }
      pendingOffsetRef.current = next
      scheduleOffsetUpdate()
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      isDraggingRef.current = false
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      pendingOffsetRef.current = null
    }

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Keep refs in sync when state changes (so rAF math uses latest values)
  useEffect(() => { mapOffsetRef.current = mapOffset }, [mapOffset])
  useEffect(() => { mapZoomRef.current = mapZoom }, [mapZoom])

  // Build an offscreen canvas cache for terrain when worldMap changes
  useEffect(() => {
    if (!worldMap) {
      offscreenRef.current = null
      return
    }

    const tiles = Array.from(worldMap.tiles.values())
    if (tiles.length === 0) {
      offscreenRef.current = null
      return
    }

    // Compute bounds
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i]
      if (t.x < minX) minX = t.x
      if (t.x > maxX) maxX = t.x
      if (t.y < minY) minY = t.y
      if (t.y > maxY) maxY = t.y
    }

    const mapWidth = Math.max(1, maxX - minX + 1)
    const mapHeight = Math.max(1, maxY - minY + 1)

    const offscreen = document.createElement('canvas')
    offscreen.width = mapWidth
    offscreen.height = mapHeight
    const octx = offscreen.getContext('2d')
    if (!octx) {
      offscreenRef.current = null
      return
    }

    // Draw terrain into offscreen at 1px per tile
    tiles.forEach(tile => {
      const tx = tile.x - minX
      const ty = tile.y - minY
      let terrainColor = '#2a2a2a'
      switch (tile.type) {
        case 'grass': terrainColor = '#1f7a3a'; break
        case 'stone': terrainColor = '#94a3b8'; break
        case 'ore': terrainColor = '#a16207'; break
        case 'water': terrainColor = '#2563eb'; break
        case 'sand': terrainColor = '#eab308'; break
        default: terrainColor = '#2a2a2a'
      }
      octx.fillStyle = terrainColor
      octx.fillRect(tx, ty, 1, 1)
    })

    // Draw resources as brighter pixels on top
    tiles.forEach(tile => {
      if (!tile.resource) return
      const x = tile.x - minX
      const y = tile.y - minY
      let resColor = '#94a3b8'
      switch (tile.resource.type) {
        case 'iron_ore': resColor = '#94a3b8'; break
        case 'copper_ore': resColor = '#f97316'; break
        case 'coal': resColor = '#27272a'; break
        case 'stone': resColor = '#78716c'; break
        default: resColor = '#a1a1aa'
      }
      octx.fillStyle = resColor
      octx.fillRect(x, y, 1, 1)
    })

    offscreenRef.current = offscreen
  }, [worldMap])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Force square canvas for a consistent minimap shape
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!worldMap) return

    // Calculate map bounds and dimensions
    const tiles = Array.from(worldMap.tiles.values())
    if (tiles.length === 0) return

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i]
      if (t.x < minX) minX = t.x
      if (t.x > maxX) maxX = t.x
      if (t.y < minY) minY = t.y
      if (t.y > maxY) maxY = t.y
    }

    const mapWidth = Math.max(1, maxX - minX + 1)
    const mapHeight = Math.max(1, maxY - minY + 1)
    const baseScale = Math.min(size / mapWidth, size / mapHeight) * 0.9
    const scale = baseScale * mapZoom

    // Base centering offsets inside the square
    let offsetX = (size - mapWidth * scale) / 2 + mapOffset.x * DRAG_SENSITIVITY
    let offsetY = (size - mapHeight * scale) / 2 + mapOffset.y * DRAG_SENSITIVITY

    // Clamp offsets so you can't drag the map fully out of view
    const clamped = clampOffset(offsetX, offsetY, mapWidth, mapHeight, scale)
    offsetX = clamped.x
    offsetY = clamped.y

    // If we have a cached offscreen terrain, draw it scaled. Otherwise fall back to per-tile draw.
    const offscreen = offscreenRef.current
    if (offscreen && offscreen.width > 0 && offscreen.height > 0) {
      ctx.drawImage(
        offscreen,
        0,
        0,
        offscreen.width,
        offscreen.height,
        offsetX,
        offsetY,
        mapWidth * scale,
        mapHeight * scale
      )
    } else {
      // fallback: per-tile draw
      tiles.forEach(tile => {
        const tx = (tile.x - minX) * scale + offsetX
        const ty = (tile.y - minY) * scale + offsetY
        let terrainColor = '#2a2a2a'
        switch (tile.type) {
          case 'grass': terrainColor = '#1f7a3a'; break
          case 'stone': terrainColor = '#94a3b8'; break
          case 'ore': terrainColor = '#a16207'; break
          case 'water': terrainColor = '#2563eb'; break
          case 'sand': terrainColor = '#eab308'; break
          default: terrainColor = '#2a2a2a'
        }
        ctx.fillStyle = terrainColor
        ctx.fillRect(tx, ty, Math.max(1, scale), Math.max(1, scale))
      })

      // resources on top
      tiles.forEach(tile => {
        if (tile.resource) {
          const x = (tile.x - minX) * scale + offsetX
          const y = (tile.y - minY) * scale + offsetY
          let resColor = '#94a3b8'
          switch (tile.resource.type) {
            case 'iron_ore': resColor = '#94a3b8'; break
            case 'copper_ore': resColor = '#f97316'; break
            case 'coal': resColor = '#27272a'; break
            case 'stone': resColor = '#78716c'; break
            default: resColor = '#a1a1aa'
          }
          ctx.fillStyle = resColor
          ctx.fillRect(x, y, Math.max(2, scale), Math.max(2, scale))
        }
      })
    }

    // Helper to convert world coords to minimap coords
    const toMinimapX = (x: number) => (x - minX) * scale + offsetX
    const toMinimapY = (y: number) => (y - minY) * scale + offsetY

    // Draw grid on minimap when the grid setting is active and zoomed far enough out
    const GRID_ZOOM_THRESHOLD = 0.9
    if (showGrid && scale <= GRID_ZOOM_THRESHOLD) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      // vertical lines
      for (let gx = 0; gx <= mapWidth; gx++) {
        const x = gx * scale + offsetX
        ctx.beginPath()
        ctx.moveTo(x, offsetY)
        ctx.lineTo(x, offsetY + mapHeight * scale)
        ctx.stroke()
      }
      // horizontal lines
      for (let gy = 0; gy <= mapHeight; gy++) {
        const y = gy * scale + offsetY
        ctx.beginPath()
        ctx.moveTo(offsetX, y)
        ctx.lineTo(offsetX + mapWidth * scale, y)
        ctx.stroke()
      }
    }

    // Draw machines (non-base)
    machines.forEach(machine => {
      if (machine.type === 'base' || machine.isBase) return
      const x = toMinimapX(machine.position.x)
      const y = toMinimapY(machine.position.y)
      switch (machine.type) {
        case 'turret': ctx.fillStyle = '#ef4444'; break
        case 'miner': ctx.fillStyle = '#fbbf24'; break
        case 'assembler': ctx.fillStyle = '#4ade80'; break
        default: ctx.fillStyle = '#60a5fa'
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

    // Draw base position only if a base machine exists
    const baseMachine = machines.find(m => m.type === 'base' || m.isBase)
    if (baseMachine) {
      const bx = toMinimapX(baseMachine.position.x)
      const by = toMinimapY(baseMachine.position.y)
      ctx.fillStyle = '#22c55e'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(bx, by, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

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
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#94a3b8' }} />
          <span>Iron Ore</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f97316' }} />
          <span>Copper Ore</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#27272a' }} />
          <span>Coal</span>
        </div>
      </div>
      <div className="minimap-controls">
        <span className="zoom-indicator">Zoom: {Math.round(mapZoom * 100)}%</span>
      </div>
    </div>
  )
}

export default Minimap
