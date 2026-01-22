import { useState, useEffect } from 'react'
import './Tooltips.css'

export interface TooltipData {
  id: string
  content: string
  x: number
  y: number
  type?: 'info' | 'warning' | 'error' | 'success'
}

interface TooltipsProps {
  tooltips: TooltipData[]
}

const Tooltips = ({ tooltips }: TooltipsProps) => {
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null)

  useEffect(() => {
    // Show the most recent tooltip
    if (tooltips.length > 0) {
      setActiveTooltip(tooltips[tooltips.length - 1])
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setActiveTooltip(null)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [tooltips])

  if (!activeTooltip) return null

  const typeClass = activeTooltip.type || 'info'

  return (
    <div
      className={`tooltip tooltip-${typeClass}`}
      style={{
        left: `${activeTooltip.x}px`,
        top: `${activeTooltip.y}px`,
      }}
    >
      <div className="tooltip-arrow" />
      <div className="tooltip-content">{activeTooltip.content}</div>
    </div>
  )
}

export default Tooltips

// Hook to manage tooltips
export const useTooltips = () => {
  const [tooltips, setTooltips] = useState<TooltipData[]>([])

  const showTooltip = (content: string, x: number, y: number, type?: TooltipData['type']) => {
    const id = `tooltip-${Date.now()}`
    setTooltips(prev => [...prev, { id, content, x, y, type }])
    
    setTimeout(() => {
      setTooltips(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }

  return { tooltips, showTooltip }
}
