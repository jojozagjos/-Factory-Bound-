import { useState } from 'react'
import { MachineType } from '../../types/game'
import { useGameStore } from '../../store/gameStore'
import { BuildingSystem } from '../../systems/BuildingSystem'
import './BuildMenu.css'

interface BuildMenuProps {
  onClose: () => void
  onSelectBuilding: (type: MachineType) => void
}

interface BuildingCategory {
  name: string
  icon: string
  buildings: MachineType[]
}

const BuildMenu = ({ onClose, onSelectBuilding }: BuildMenuProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('logistics')
  const { isMachineUnlocked, recentUnlocks, markUnlockSeen } = useGameStore(state => ({
    isMachineUnlocked: state.isMachineUnlocked,
    recentUnlocks: state.recentUnlocks,
    markUnlockSeen: state.markUnlockSeen,
  }))
  const buildingSystem = new BuildingSystem()

  const categories: BuildingCategory[] = [
    {
      name: 'logistics',
      icon: '🚚',
      buildings: ['belt' as MachineType, 'inserter' as MachineType, 'storage' as MachineType],
    },
    {
      name: 'production',
      icon: '🏭',
      buildings: ['miner' as MachineType, 'smelter' as MachineType, 'assembler' as MachineType],
    },
    {
      name: 'power',
      icon: '⚡',
      buildings: ['power_plant' as MachineType],
    },
    {
      name: 'defense',
      icon: '🛡️',
      buildings: ['turret' as MachineType],
    },
  ]

  const buildingIcons: Partial<Record<MachineType, string>> = {
    belt: '↔️',
    inserter: '↪️',
    storage: '📦',
    miner: '⛏️',
    smelter: '🔥',
    assembler: '⚙️',
    power_plant: '⚡',
    turret: '🔫',
    base: '🏭',
  }

  const buildingNames: Partial<Record<MachineType, string>> = {
    belt: 'Transport Belt',
    inserter: 'Inserter',
    storage: 'Storage Chest',
    miner: 'Mining Drill',
    smelter: 'Furnace',
    assembler: 'Assembler',
    power_plant: 'Power Plant',
    turret: 'Gun Turret',
    base: 'Base',
  }

  const currentCategory = categories.find(c => c.name === selectedCategory)

  const handleSelectBuilding = (type: MachineType) => {
    if (recentUnlocks.includes(type)) {
      markUnlockSeen(type)
    }
    // Emit custom event to set building mode on canvas
    window.dispatchEvent(new CustomEvent('setBuildingMode', { detail: type }))
    onSelectBuilding(type)
    onClose()
  }

  return (
    <div className="build-menu-overlay" onClick={onClose}>
      <div className="build-menu" onClick={(e) => e.stopPropagation()}>
        <div className="build-menu-header">
          <h2>🏗️ Build Menu</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close build menu"
          >
            ✕
          </button>
        </div>

        <div className="build-menu-content">
          <div className="build-categories">
            {categories.map(category => (
              <button
                key={category.name}
                className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>

          <div className="build-items">
            {currentCategory?.buildings.map(buildingType => {
              const cost = buildingSystem.getBuildingCost(buildingType)
              const isUnlocked = isMachineUnlocked(buildingType)
              const isLocked = !isUnlocked || cost?.requiredTech !== undefined
              const isNewUnlock = isUnlocked && recentUnlocks.includes(buildingType)

              return (
                <div
                  key={buildingType}
                  className={`build-item ${isLocked ? 'locked' : ''} ${isNewUnlock ? 'new' : ''}`}
                  onClick={() => !isLocked && handleSelectBuilding(buildingType)}
                >
                  {isNewUnlock && <span className="new-badge">New</span>}
                  <div className="build-item-icon">
                    {buildingIcons[buildingType]}
                  </div>
                  <div className="build-item-info">
                    <h3>{buildingNames[buildingType]}</h3>
                    <div className="build-item-costs">
                      {cost?.costs.map((item, idx) => (
                        <span key={idx} className="cost-item">
                          {item.name.replace('_', ' ')}: {item.quantity}
                        </span>
                      ))}
                    </div>
                    {isLocked && (
                      <div className="locked-badge">
                        🔒 {cost?.requiredTech ? `Requires: ${cost.requiredTech}` : 'Deliver resources to unlock'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="build-menu-footer">
          <div className="build-menu-hint">
            💡 Click a building to select it for placement
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuildMenu
