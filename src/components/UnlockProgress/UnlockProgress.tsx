import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import './UnlockProgress.css'

const UnlockProgress = () => {
  const machineUnlocks = useGameStore(state => state.machineUnlocks)
  const resourceDeliveries = useGameStore(state => state.resourceDeliveries)
  const tracked = useGameStore(state => state.trackedUnlocks)
  const toggleTrack = useGameStore(state => state.toggleTrackUnlock)

  // Show only locked machines
  const lockedMachines = machineUnlocks.filter(u => !u.unlocked && u.requiredDeliveries.length > 0)

  if (lockedMachines.length === 0) {
    return null // All machines unlocked or nothing to show
  }

  // Sort by order/tier
  const sorted = [...lockedMachines].sort((a, b) => a.order - b.order)

  const trackedMachines = tracked
    .map(t => lockedMachines.find(l => l.machineType === t))
    .filter(Boolean) as typeof lockedMachines

  // Get machine icons/names
  const machineIcons: Record<string, string> = {
    miner: '⛏️',
    smelter: '🔥',
    assembler: '⚙️',
    storage: '📦',
    power_plant: '⚡',
    turret: '🔫',
  }

  const machineNames: Record<string, string> = {
    miner: 'Mining Drill',
    smelter: 'Furnace',
    assembler: 'Assembler',
    storage: 'Storage Chest',
    power_plant: 'Power Plant',
    turret: 'Gun Turret',
  }

  const [openManage, setOpenManage] = useState(false)

  const formatResourceName = (id: string) => {
    // Map known resource ids to friendly names
    const scienceMatch = id.match(/^science_pack_(\d+)$/)
    if (scienceMatch) {
      const n = parseInt(scienceMatch[1], 10)
      const roman = ['I','II','III','IV','V'][Math.max(0, n - 1)] || String(n)
      return `Science Pack ${roman}`
    }
    // Fallback: convert snake_case to Title Case
    return id.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }

  return (
    <div className="unlock-progress">
      <div className="unlock-header">
        <h3>🔒 Unlock Progress</h3>
        <button className="manage-unlocks" onClick={() => setOpenManage(true)}>Manage</button>
      </div>
      <div className="unlock-list">
        {(trackedMachines.length > 0 ? trackedMachines : sorted.slice(0, 3)).map(unlock => { // Show tracked or next 3 unlocks
          const icon = machineIcons[unlock.machineType] || '❓'
          const name = machineNames[unlock.machineType] || unlock.machineType

          return (
            <div key={unlock.machineType} className="unlock-item">
              <div className="unlock-machine">
                <span className="unlock-icon">{icon}</span>
                <span className="unlock-name">{name}</span>
              </div>
              <div className="unlock-requirements">
                {unlock.requiredDeliveries.map(required => {
                  const delivery = resourceDeliveries.find(d => d.itemName === required.name)
                  const delivered = delivery?.quantityDelivered || 0
                  const percentage = Math.min(100, (delivered / required.quantity) * 100)
                  const isMet = delivered >= required.quantity
                  const friendly = formatResourceName(required.name)

                  return (
                    <div key={required.name} className="requirement-item">
                      <div className="requirement-text">
                        <span className={isMet ? 'met' : ''}>{friendly} — </span>
                        <span className={isMet ? 'met' : ''}>{delivered} / {required.quantity}</span>
                      </div>
                      <div className="requirement-bar">
                        <div 
                          className={`requirement-fill ${isMet ? 'complete' : ''}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {openManage && (
        <div className="unlock-manage-modal">
          <div className="unlock-manage-panel">
            <div className="manage-header">
              <h3>Manage Tracked Unlocks</h3>
              <button onClick={() => setOpenManage(false)}>Close</button>
            </div>
            <div className="manage-list">
              {sorted.map(u => (
                <label key={u.machineType} className="manage-row">
                  <input
                    type="checkbox"
                    checked={tracked.includes(u.machineType)}
                    onChange={() => toggleTrack(u.machineType)}
                  />
                  <span className="manage-name">{machineNames[u.machineType] || u.machineType}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnlockProgress
