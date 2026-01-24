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
    if (!worldBoundsRef.current) return newCamera
    
    const gridSize = 50
    const maxX = (worldBoundsRef.current.width * gridSize) / 2
    const maxY = (worldBoundsRef.current.height * gridSize) / 2
    const minX = -(worldBoundsRef.current.width * gridSize) / 2
    const minY = -(worldBoundsRef.current.height * gridSize) / 2
    
    // Add padding based on zoom to prevent seeing edges
    const padding = 200 / newCamera.zoom
    
    return {
      ...newCamera,
      x: Math.max(minX + padding, Math.min(maxX - padding, newCamera.x)),
      y: Math.max(minY + padding, Math.min(maxY - padding, newCamera.y)),
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isPanning = false
    let lastMousePos = { x: 0, y: 0 }

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
      if (isPanning) {
        const deltaX = e.clientX - lastMousePos.x
        const deltaY = e.clientY - lastMousePos.y
        
        const currentCamera = cameraRef.current
        const newCamera = clampCamera({
          ...currentCamera,
          x: currentCamera.x - deltaX / currentCamera.zoom,
          y: currentCamera.y - deltaY / currentCamera.zoom,
        })
        
        onCameraChangeRef.current(newCamera)

        lastMousePos = { x: e.clientX, y: e.clientY }
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
      const newZoom = Math.max(0.25, Math.min(4, currentCamera.zoom + zoomDelta))

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
          // Reset camera: if worldBounds provided, center on world; otherwise reset to origin
          const gridSize = 50
          const centerX = worldBoundsRef.current ? (worldBoundsRef.current.width * gridSize) / 2 : 0
          const centerY = worldBoundsRef.current ? (worldBoundsRef.current.height * gridSize) / 2 : 0
          onCameraChangeRef.current({ x: centerX, y: centerY, zoom: 1 })
          break
      }
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvasRef])

  return null // This component doesn't render anything
}

export default CameraControls
