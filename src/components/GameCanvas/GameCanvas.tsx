import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import CameraControls, { type CameraState } from '../CameraControls/CameraControls'
import type { MachineType } from '../../types/game'
import { BuildingSystem } from '../../systems/BuildingSystem'
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
  const buildingMode = useGameStore(state => state.buildingMode)
  const setBuildingMode = useGameStore(state => state.setBuildingMode)
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const lastPlaceError = useGameStore(state => state.lastPlaceError)
  const [buildingRotation, setBuildingRotation] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)
  const [previewCost, setPreviewCost] = useState<number | null>(null)
  const [ghostPath, setGhostPath] = useState<Array<{ x: number; y: number }> | null>(null)
  const [lastDragAxis, setLastDragAxis] = useState<'x' | 'y' | null>(null)
  // Removed automatic snap-to-ore behavior; placement must be exact
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
  const resourceCacheRef = useRef<HTMLCanvasElement | null>(null)
  const buildingSystem = useRef<BuildingSystem | null>(null)

  if (!buildingSystem.current) buildingSystem.current = new BuildingSystem()

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

  // Build an offscreen low-resolution cache (1px per tile) for fast zoomed-out rendering
  useEffect(() => {
    if (!worldMap) {
      fullMapCacheRef.current = null
      resourceCacheRef.current = null
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

    // Build resource overlay cache
    const res = document.createElement('canvas')
    res.width = worldMap.width
    res.height = worldMap.height
    const rctx = res.getContext('2d')
    if (rctx) {
      rctx.imageSmoothingEnabled = false
      for (let y = 0; y < worldMap.height; y++) {
        for (let x = 0; x < worldMap.width; x++) {
          const tile = worldMap.tiles.get(`${x},${y}`)
          if (tile && tile.resource) {
            let resourceColor = '#a1a1aa'
            switch (tile.resource.type) {
              case 'iron_ore': resourceColor = '#94a3b8'; break
              case 'copper_ore': resourceColor = '#f97316'; break
              case 'coal': resourceColor = '#27272a'; break
              case 'stone': resourceColor = '#78716c'; break
            }
            rctx.fillStyle = resourceColor
            rctx.fillRect(x, y, 1, 1)
          }
        }
      }
      resourceCacheRef.current = res
    }
  }, [worldMap])

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

    // Simple render loop
    const render = () => {
      const LOD_ZOOM = 0.6
      // Update animation time for belt animations
      animationTimeRef.current += 0.016 // ~60fps

      const skipEffects = camera.zoom <= LOD_ZOOM
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
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(camera.zoom, camera.zoom)
      ctx.translate(-camera.x, -camera.y)

      const gridSize = 50

      // Calculate visible area for optimization
      let visibleLeft = 0
      let visibleRight = 0
      let visibleTop = 0
      let visibleBottom = 0

      // Draw world tiles (if map exists)
      if (worldMap) {
        visibleLeft = Math.floor((camera.x - canvas.width / (2 * camera.zoom)) / gridSize) - 1
        visibleRight = Math.ceil((camera.x + canvas.width / (2 * camera.zoom)) / gridSize) + 1
        visibleTop = Math.floor((camera.y - canvas.height / (2 * camera.zoom)) / gridSize) - 1
        visibleBottom = Math.ceil((camera.y + canvas.height / (2 * camera.zoom)) / gridSize) + 1

        const LOD_ZOOM = 0.6 // below this zoom, use low-res cached rendering
        const cache = fullMapCacheRef.current
        const resCache = resourceCacheRef.current
        if (cache && camera.zoom <= LOD_ZOOM) {
          ctx.imageSmoothingEnabled = false
          const worldPxW = worldMap.width * gridSize
          const worldPxH = worldMap.height * gridSize
          ctx.drawImage(cache, 0, 0, cache.width, cache.height, 0, 0, worldPxW, worldPxH)
          if (resCache) {
            ctx.save()
            ctx.globalAlpha = 0.6
            ctx.drawImage(resCache, 0, 0, resCache.width, resCache.height, 0, 0, worldPxW, worldPxH)
            ctx.restore()
          }
        } else {
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
        }
      }

      // Draw grid overlay (optional, for Builderment-style look)
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.lineWidth = 1 / camera.zoom
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
            // Draw footprint depending on building type. Use same centering/translation
            // as machine rendering so the ghost lines up with the grid exactly.
            if (buildingMode === 'research_lab') {
              // Check validity for 3x3 area
              let valid = true
              for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                  const gx = ghostPosition.x + dx
                  const gy = ghostPosition.y + dy
                  if (!worldMap) { valid = false; break }
                  if (gx < 0 || gy < 0 || gx >= worldMap.width || gy >= worldMap.height) { valid = false; break }
                  const tile = worldMap.tiles.get(`${gx},${gy}`)
                  if (tile?.type === 'water') { valid = false; break }
                  const collides = machines.some(m => m.position.x === gx && m.position.y === gy)
                  if (collides) { valid = false; break }
                }
                if (!valid) break
              }

              // Draw 3x3 ghost centered on the grid cell using same translate center
              const baseX = ghostPosition.x * gridSize
              const baseY = ghostPosition.y * gridSize
              ctx.save()
              ctx.translate(baseX + gridSize / 2, baseY + gridSize / 2)
              ctx.globalAlpha = 0.45
              ctx.fillStyle = valid ? '#22c55e' : '#ef4444'
              ctx.fillRect(-gridSize * 1.5 + 5, -gridSize * 1.5 + 5, gridSize * 3 - 10, gridSize * 3 - 10)
              ctx.restore()
            } else {
              const norm = normalizePlacementType(buildingMode)
              // If dragging a belt, render the ghostPath list
              if (norm === 'belt' && ghostPath && ghostPath.length > 0) {
                ctx.globalAlpha = 0.55
                for (let i = 0; i < ghostPath.length; i++) {
                  const p = ghostPath[i]
                  const vx = p.x * gridSize
                  const vy = p.y * gridSize
                  const valid = buildingSystem.current ? buildingSystem.current.canPlaceAt(p, worldMap!, machines, buildingMode) : true
                  ctx.save()
                  ctx.translate(vx + gridSize / 2, vy + gridSize / 2)
                  ctx.fillStyle = valid ? '#4a9eff' : '#ef4444'
                  ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)

                  // Draw small arrow indicating flow to next tile
                  const next = ghostPath[i + 1] || null
                  let rot = 0
                  if (next) {
                    const dx = next.x - p.x
                    const dy = next.y - p.y
                    if (Math.abs(dx) >= Math.abs(dy)) {
                      rot = dx > 0 ? 0 : 180
                    } else {
                      rot = dy > 0 ? 90 : 270
                    }
                  } else {
                    // end piece: use previous tile
                    const prev = ghostPath[i - 1] || p
                    const dx = p.x - prev.x
                    const dy = p.y - prev.y
                    if (Math.abs(dx) >= Math.abs(dy)) {
                      rot = dx > 0 ? 0 : 180
                    } else {
                      rot = dy > 0 ? 90 : 270
                    }
                  }

                  ctx.save()
                  ctx.rotate((rot * Math.PI) / 180)
                  ctx.fillStyle = '#111'
                  ctx.strokeStyle = '#fff'
                  ctx.lineWidth = 2
                  ctx.beginPath()
                  ctx.moveTo(-6, 0)
                  ctx.lineTo(gridSize / 2 - 10, 0)
                  ctx.stroke()
                  ctx.beginPath()
                  ctx.moveTo(gridSize / 2 - 14, -8)
                  ctx.lineTo(gridSize / 2 - 6, 0)
                  ctx.lineTo(gridSize / 2 - 14, 8)
                  ctx.fill()
                  ctx.restore()
                  ctx.restore()
                }
                ctx.globalAlpha = 1
              } else {
                const x = ghostPosition.x * gridSize
                const y = ghostPosition.y * gridSize
                const valid = buildingSystem.current ? buildingSystem.current.canPlaceAt(ghostPosition, worldMap!, machines, buildingMode) : true
                ctx.save()
                ctx.translate(x + gridSize / 2, y + gridSize / 2)
                ctx.globalAlpha = 0.5
                ctx.fillStyle = valid ? '#4a9eff' : '#ef4444'
                ctx.fillRect(-gridSize / 2 + 5, -gridSize / 2 + 5, gridSize - 10, gridSize - 10)
                // If miner or extractor and ghost here, draw output arrow indicating direction
                const norm2 = normalizePlacementType(buildingMode)
                if (norm2 === 'miner') {
                  const angle = (buildingRotation * Math.PI) / 180
                  ctx.save()
                  ctx.rotate(angle)
                  ctx.fillStyle = '#111'
                  ctx.strokeStyle = '#fff'
                  ctx.lineWidth = 2
                  // Arrow shaft
                  ctx.beginPath()
                  ctx.moveTo(8, 0)
                  ctx.lineTo(gridSize / 2 - 8, 0)
                  ctx.stroke()
                  // Arrow head
                  ctx.beginPath()
                  ctx.moveTo(gridSize / 2 - 12, -8)
                  ctx.lineTo(gridSize / 2 - 4, 0)
                  ctx.lineTo(gridSize / 2 - 12, 8)
                  ctx.fill()
                  ctx.restore()
                }
                ctx.restore()
              }
            }
          }

      // Update vehicle routes (boats/trains following waypoints)
      const updateVehicleRoute = (machine: any) => {
        if (!machine.route || !machine.route.isActive) return
        
        const waypointIds = machine.route.waypointIds
        if (waypointIds.length === 0) return
        
        // Get current waypoint
        let currentIndex = Math.max(0, Math.min(machine.route.currentWaypointIndex, waypointIds.length - 1))
        const currentWaypointId = waypointIds[currentIndex]
        const targetWaypoint = machines.find(m => m.id === currentWaypointId)
        
        if (!targetWaypoint) return
        
        // Calculate distance to waypoint
        const dx = targetWaypoint.position.x - machine.position.x
        const dy = targetWaypoint.position.y - machine.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Vehicle speed (adjust based on machine type)
        let speed = 0.05
        if (machine.type.includes('boat_')) {
          const tierStr = machine.type.split('_')[1]
          speed = 0.03 + (parseInt(tierStr) || 1) * 0.015
        } else if (machine.type.includes('train_')) {
          const tierStr = machine.type.split('_')[1]
          speed = 0.04 + (parseInt(tierStr) || 1) * 0.02
        }
        
        // Update progress
        if (!machine.routeProgress) machine.routeProgress = 0
        machine.routeProgress += speed
        
        // Move towards waypoint
        if (distance > 0.1) {
          const moveX = (dx / distance) * speed * gridSize * 0.5
          const moveY = (dy / distance) * speed * gridSize * 0.5
          machine.position.x += moveX / gridSize
          machine.position.y += moveY / gridSize
        }
        
        // Check if reached waypoint
        if (distance < 0.5) {
          machine.routeProgress = 0
          currentIndex += 1
          
          // Handle route completion
          if (currentIndex >= waypointIds.length) {
            if (machine.route.loop) {
              machine.route.currentWaypointIndex = 0
            } else {
              machine.route.isActive = false
            }
          } else {
            machine.route.currentWaypointIndex = currentIndex
          }
        }
      }
      
      // Update all vehicles with routes
      machines.forEach(machine => {
        if (machine.route && (machine.type.includes('boat_') || machine.type.includes('train_'))) {
          updateVehicleRoute(machine)
        }
      })

      // Draw route paths for selected vehicles
      if (selectedMachine && (selectedMachine.type.includes('boat_') || selectedMachine.type.includes('train_'))) {
        if (selectedMachine.route && selectedMachine.route.waypointIds.length > 0) {
          ctx.save()
          ctx.strokeStyle = selectedMachine.type.includes('boat_') ? '#2563eb' : '#8b5cf6'
          ctx.lineWidth = 2 / camera.zoom
          ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom])
          
          const waypoints = selectedMachine.route.waypointIds
            .map(id => machines.find(m => m.id === id))
            .filter(m => m !== undefined)
          
          // Draw path connecting waypoints
          if (waypoints.length > 0) {
            ctx.beginPath()
            ctx.moveTo(selectedMachine.position.x * gridSize + gridSize / 2, selectedMachine.position.y * gridSize + gridSize / 2)
            waypoints.forEach(wp => {
              ctx.lineTo(wp!.position.x * gridSize + gridSize / 2, wp!.position.y * gridSize + gridSize / 2)
            })
            if (selectedMachine.route.loop) {
              ctx.lineTo(selectedMachine.position.x * gridSize + gridSize / 2, selectedMachine.position.y * gridSize + gridSize / 2)
            }
            ctx.stroke()
            
            // Draw waypoint markers
            waypoints.forEach((wp, idx) => {
              ctx.fillStyle = idx === selectedMachine.route!.currentWaypointIndex ? '#fbbf24' : '#94a3b8'
              ctx.beginPath()
              ctx.arc(wp!.position.x * gridSize + gridSize / 2, wp!.position.y * gridSize + gridSize / 2, 6 / camera.zoom, 0, Math.PI * 2)
              ctx.fill()
            })
          }
          
          ctx.setLineDash([])
          ctx.restore()
        }
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
          // Boats
          case 'boat_1':
          case 'boat_2':
          case 'boat_3':
          case 'boat_4':
            color = '#0ea5e9'
            tierIndicator = machine.type.split('_')[1]
            break
          // Trains
          case 'train_1':
          case 'train_2':
          case 'train_3':
          case 'train_4':
            color = '#8b5cf6'
            tierIndicator = machine.type.split('_')[1]
            break
          // Stations
          case 'dock_station':
            color = '#06b6d4'
            break
          case 'rail_station':
            color = '#7c3aed'
            break
          default:
            color = '#4a9eff'
        }

        // Special rendering for research_lab (formerly base)
        if (machine.type === 'research_lab') {
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
        // Special rendering for boats
        else if (machine.type.includes('boat_')) {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.ellipse(0, 0, gridSize / 2.2, gridSize / 3, 0, 0, Math.PI * 2)
          ctx.fill()
          
          // Boat deck
          ctx.fillStyle = '#0e7490'
          ctx.fillRect(-gridSize / 3, -gridSize / 6, gridSize * 2 / 3, gridSize / 3)
          
          // Emit water splash particles
          if (machine.route && machine.route.isActive && Math.random() < 0.08) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY,
              vx: (Math.random() - 0.5) * 1.5,
              vy: Math.random() * 0.5 - 0.3,
              life: 40,
              maxLife: 40,
              color: '#2563eb',
              size: 2 + Math.random() * 3
            })
          }
          
          // Tier indicator
          if (tierIndicator) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(tierIndicator, 0, -gridSize / 4)
          }
        }
        // Special rendering for trains
        else if (machine.type.includes('train_')) {
          // Train car
          ctx.fillStyle = color
          ctx.fillRect(-gridSize * 0.4, -gridSize / 3, gridSize * 0.8, gridSize * 2 / 3)
          
          // Train wheels
          ctx.fillStyle = '#1a1a1a'
          ctx.beginPath()
          ctx.arc(-gridSize * 0.25, gridSize / 3, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(gridSize * 0.25, gridSize / 3, 4, 0, Math.PI * 2)
          ctx.fill()
          
          // Emit train smoke particles
          if (machine.route && machine.route.isActive && Math.random() < 0.12) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY - gridSize * 0.4,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -1.2 - Math.random() * 0.6,
              life: 80,
              maxLife: 80,
              color: '#78716c',
              size: 3 + Math.random() * 5
            })
          }
          
          // Tier indicator
          if (tierIndicator) {
            ctx.fillStyle = '#fff'
            ctx.font = 'bold 10px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(tierIndicator, 0, -gridSize / 5)
          }
        }
        // Special rendering for stations
        else if (machine.type === 'dock_station') {
          ctx.fillStyle = color
          ctx.fillRect(-gridSize * 1.2, -gridSize * 1.2, gridSize * 2.4, gridSize * 2.4)
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 2
          ctx.strokeRect(-gridSize * 1.2, -gridSize * 1.2, gridSize * 2.4, gridSize * 2.4)
          
          // Dock symbol
          ctx.fillStyle = '#fff'
          ctx.font = '18px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('⚓', 0, 0)
          
          // Activity indicator - pulsing animation
          const dockPulse = Math.sin(animationTimeRef.current * 2) * 0.5 + 0.5
          ctx.fillStyle = `rgba(6, 182, 212, ${dockPulse * 0.6})`
          ctx.fillRect(-gridSize * 0.8, -gridSize * 1.3, gridSize * 1.6, gridSize * 0.3)
          
          // Emit dock loading particles occasionally
          if (Math.random() < 0.04) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
              life: 30,
              maxLife: 30,
              color: '#06b6d4',
              size: 2 + Math.random() * 2
            })
          }
        }
        else if (machine.type === 'rail_station') {
          ctx.fillStyle = color
          ctx.fillRect(-gridSize * 1.2, -gridSize * 1.2, gridSize * 2.4, gridSize * 2.4)
          ctx.strokeStyle = '#7c3aed'
          ctx.lineWidth = 2
          ctx.strokeRect(-gridSize * 1.2, -gridSize * 1.2, gridSize * 2.4, gridSize * 2.4)
          
          // Rail symbol
          ctx.fillStyle = '#fff'
          ctx.font = '18px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('🛤️', 0, 0)
          
          // Activity indicator - pulsing animation
          const stationPulse = Math.sin(animationTimeRef.current * 2) * 0.5 + 0.5
          ctx.fillStyle = `rgba(124, 58, 237, ${stationPulse * 0.6})`
          ctx.fillRect(-gridSize * 0.8, -gridSize * 1.3, gridSize * 1.6, gridSize * 0.3)
          
          // Emit station loading particles occasionally
          if (Math.random() < 0.04) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
              life: 30,
              maxLife: 30,
              color: '#7c3aed',
              size: 2 + Math.random() * 2
            })
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

        // Emit activity particles for machines based on type
        const machineTypeStr = typeof machine.type === 'string' ? machine.type : ''
        if (machineTypeStr.includes('assembler')) {
          // Assembler crafting sparks
          if (Math.random() < 0.06) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              life: 40,
              maxLife: 40,
              color: '#fbbf24',
              size: 2 + Math.random() * 2.5
            })
          }
        } else if (machineTypeStr.includes('power_plant') || machineTypeStr.includes('coal')) {
          // Power generation flame particles
          if (Math.random() < 0.05) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY - gridSize * 0.3,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -0.8 - Math.random() * 0.5,
              life: 50,
              maxLife: 50,
              color: Math.random() > 0.5 ? '#f97316' : '#fbbf24',
              size: 3 + Math.random() * 3
            })
          }
        } else if (machineTypeStr.includes('lab') || machineTypeStr.includes('research')) {
          // Research lab glow particles
          if (Math.random() < 0.04) {
            const worldX = machine.position.x * gridSize + gridSize / 2
            const worldY = machine.position.y * gridSize + gridSize / 2
            particlesRef.current.push({
              x: worldX,
              y: worldY,
              vx: (Math.random() - 0.5) * 1,
              vy: (Math.random() - 0.5) * 1,
              life: 35,
              maxLife: 35,
              color: '#06b6d4',
              size: 1.5 + Math.random() * 2
            })
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

      // Draw enemies
      enemies.forEach(enemy => {
        const x = enemy.position.x * gridSize
        const y = enemy.position.y * gridSize

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
        const x = projectile.position.x * gridSize
        const y = projectile.position.y * gridSize

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

      // Restore canvas state back to screen coords
      ctx.restore()

      // Draw in-canvas HUD-styled overlay for build cancel hint
      if (buildingMode) {
        try {
          ctx.save()
          // ensure screen coords
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          const paddingX = 12
          const paddingY = 8
          const text = 'Right-click or Escape to cancel build'
          ctx.font = '13px Arial'
          const metrics = ctx.measureText(text)
          const textWidth = metrics.width
          const boxWidth = textWidth + paddingX * 2
          const boxHeight = 20 + paddingY
          const margin = 18
          const x = canvas.width - boxWidth - margin
          const y = canvas.height - boxHeight - margin

          // Background
          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          const radius = 8
          ctx.beginPath()
          ctx.moveTo(x + radius, y)
          ctx.arcTo(x + boxWidth, y, x + boxWidth, y + boxHeight, radius)
          ctx.arcTo(x + boxWidth, y + boxHeight, x, y + boxHeight, radius)
          ctx.arcTo(x, y + boxHeight, x, y, radius)
          ctx.arcTo(x, y, x + boxWidth, y, radius)
          ctx.closePath()
          ctx.fill()

          // Text
          ctx.fillStyle = '#ffffff'
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'left'
          ctx.fillText(text, x + paddingX, y + boxHeight / 2)
        } finally {
          ctx.restore()
        }
      }

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
  }, [machines, enemies, projectiles, worldMap, selectedMachine, buildingMode, ghostPosition, camera, showGrid])

  // Allow cancelling build mode with Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && buildingMode) {
        setBuildingMode(null)
        setGhostPosition(null)
      }
      if ((e.key === 'r' || e.key === 'R') && buildingMode) {
        setBuildingRotation(prev => (prev + 90) % 360)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [buildingMode, setBuildingMode])

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
      // Local validation to provide immediate, descriptive feedback
      const validateLocal = (type: MachineType, pos: { x: number; y: number }) => {
        if (!worldMap) return { ok: false, reason: 'No world loaded' }
        // research_lab (formerly base) is 3x3
        if (type === 'research_lab') {
          const offsets = [-1, 0, 1]
          for (const dx of offsets) {
            for (const dy of offsets) {
              const p = { x: pos.x + dx, y: pos.y + dy }
              if (p.x < 0 || p.y < 0 || p.x >= worldMap.width || p.y >= worldMap.height) return { ok: false, reason: 'Base must be fully inside the map' }
              const tile = worldMap.tiles.get(`${p.x},${p.y}`)
              if (tile?.type === 'water') return { ok: false, reason: 'Base cannot be placed on water' }
              const collides = machines.some(m => m.position.x === p.x && m.position.y === p.y)
              if (collides) return { ok: false, reason: 'Base collides with existing machine' }
            }
          }
          return { ok: true }
        }

        // single-tile placement rules
        const tile = worldMap.tiles.get(`${pos.x},${pos.y}`)
        if (!tile) return { ok: false, reason: 'Invalid tile' }
        if (tile.type === 'water') return { ok: false, reason: 'Cannot build on water' }
        // miner (or extractor types) must be on resource
        const normType = normalizePlacementType(type)
        if (normType === 'miner' && !tile.resource) return { ok: false, reason: 'Miner/Extractor must be placed on a tile containing ore' }
        // collision
        const collides = machines.some(m => m.position.x === pos.x && m.position.y === pos.y)
        if (collides) return { ok: false, reason: 'Tile is occupied' }
        return { ok: true }
      }

      const localCheck = validateLocal(buildingMode, { x: gridX, y: gridY })
      if (!localCheck.ok) {
        setPlaceError(localCheck.reason ?? 'Cannot place building')
        console.log('Local placement validation failed:', localCheck.reason, { buildingMode, gridX, gridY, ghostPosition })
        window.setTimeout(() => setPlaceError(null), 2500)
        return
      }

      const placePos = { x: gridX, y: gridY }
      const success = placeMachine(buildingMode, placePos, buildingRotation)
      if (success) {
        setBuildingMode(null)
        setGhostPosition(null)
      } else {
        setPlaceError('Cannot place building — check console for details')
        window.setTimeout(() => setPlaceError(null), 2500)
      }
      return
    }

    // Find clicked machine
    const clickedMachine = machines.find(
      m => m.position.x === gridX && m.position.y === gridY
    )

    selectMachine(clickedMachine?.id ?? null)
  }

  const normalizePlacementType = (t: any) => {
    if (!t) return t
    const s = String(t)
    if (s === 'miner' || s.startsWith('extractor') || s.includes('miner')) return 'miner'
    if (s.startsWith('belt') || s.includes('belt')) return 'belt'
    return s
  }

  const getLine = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const out: { x: number; y: number }[] = []
    if (a.x === b.x) {
      const minY = Math.min(a.y, b.y)
      const maxY = Math.max(a.y, b.y)
      for (let y = minY; y <= maxY; y++) out.push({ x: a.x, y })
    } else if (a.y === b.y) {
      const minX = Math.min(a.x, b.x)
      const maxX = Math.max(a.x, b.x)
      for (let x = minX; x <= maxX; x++) out.push({ x, y: a.y })
    } else {
      // Not straight — return start for safety
      out.push({ x: a.x, y: a.y })
    }
    return out
  }

  const getBeltPath = (start: { x: number; y: number }, end: { x: number; y: number }, preferHorizontalFirst?: boolean) => {
    if (start.x === end.x || start.y === end.y) {
      return getLine(start, end)
    }

    const dx = Math.abs(end.x - start.x)
    const dy = Math.abs(end.y - start.y)
    let horizontalFirst = typeof preferHorizontalFirst === 'boolean' ? preferHorizontalFirst : dx >= dy

    // If equal distances, prefer last drag axis if available
    if (dx === dy && lastDragAxis) horizontalFirst = lastDragAxis === 'x'

    const corner = horizontalFirst ? { x: end.x, y: start.y } : { x: start.x, y: end.y }
    const seg1 = getLine(start, corner)
    const seg2 = getLine(corner, end)

    // Merge but avoid double-counting the corner
    return [...seg1, ...seg2.slice(1)]
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
    // Update drag preview positions if dragging
    if (isDragging && dragStart) {
      // compute last drag axis
      const prev = dragCurrent || dragStart
      const axis = Math.abs(gridX - prev.x) >= Math.abs(gridY - prev.y) ? 'x' : 'y'
      setLastDragAxis(axis)
      setDragCurrent({ x: gridX, y: gridY })

      // If building a belt, compute Manhattan L-shaped path
      const norm = normalizePlacementType(buildingMode)
      if (norm === 'belt') {
        const path = getBeltPath(dragStart, { x: gridX, y: gridY }, axis === 'x')
        setGhostPath(path)
      }
    }

    // Compute preview cost and required items for single placement or drag (belts)
    try {
      const costObj = buildingSystem.current?.getBuildingCost(buildingMode as any)
      if (costObj) {
        let total = costObj.price || 0
        if (isDragging && dragStart && (ghostPath && ghostPath.length > 0)) {
          const count = ghostPath.length
          total = (costObj.price || 0) * count
        } else if (isDragging && dragStart && dragCurrent) {
          const dx = Math.abs(dragCurrent.x - dragStart.x)
          const dy = Math.abs(dragCurrent.y - dragStart.y)
          const count = Math.max(dx, dy) + 1
          total = (costObj.price || 0) * count
        } else {
          total = costObj.price || 0
        }
        setPreviewCost(total)
      } else {
        setPreviewCost(null)
      }
    } catch (err) {
      setPreviewCost(null)
    }

    // No snap behavior: ghost follows cursor and placement must be exactly on ore tile
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!buildingMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const gridSize = 50
    const worldX = (x - canvas.width / 2) / camera.zoom + camera.x
    const worldY = (y - canvas.height / 2) / camera.zoom + camera.y
    const gridX = Math.floor(worldX / gridSize)
    const gridY = Math.floor(worldY / gridSize)

    // Start drag only for belt-type placements
    const norm = normalizePlacementType(buildingMode)
    if (norm === 'belt') {
      setIsDragging(true)
      setDragStart({ x: gridX, y: gridY })
      setDragCurrent({ x: gridX, y: gridY })
    }
  }

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!buildingMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const gridSize = 50
    const worldX = (x - canvas.width / 2) / camera.zoom + camera.x
    const worldY = (y - canvas.height / 2) / camera.zoom + camera.y
    const gridX = Math.floor(worldX / gridSize)
    const gridY = Math.floor(worldY / gridSize)

    // If we were dragging belts, place multiple
    if (isDragging && dragStart) {
      const start = dragStart
      const end = { x: gridX, y: gridY }
      // Choose positions using Manhattan L-shape path for belts (same as preview)
      const norm = normalizePlacementType(buildingMode)
      let positions: { x: number; y: number }[] = []
      if (norm === 'belt') {
        positions = getBeltPath(start, end, lastDragAxis === 'x')
      } else {
        // Fallback to straight interpolation for other drag-placements
        const dx = end.x - start.x
        const dy = end.y - start.y
        const steps = Math.max(Math.abs(dx), Math.abs(dy))
        for (let i = 0; i <= steps; i++) {
          const ix = start.x + Math.round((dx * i) / steps)
          const iy = start.y + Math.round((dy * i) / steps)
          positions.push({ x: ix, y: iy })
        }
      }

      // Check costs (cash + item resources) before placing
      const costObj = buildingSystem.current?.getBuildingCost(buildingMode as any)
      const player = useGameStore.getState().currentPlayer
      if (!player) {
        setPlaceError('No player state')
        window.setTimeout(() => setPlaceError(null), 2500)
      } else if (!costObj) {
        setPlaceError('No cost information available')
        window.setTimeout(() => setPlaceError(null), 2500)
      } else {
        const totalPrice = (costObj.price || 0) * positions.length
        const store = useGameStore.getState()
        const usingShared = store.session?.mode === 'coop'
        const playerCash = player.cash || 0
        const cashAvailable = usingShared ? (store.sharedCash || 0) : playerCash

        // Aggregate required item counts
        const requiredItems: Record<string, number> = {};
        ;(costObj.costs || []).forEach((it: any) => {
          const name = String(it.name || it.item || it.id || '')
          const qty = Number(it.quantity || it.qty || 0) || 0
          if (!name || qty <= 0) return
          requiredItems[name] = (requiredItems[name] || 0) + qty * positions.length
        })

        const missingItems: string[] = []
        Object.entries(requiredItems).forEach(([name, qty]) => {
          const have = player.inventory.find(i => i.name === name)?.quantity || 0
          if (have < qty) missingItems.push(`${name} (${have}/${qty})`)
        })

        if (missingItems.length) {
          setPlaceError(`Missing resources: ${missingItems.join(', ')}`)
          window.setTimeout(() => setPlaceError(null), 4000)
        } else if (totalPrice > cashAvailable) {
          setPlaceError(`Insufficient cash: need $${totalPrice}`)
          window.setTimeout(() => setPlaceError(null), 2500)
        } else {
          // Deduct items and cash, then place belts with proper rotation per tile
          // Deduct items from player inventory via removeFromInventory
          Object.entries(requiredItems).forEach(([name, qty]) => store.removeFromInventory(name, qty))
          if (costObj.price) {
            const amount = costObj.price * positions.length
            if (usingShared) {
              const s = useGameStore.getState()
              s.sharedCash = (s.sharedCash || 0) - amount
            } else {
              const s = useGameStore.getState()
              s.currentPlayer && (s.currentPlayer.cash = (s.currentPlayer.cash || 0) - amount)
            }
          }

          // Deduplicate positions (avoid double-placing the corner) while preserving order
          const seen = new Set<string>()
          const uniqPositions: { x: number; y: number }[] = []
          positions.forEach(p => {
            const k = `${p.x},${p.y}`
            if (!seen.has(k)) {
              seen.add(k)
              uniqPositions.push(p)
            }
          })

          // Place each belt with rotation computed from outgoing vector (next tile when possible)
          for (let i = 0; i < uniqPositions.length; i++) {
            const pos = uniqPositions[i]
            const prev = i > 0 ? uniqPositions[i - 1] : null
            const nextPos = i < uniqPositions.length - 1 ? uniqPositions[i + 1] : null

            // Determine orientation: prefer outgoing direction (next), otherwise use incoming (from prev)
            let dx = 0
            let dy = 0
            if (nextPos) {
              dx = nextPos.x - pos.x
              dy = nextPos.y - pos.y
            } else if (prev) {
              dx = pos.x - prev.x
              dy = pos.y - prev.y
            }

            let rot = 0
            if (Math.abs(dx) >= Math.abs(dy)) {
              rot = dx > 0 ? 0 : 180
            } else {
              rot = dy > 0 ? 90 : 270
            }

            placeMachine(buildingMode as any, pos, rot)
          }
        }
      }

      // Clear drag state
      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
      setPreviewCost(null)
      return
    }
  }

  // Clear ghost when buildingMode is turned off from elsewhere
  useEffect(() => {
    if (!buildingMode) setGhostPosition(null)
  }, [buildingMode])

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onContextMenu={(e) => { e.preventDefault(); if (buildingMode) { setBuildingMode(null); setGhostPosition(null); } }}
        aria-label="Game world canvas"
        style={{ cursor: buildingMode ? 'crosshair' : 'default' }}
      />
      <CameraControls
        camera={camera}
        onCameraChange={setCamera}
        canvasRef={canvasRef}
        worldBounds={worldMap ? { width: worldMap.width, height: worldMap.height } : undefined}
        isBuilding={!!buildingMode}
      />
      {placeError && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 28, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 13, zIndex: 3000 }}>
          {placeError}
        </div>
      )}

      {lastPlaceError && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 28, width: 480, background: 'rgba(0,0,0,0.9)', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 13, zIndex: 3000 }}>
          <strong>Cannot place building:</strong>
          <div style={{ marginTop: 6 }}>{lastPlaceError.message}</div>
          {lastPlaceError.details && (
            <pre style={{ whiteSpace: 'pre-wrap', color: '#ddd', marginTop: 8, fontSize: 12 }}>{JSON.stringify(lastPlaceError.details, null, 2)}</pre>
          )}
        </div>
      )}
      {/* Placement cost preview */}
      {buildingMode && previewCost !== null && (
        <div style={{ position: 'fixed', right: 24, bottom: 24, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 13, zIndex: 3000 }}>
          Estimated cost: <strong>${previewCost}</strong>
        </div>
      )}
      {/* In-canvas overlay replaces the fixed div tooltip for build cancel hint */}
    </>
  )
}

export default GameCanvas
