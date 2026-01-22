import { useEffect } from 'react'

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
  // Helper function to clamp camera position within world bounds
  const clampCamera = (newCamera: CameraState): CameraState => {
    if (!worldBounds) return newCamera
    
    const gridSize = 50
    const maxX = (worldBounds.width * gridSize) / 2
    const maxY = (worldBounds.height * gridSize) / 2
    const minX = -(worldBounds.width * gridSize) / 2
    const minY = -(worldBounds.height * gridSize) / 2
    
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
      // Right click or middle click for panning
      if (e.button === 2 || e.button === 1) {
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
        
        const newCamera = clampCamera({
          ...camera,
          x: camera.x - deltaX / camera.zoom,
          y: camera.y - deltaY / camera.zoom,
        })
        
        onCameraChange(newCamera)

        lastMousePos = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        isPanning = false
        canvas.style.cursor = 'default'
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const zoomSpeed = 0.001
      const zoomDelta = -e.deltaY * zoomSpeed
      const newZoom = Math.max(0.25, Math.min(4, camera.zoom + zoomDelta))

      // Zoom toward mouse position
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const worldX = (mouseX - canvas.width / 2) / camera.zoom + camera.x
      const worldY = (mouseY - canvas.height / 2) / camera.zoom + camera.y

      const newX = worldX - (mouseX - canvas.width / 2) / newZoom
      const newY = worldY - (mouseY - canvas.height / 2) / newZoom

      const newCamera = clampCamera({
        x: newX,
        y: newY,
        zoom: newZoom,
      })
      
      onCameraChange(newCamera)
    }

    // Prevent context menu on right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Keyboard controls for zoom only
    const handleKeyDown = (e: KeyboardEvent) => {
      const newCamera = { ...camera }

      switch (e.key) {
        case '=':
        case '+':
          newCamera.zoom = Math.min(4, camera.zoom * 1.1)
          onCameraChange(newCamera)
          break
        case '-':
        case '_':
          newCamera.zoom = Math.max(0.25, camera.zoom / 1.1)
          onCameraChange(newCamera)
          break
        case '0':
          // Reset camera
          onCameraChange({ x: 0, y: 0, zoom: 1 })
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
  }, [camera, onCameraChange, canvasRef])

  return null // This component doesn't render anything
}

export default CameraControls
