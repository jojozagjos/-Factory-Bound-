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
}

const CameraControls = ({ camera, onCameraChange, canvasRef }: CameraControlsProps) => {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isPanning = false
    let lastMousePos = { x: 0, y: 0 }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Middle mouse or shift+left click for panning
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
        
        onCameraChange({
          ...camera,
          x: camera.x + deltaX / camera.zoom,
          y: camera.y + deltaY / camera.zoom,
        })

        lastMousePos = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      isPanning = false
      canvas.style.cursor = 'default'
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

      onCameraChange({
        x: newX,
        y: newY,
        zoom: newZoom,
      })
    }

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      const panSpeed = 20
      const newCamera = { ...camera }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newCamera.x -= panSpeed / camera.zoom
          onCameraChange(newCamera)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          newCamera.x += panSpeed / camera.zoom
          onCameraChange(newCamera)
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          newCamera.y -= panSpeed / camera.zoom
          onCameraChange(newCamera)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          newCamera.y += panSpeed / camera.zoom
          onCameraChange(newCamera)
          break
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
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [camera, onCameraChange, canvasRef])

  return null // This component doesn't render anything
}

export default CameraControls
