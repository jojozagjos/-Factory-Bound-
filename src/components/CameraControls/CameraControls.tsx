import { useEffect, useRef } from 'react'

export interface CameraState {
  x: number
  y: number
  zoom: number
}

interface CameraControlsProps {
  camera: CameraState
  onCameraChange: (camera: CameraState) => void
  canvasRef: React.RefObject<HTMLCanvasElement>
  worldBounds?: { width: number; height: number } // Optional world bounds for camera limiting
}

const CameraControls = ({ camera, onCameraChange, canvasRef, worldBounds }: CameraControlsProps) => {
  // Use refs to avoid recreating event listeners on every camera update
  const cameraRef = useRef(camera)
  const onCameraChangeRef = useRef(onCameraChange)
  const worldBoundsRef = useRef(worldBounds)

  // Update refs when props change
  useEffect(() => {
    cameraRef.current = camera
    onCameraChangeRef.current = onCameraChange
    worldBoundsRef.current = worldBounds
  }, [camera, onCameraChange, worldBounds])

  // Helper function to clamp camera position within world bounds
  const clampCamera = (newCamera: CameraState): CameraState => {
    const wb = worldBoundsRef.current
    const canvas = canvasRef.current
    if (!wb || !canvas) return newCamera

    const gridSize = 50
    const worldPxW = wb.width * gridSize
    const worldPxH = wb.height * gridSize

    // Camera.x/y represent world coordinates (pixels) with origin at top-left (0,0)
    // Clamp so the viewport (half-size in world pixels) stays within world bounds.
    const halfViewportW = canvas.width / (2 * newCamera.zoom)
    const halfViewportH = canvas.height / (2 * newCamera.zoom)

    // Compute unclamped min/max based on viewport half-size
    const rawMinX = halfViewportW
    const rawMaxX = worldPxW - halfViewportW
    const rawMinY = halfViewportH
    const rawMaxY = worldPxH - halfViewportH

    // If viewport is larger than world, lock to center
    let clampedX: number
    if (rawMinX >= rawMaxX) {
      clampedX = worldPxW / 2
    } else {
      clampedX = Math.max(rawMinX, Math.min(rawMaxX, newCamera.x))
    }

    let clampedY: number
    if (rawMinY >= rawMaxY) {
      clampedY = worldPxH / 2
    } else {
      clampedY = Math.max(rawMinY, Math.min(rawMaxY, newCamera.y))
    }

    return {
      ...newCamera,
      x: clampedX,
      y: clampedY,
    }
  }

  // Compute zoom that fits the entire world into the canvas
  const computeFitZoom = (): number | null => {
    const canvas = canvasRef.current
    const wb = worldBoundsRef.current
    if (!canvas || !wb) return null
    const gridSize = 50
    const worldPxW = wb.width * gridSize
    const worldPxH = wb.height * gridSize
    const fitZoom = Math.min(canvas.width / worldPxW, canvas.height / worldPxH)
    return fitZoom
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isPanning = false
    let lastMousePos = { x: 0, y: 0 }
    const PAN_SPEED = 1.6 // tuned pan speed

    // Throttle mousemove updates via requestAnimationFrame to reduce lag
    let rafScheduled = false
    let pendingDelta = { dx: 0, dy: 0 }

    const handleMouseDown = (e: MouseEvent) => {
      // Left click for panning
      if (e.button === 0) {
        isPanning = true
        lastMousePos = { x: e.clientX, y: e.clientY }
        canvas.style.cursor = 'grabbing'
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return

      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y

      // Accumulate pending deltas and schedule an RAF update
      pendingDelta.dx += deltaX
      pendingDelta.dy += deltaY
      lastMousePos = { x: e.clientX, y: e.clientY }

      if (!rafScheduled) {
        rafScheduled = true
        requestAnimationFrame(() => {
          rafScheduled = false
          const currentCamera = cameraRef.current
          const dx = pendingDelta.dx
          const dy = pendingDelta.dy
          pendingDelta = { dx: 0, dy: 0 }

          const newCamera = clampCamera({
            ...currentCamera,
            x: currentCamera.x - (dx / currentCamera.zoom) * PAN_SPEED,
            y: currentCamera.y - (dy / currentCamera.zoom) * PAN_SPEED,
          })

          onCameraChangeRef.current(newCamera)
        })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isPanning = false
        canvas.style.cursor = 'default'
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const currentCamera = cameraRef.current
    const zoomSpeed = 0.001
    const zoomDelta = -e.deltaY * zoomSpeed
    // Allow zooming out further to fit the whole map (min 0.05)
    const newZoom = Math.max(0.05, Math.min(8, currentCamera.zoom + zoomDelta))

      // Zoom toward mouse position
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const worldX = (mouseX - canvas.width / 2) / currentCamera.zoom + currentCamera.x
      const worldY = (mouseY - canvas.height / 2) / currentCamera.zoom + currentCamera.y

      const newX = worldX - (mouseX - canvas.width / 2) / newZoom
      const newY = worldY - (mouseY - canvas.height / 2) / newZoom

      const newCamera = clampCamera({
        x: newX,
        y: newY,
        zoom: newZoom,
      })
      
      onCameraChangeRef.current(newCamera)
    }

    // Prevent context menu on right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Keyboard controls for zoom only
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentCamera = cameraRef.current
      const newCamera = { ...currentCamera }

      switch (e.key) {
        case '=':
        case '+':
          newCamera.zoom = Math.min(4, currentCamera.zoom * 1.1)
          onCameraChangeRef.current(newCamera)
          break
        case '-':
        case '_':
          newCamera.zoom = Math.max(0.25, currentCamera.zoom / 1.1)
          onCameraChangeRef.current(newCamera)
          break
        case '0':
          // Reset camera: if worldBounds provided, center on world and fit-to-world; otherwise reset to origin
          const gridSize = 50
          if (worldBoundsRef.current) {
            const centerX = (worldBoundsRef.current.width * gridSize) / 2
            const centerY = (worldBoundsRef.current.height * gridSize) / 2
            const fitZoom = computeFitZoom() ?? 1
            onCameraChangeRef.current({ x: centerX, y: centerY, zoom: Math.max(0.05, fitZoom) })
          } else {
            onCameraChangeRef.current({ x: 0, y: 0, zoom: 1 })
          }
          break
        case 'f':
        case 'F':
          // Fit to world
          const fit = computeFitZoom()
          if (fit !== null) {
            const gridSizeF = 50
            const cx = (worldBoundsRef.current!.width * gridSizeF) / 2
            const cy = (worldBoundsRef.current!.height * gridSizeF) / 2
            onCameraChangeRef.current({ x: cx, y: cy, zoom: Math.max(0.05, fit) })
          }
          break
      }
    }

    // Double-click on canvas to fit-to-world
    const handleDoubleClick = () => {
      const fit = computeFitZoom()
      if (fit !== null) {
        const gridSizeF = 50
        const cx = (worldBoundsRef.current!.width * gridSizeF) / 2
        const cy = (worldBoundsRef.current!.height * gridSizeF) / 2
        onCameraChangeRef.current({ x: cx, y: cy, zoom: Math.max(0.05, fit) })
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', handleContextMenu)
    canvas.addEventListener('dblclick', handleDoubleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
      canvas.removeEventListener('dblclick', handleDoubleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvasRef])

  return null // This component doesn't render anything
}

export default CameraControls
