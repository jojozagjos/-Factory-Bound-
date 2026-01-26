import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import CameraControls, { type CameraState } from '../CameraControls/CameraControls'
import type { MachineType } from '../../types/game'
import './GameCanvas.css'

const BASE_ICON = '🏭'
const BASE_ICON_FONT_SIZE = 24

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
  const [camera, setCamera] = useState<CameraState>(() => {
    // Calculate world center - will be updated when worldMap loads
    const gridSize = 50
    const worldWidth = 200 // Increased default world size
    const worldHeight = 200
    return {
      x: (worldWidth * gridSize) / 2,
      y: (worldHeight * gridSize) / 2,
      zoom: 1
    }
  })
  const cameraRef = useRef<CameraState>(camera)
  const [showGrid, setShowGrid] = useState(true)
  const animationTimeRef = useRef(0) // For belt animation
  const particlesRef = useRef<Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    color: string
    size: number
  }>>([]) // For particle effects
  const fullMapCacheRef = useRef<HTMLCanvasElement | null>(null)
  const machineCacheRef = useRef<HTMLCanvasElement | null>(null)
  const lod2MapCacheRef = useRef<HTMLCanvasElement | null>(null)
  const lod4MapCacheRef = useRef<HTMLCanvasElement | null>(null)
  const lod2MachineCacheRef = useRef<HTMLCanvasElement | null>(null)
  const lod4MachineCacheRef = useRef<HTMLCanvasElement | null>(null)
  const lastFrameRef = useRef<number>(0)
  const lodBlendAlpha = useRef<number>(1)

  // Update camera position when worldMap loads
  useEffect(() => {
    if (worldMap) {
      const gridSize = 50
      setCamera({
        x: (worldMap.width * gridSize) / 2,
        y: (worldMap.height * gridSize) / 2,
        zoom: 1
      })
    }
  }, [worldMap])

  // keep ref in sync when camera state changes
  useEffect(() => { cameraRef.current = camera }, [camera])

  // Build an offscreen low-resolution cache (1px per tile) for fast zoomed-out rendering
  useEffect(() => {
    if (!worldMap) {
      fullMapCacheRef.current = null
      lod2MapCacheRef.current = null
      lod4MapCacheRef.current = null
      return
    }

    const off = document.createElement('canvas')
    off.width = worldMap.width
    off.height = worldMap.height
    const ctx = off.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < worldMap.height; y++) {
      for (let x = 0; x < worldMap.width; x++) {
        const tile = worldMap.tiles.get(`${x},${y}`)
        let color = '#0a0a0a'
        if (tile) {
          switch (tile.type) {
            case 'water': color = '#2563eb'; break
            case 'grass': color = '#16a34a'; break
            case 'stone': color = '#71717a'; break
            case 'sand': color = '#eab308'; break
            default: color = '#0a0a0a'
          }
        }
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    }

    fullMapCacheRef.current = off
  }, [worldMap])

  // Build intermediate LOD cache at 2px per tile
  useEffect(() => {
    if (!worldMap) {
      lod2MapCacheRef.current = null
      return
    }

    const off = document.createElement('canvas')
    off.width = worldMap.width * 2
    off.height = worldMap.height * 2
    const ctx = off.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < worldMap.height; y++) {
      for (let x = 0; x < worldMap.width; x++) {
        const tile = worldMap.tiles.get(`${x},${y}`)
        let color = '#0a0a0a'
        if (tile) {
          switch (tile.type) {
            case 'water': color = '#2563eb'; break
            case 'grass': color = '#16a34a'; break
            case 'stone': color = '#71717a'; break
            case 'sand': color = '#eab308'; break
            default: color = '#0a0a0a'
          }
        }
        ctx.fillStyle = color
        ctx.fillRect(x * 2, y * 2, 2, 2)
      }
    }

    lod2MapCacheRef.current = off
  }, [worldMap])

  // Build intermediate LOD cache at 4px per tile
  useEffect(() => {
    if (!worldMap) {
      lod4MapCacheRef.current = null
      return
    }

    const off = document.createElement('canvas')
    off.width = worldMap.width * 4
    off.height = worldMap.height * 4
    const ctx = off.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < worldMap.height; y++) {
      for (let x = 0; x < worldMap.width; x++) {
        const tile = worldMap.tiles.get(`${x},${y}`)
        let color = '#0a0a0a'
        if (tile) {
          switch (tile.type) {
            case 'water': color = '#2563eb'; break
            case 'grass': color = '#16a34a'; break
            case 'stone': color = '#71717a'; break
            case 'sand': color = '#eab308'; break
            default: color = '#0a0a0a'
          }
        }
        ctx.fillStyle = color
        ctx.fillRect(x * 4, y * 4, 4, 4)
      }
    }

    lod4MapCacheRef.current = off
  }, [worldMap])

  // Pre-render a low-res machine layer (1px per tile) for fast LOD drawing
  useEffect(() => {
    if (!worldMap) {
      machineCacheRef.current = null
      lod2MachineCacheRef.current = null
      lod4MachineCacheRef.current = null
      return
    }

    const off = document.createElement('canvas')
    off.width = worldMap.width
    off.height = worldMap.height
    const ctx = off.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, off.width, off.height)
    ctx.imageSmoothingEnabled = false

    // Draw each machine as a 1px marker (color based on type)
    machines.forEach(m => {
      const x = m.position.x
      const y = m.position.y
      // Don't pre-render base marker if base hasn't been placed yet
      if (m.type === 'base' && (!m.baseEntrances || m.baseEntrances.length === 0)) return
      let col = '#ffffff'
      switch (m.type) {
        case 'base': col = '#ffd966'; break
        case 'miner': col = '#94a3b8'; break
        case 'smelter': col = '#f97316'; break
        case 'assembler': col = '#c084fc'; break
        case 'belt': col = '#cbd5e1'; break
        case 'turret': col = '#ef4444'; break
        default: col = '#d1d5db'
      }
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1, 1)
    })

    machineCacheRef.current = off
  }, [machines, worldMap])

  // Pre-render machine layer for 2px per tile
  useEffect(() => {
    if (!worldMap) {
      lod2MachineCacheRef.current = null
      return
    }

    const off = document.createElement('canvas')
    off.width = worldMap.width * 2
    off.height = worldMap.height * 2
    const ctx = off.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, off.width, off.height)
    ctx.imageSmoothingEnabled = false

    machines.forEach(m => {
      // Don't pre-render base marker if base hasn't been placed yet
      if (m.type === 'base' && (!m.baseEntrances || m.baseEntrances.length === 0)) return
      const x = m.position.x * 2
      const y = m.position.y * 2
      let col = '#ffffff'
      switch (m.type) {
        case 'base': col = '#ffd966'; break
        case 'miner': col = '#94a3b8'; break
        case 'smelter': col = '#f97316'; break
        case 'assembler': col = '#c084fc'; break
        case 'belt': col = '#cbd5e1'; break
        case 'turret': col = '#ef4444'; break
        default: col = '#d1d5db'
      }
      ctx.fillStyle = col
      ctx.fillRect(x, y, 2, 2)
    })

    lod2MachineCacheRef.current = off
  }, [machines, worldMap])

  // Pre-render machine layer for 4px per tile
  useEffect(() => {
    if (!worldMap) {
      lod4MachineCacheRef.current = null
      return
    }

    const off = document.createElement('canvas')
    off.width = worldMap.width * 4
    off.height = worldMap.height * 4
    const ctx = off.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, off.width, off.height)
    ctx.imageSmoothingEnabled = false

    machines.forEach(m => {
      // Don't pre-render base marker if base hasn't been placed yet
      if (m.type === 'base' && (!m.baseEntrances || m.baseEntrances.length === 0)) return
      const x = m.position.x * 4
      const y = m.position.y * 4
      let col = '#ffffff'
      switch (m.type) {
        case 'base': col = '#ffd966'; break
        case 'miner': col = '#94a3b8'; break
        case 'smelter': col = '#f97316'; break
        case 'assembler': col = '#c084fc'; break
        case 'belt': col = '#cbd5e1'; break
        case 'turret': col = '#ef4444'; break
        default: col = '#d1d5db'
      }
      ctx.fillStyle = col
      ctx.fillRect(x, y, 4, 4)
    })

    lod4MachineCacheRef.current = off
  }, [machines, worldMap])

  // Listen for grid toggle
  useEffect(() => {
    const handleGridToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>
      setShowGrid(customEvent.detail)
    }
    
    window.addEventListener('toggleGrid', handleGridToggle)
    return () => window.removeEventListener('toggleGrid', handleGridToggle)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let animationFrameId: number

      const LOD1_ZOOM = 0.6
      const LOD2_ZOOM = 0.85
      const LOD3_ZOOM = 1.0

      // Simple render loop
    const render = () => {
      // Frame rate cap depending on zoom (60fps normally, 30fps when using LOD caches)
      const now = performance.now()
      const delta = now - (lastFrameRef.current || now)
      const targetMs = cameraRef.current.zoom <= LOD3_ZOOM ? (1000 / 30) : (1000 / 60)
      if (delta < targetMs) {
        animationFrameId = requestAnimationFrame(render)
        return
      }
      lastFrameRef.current = now

      // Update animation time for belt animations
      animationTimeRef.current += delta / 1000

      // Smooth LOD blending: fade in when entering LOD, fade out when leaving
      const targetAlpha = cameraRef.current.zoom <= LOD3_ZOOM ? 1 : 0
      const blendSpeed = 0.1
      lodBlendAlpha.current += (targetAlpha - lodBlendAlpha.current) * blendSpeed

      const skipEffects = cameraRef.current.zoom <= LOD3_ZOOM
      // Update particles (skip heavy updates when zoomed out)
      if (!skipEffects) {
        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.05 // Gravity
          p.life -= 1
          return p.life > 0
        })
      }
      
      // Clear canvas completely
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      // Apply camera transform
      const cam = cameraRef.current
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(cam.zoom, cam.zoom)
      ctx.translate(-cam.x, -cam.y)

      const gridSize = 50

      // Calculate visible area for optimization
      let visibleLeft = 0
      let visibleRight = 0
      let visibleTop = 0
      let visibleBottom = 0

      // Draw world tiles (if map exists)
      if (worldMap) {
        const cam = cameraRef.current
        visibleLeft = Math.floor((cam.x - canvas.width / (2 * cam.zoom)) / gridSize) - 1
        visibleRight = Math.ceil((cam.x + canvas.width / (2 * cam.zoom)) / gridSize) + 1
        visibleTop = Math.floor((cam.y - canvas.height / (2 * cam.zoom)) / gridSize) - 1
        visibleBottom = Math.ceil((cam.y + canvas.height / (2 * cam.zoom)) / gridSize) + 1

        // Choose appropriate LOD cache based on zoom
        const cache = (cam.zoom <= LOD1_ZOOM
          ? fullMapCacheRef.current
          : cam.zoom <= LOD2_ZOOM
            ? lod2MapCacheRef.current
            : cam.zoom <= LOD3_ZOOM
              ? lod4MapCacheRef.current
              : null)
        const machineCache = (cam.zoom <= LOD1_ZOOM
          ? machineCacheRef.current
          : cam.zoom <= LOD2_ZOOM
            ? lod2MachineCacheRef.current
            : cam.zoom <= LOD3_ZOOM
              ? lod4MachineCacheRef.current
              : null)
        if (cache && lodBlendAlpha.current > 0.01) {
          ctx.imageSmoothingEnabled = false
          const worldPxW = worldMap.width * gridSize
          const worldPxH = worldMap.height * gridSize
          
          // Apply smooth blending opacity
          ctx.globalAlpha = lodBlendAlpha.current
          ctx.drawImage(cache, 0, 0, cache.width, cache.height, 0, 0, worldPxW, worldPxH)

          // Fast path: draw simplified machine layer (1px markers stretched)
          if (machineCache) {
            ctx.globalAlpha = 0.95 * lodBlendAlpha.current
            ctx.drawImage(machineCache, 0, 0, machineCache.width, machineCache.height, 0, 0, worldPxW, worldPxH)
          }
          ctx.globalAlpha = 1
        }
        
        // Draw full-detail tiles when not using cache or blending out
        if (!cache || lodBlendAlpha.current < 0.99) {
          // Draw only visible tiles
          for (let tileY = Math.max(0, visibleTop); tileY < Math.min(worldMap.height, visibleBottom); tileY++) {
            for (let tileX = Math.max(0, visibleLeft); tileX < Math.min(worldMap.width, visibleRight); tileX++) {
              const tile = worldMap.tiles.get(`${tileX},${tileY}`)
              if (!tile) continue

              const screenX = tile.x * gridSize
              const screenY = tile.y * gridSize

              // Draw tile with better colors
              switch (tile.type) {
                case 'water':
                  ctx.fillStyle = '#1e3a8a'
                  ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  // Add water texture
                  if (showGrid) {
                    ctx.fillStyle = '#2563eb'
                    ctx.fillRect(screenX + 2, screenY + 2, gridSize - 4, gridSize - 4)
                  } else {
                    ctx.fillStyle = '#2563eb'
                    ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  }
                  break
                case 'grass':
                  ctx.fillStyle = '#15803d'
                  ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  // Add grass texture
                  if (showGrid) {
                    ctx.fillStyle = '#16a34a'
                    ctx.fillRect(screenX + 1, screenY + 1, gridSize - 2, gridSize - 2)
                  } else {
                    ctx.fillStyle = '#16a34a'
                    ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  }
                  break
                case 'stone':
                  ctx.fillStyle = '#52525b'
                  ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  // Add stone texture
                  if (showGrid) {
                    ctx.fillStyle = '#71717a'
                    ctx.fillRect(screenX + 2, screenY + 2, gridSize - 4, gridSize - 4)
                  } else {
                    ctx.fillStyle = '#71717a'
                    ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  }
                  break
                case 'sand':
                  ctx.fillStyle = '#ca8a04'
                  ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  // Add sand texture
                  if (showGrid) {
                    ctx.fillStyle = '#eab308'
                    ctx.fillRect(screenX + 1, screenY + 1, gridSize - 2, gridSize - 2)
                  } else {
                    ctx.fillStyle = '#eab308'
                    ctx.fillRect(screenX, screenY, gridSize, gridSize)
                  }
                  break
                default:
                  ctx.fillStyle = '#1a1a1a'
                  ctx.fillRect(screenX, screenY, gridSize, gridSize)
              }

              // Draw resources with better visuals
              if (tile.resource) {
                const resourceSize = 12
                ctx.save()
                ctx.translate(screenX + gridSize / 2, screenY + gridSize / 2)
                
                if (tile.resource.type === 'iron_ore') {
                  // Iron ore - gray with darker outline
                  ctx.fillStyle = '#3f3f46'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize, 0, Math.PI * 2)
                  ctx.fill()
                  ctx.fillStyle = '#a1a1aa'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize - 3, 0, Math.PI * 2)
                  ctx.fill()
                } else if (tile.resource.type === 'copper_ore') {
                  // Copper ore - orange/brown
                  ctx.fillStyle = '#c2410c'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize, 0, Math.PI * 2)
                  ctx.fill()
                  ctx.fillStyle = '#f97316'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize - 3, 0, Math.PI * 2)
                  ctx.fill()
                } else if (tile.resource.type === 'coal') {
                  // Coal - black
                  ctx.fillStyle = '#000000'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize, 0, Math.PI * 2)
                  ctx.fill()
                  ctx.fillStyle = '#27272a'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize - 3, 0, Math.PI * 2)
                  ctx.fill()
                } else if (tile.resource.type === 'stone') {
                  // Stone - gray/brown
                  ctx.fillStyle = '#57534e'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize, 0, Math.PI * 2)
                  ctx.fill()
                  ctx.fillStyle = '#78716c'
                  ctx.beginPath()
                  ctx.arc(0, 0, resourceSize - 3, 0, Math.PI * 2)
                  ctx.fill()
                }
                
                ctx.restore()
              }
            }
          }
          
          // Apply inverse blending when transitioning to LOD
          if (cache && lodBlendAlpha.current < 0.99 && lodBlendAlpha.current > 0.01) {
            ctx.globalAlpha = 1 - lodBlendAlpha.current
            ctx.globalAlpha = 1
          }
        }
      }

      // Draw grid overlay (optional, for Builderment-style look)
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.lineWidth = 1 / cam.zoom
        for (let x = Math.max(0, visibleLeft); x <= Math.min(worldMap?.width || 0, visibleRight); x++) {
          ctx.beginPath()
          ctx.moveTo(x * gridSize, Math.max(0, visibleTop) * gridSize)
          ctx.lineTo(x * gridSize, Math.min(worldMap?.height || 0, visibleBottom) * gridSize)
          ctx.stroke()
        }
        for (let y = Math.max(0, visibleTop); y <= Math.min(worldMap?.height || 0, visibleBottom); y++) {
          ctx.beginPath()
          ctx.moveTo(Math.max(0, visibleLeft) * gridSize, y * gridSize)
          ctx.lineTo(Math.min(worldMap?.width || 0, visibleRight) * gridSize, y * gridSize)
          ctx.stroke()
        }
      }

      // Draw ghost building if in building mode
      if (buildingMode && ghostPosition) {
        const x = ghostPosition.x * gridSize
        const y = ghostPosition.y * gridSize
        
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
        const x = machine.position.x * gridSize
        const y = machine.position.y * gridSize

        // Draw machine based on type
        ctx.save()
        ctx.translate(x + gridSize / 2, y + gridSize / 2)
        ctx.rotate((machine.rotation * Math.PI) / 180)

        // Machine color by type
        let color = '#4a9eff' // Default blue
        let tierIndicator = ''
        switch (machine.type) {
          // Miners
          case 'miner':
            color = '#fbbf24'
            break
          case 'miner_t2':
            color = '#f59e0b'
            tierIndicator = 'II'
            break
          case 'miner_t3':
            color = '#d97706'
            tierIndicator = 'III'
            break
          
          // Smelters
          case 'smelter':
            color = '#f97316'
            break
          case 'steel_furnace':
            color = '#ea580c'
            tierIndicator = 'S'
            break
          case 'electric_furnace':
            color = '#dc2626'
            tierIndicator = 'E'
            break
          
          // Assemblers
          case 'assembler':
            color = '#4ade80'
            break
          case 'assembler_t2':
            color = '#22c55e'
            tierIndicator = 'II'
            break
          case 'assembler_t3':
            color = '#16a34a'
            tierIndicator = 'III'
            break
          
          // Belts
          case 'belt':
            color = '#94a3b8'
            break
          case 'fast_belt':
            color = '#ef4444'
            tierIndicator = 'F'
            break
          case 'express_belt':
            color = '#3b82f6'
            tierIndicator = 'E'
            break
          
          // Inserters
          case 'inserter':
            color = '#a78bfa'
            break
          case 'fast_inserter':
            color = '#8b5cf6'
            tierIndicator = 'F'
            break
          case 'stack_inserter':
            color = '#7c3aed'
            tierIndicator = 'S'
            break
          
          // Logistics
          case 'splitter':
            color = '#64748b'
            break
          case 'underground_belt':
            color = '#475569'
            break
          
          // Power
          case 'power_plant':
            color = '#8b5cf6'
            break
          case 'solar_panel':
            color = '#eab308'
            break
          case 'accumulator':
            color = '#06b6d4'
            break
          
          // Combat
          case 'turret':
            color = '#ef4444'
            break
          case 'laser_turret':
            color = '#ec4899'
            tierIndicator = 'L'
            break
          case 'wall':
            color = '#78716c'
            break
          
          // Special
          case 'storage':
            color = '#fbbf24'
            break
          case 'research_lab':
            color = '#06b6d4'
            break
          case 'base':
            color = '#10b981' // Green for base
            break
          default:
            color = '#4a9eff'
        }

        // Special rendering for base
        if (machine.type === 'base') {
          // Draw larger base structure (3x3 tiles)
          ctx.fillStyle = color
          ctx.fillRect(-gridSize * 1.5 + 5, -gridSize * 1.5 + 5, gridSize * 3 - 10, gridSize * 3 - 10)
          
          // Draw border
          ctx.strokeStyle = '#22c55e'
          ctx.lineWidth = 4
          ctx.strokeRect(-gridSize * 1.5 + 5, -gridSize * 1.5 + 5, gridSize * 3 - 10, gridSize * 3 - 10)
          
          // Draw entrances as smaller colored squares
          if (machine.baseEntrances) {
            machine.baseEntrances.forEach(entrance => {
              const relX = (entrance.x - machine.position.x) * gridSize
              const relY = (entrance.y - machine.position.y) * gridSize
              ctx.fillStyle = '#fbbf24'
              ctx.fillRect(relX - 10, relY - 10, 20, 20)
              ctx.strokeStyle = '#fff'
              ctx.lineWidth = 2
              ctx.strokeRect(relX - 10, relY - 10, 20, 20)
            })
          }
          
          // Draw base icon/text
          ctx.fillStyle = '#fff'
          ctx.font = `${BASE_ICON_FONT_SIZE}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(BASE_ICON, 0, 0)
        } 
        // Special rendering for belts with animation
        else if (machine.type === 'belt' || machine.type === 'fast_belt' || machine.type === 'express_belt') {
          ctx.fillStyle = color
          ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)
          
          // Animated belt lines
          const beltSpeed = machine.type === 'express_belt' ? 3 : machine.type === 'fast_belt' ? 2 : 1
          const lineSpacing = 8
          const offset = (animationTimeRef.current * beltSpeed * 20) % lineSpacing
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 2
          for (let i = -gridSize / 2; i < gridSize / 2; i += lineSpacing) {
            ctx.beginPath()
            ctx.moveTo(-gridSize / 2 + 8, i + offset)
            ctx.lineTo(gridSize / 2 - 8, i + offset)
            ctx.stroke()
          }
          
          // Tier indicator
          if (tierIndicator) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(tierIndicator, gridSize / 2 - 12, -gridSize / 2 + 12)
          }
        }
        // Special rendering for smelters with smoke particles
        else if (machine.type === 'smelter' || machine.type === 'steel_furnace' || machine.type === 'electric_furnace') {
          ctx.fillStyle = color
          ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)
          
          // Emit smoke particles occasionally
          if (Math.random() < 0.05) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY - gridSize / 2,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -1 - Math.random() * 0.5,
              life: 60,
              maxLife: 60,
              color: machine.type === 'electric_furnace' ? '#06b6d4' : '#78716c',
              size: 4 + Math.random() * 4
            })
          }
          
          // Tier indicator
          if (tierIndicator) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(tierIndicator, gridSize / 2 - 12, -gridSize / 2 + 12)
          }
        } 
        else {
          // Normal machine rendering
          ctx.fillStyle = color
          ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)
          
          // Draw tier indicator for upgraded machines
          if (tierIndicator) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(tierIndicator, gridSize / 2 - 12, -gridSize / 2 + 12)
          }
        }

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

      // Draw enemies (simplified at LOD)
      enemies.forEach(enemy => {
        const x = enemy.position.x * gridSize
        const y = enemy.position.y * gridSize

        if (cam.zoom <= LOD3_ZOOM) {
          // Simplified enemy marker when zoomed out
          ctx.fillStyle = '#ef4444'
          ctx.fillRect(x - 4, y - 4, 8, 8)
          return
        }

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

      // Draw projectiles (simplified at LOD)
      projectiles.forEach(projectile => {
        const x = projectile.position.x * gridSize
        const y = projectile.position.y * gridSize

        if (cam.zoom <= LOD3_ZOOM) {
          ctx.fillStyle = '#fbbf24'
          ctx.fillRect(x - 2, y - 2, 4, 4)
          return
        }

        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw particles (skip when zoomed out)
      if (!skipEffects) {
        particlesRef.current.forEach(particle => {
          ctx.save()
          const alpha = particle.life / particle.maxLife
          ctx.globalAlpha = alpha
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        })
      }

      // Restore canvas state
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [machines, enemies, projectiles, worldMap, selectedMachine, buildingMode, ghostPosition, showGrid])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert screen coords to world coords, accounting for camera
    const gridSize = 50
    const worldX = (x - canvas.width / 2) / camera.zoom + camera.x
    const worldY = (y - canvas.height / 2) / camera.zoom + camera.y
    const gridX = Math.floor(worldX / gridSize)
    const gridY = Math.floor(worldY / gridSize)

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

    // Convert screen coords to world coords, accounting for camera
    const gridSize = 50
    const worldX = (x - canvas.width / 2) / camera.zoom + camera.x
    const worldY = (y - canvas.height / 2) / camera.zoom + camera.y
    const gridX = Math.floor(worldX / gridSize)
    const gridY = Math.floor(worldY / gridSize)

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
        worldBounds={worldMap ? { width: worldMap.width, height: worldMap.height } : undefined}
      />
    </>
  )
}

export default GameCanvas
