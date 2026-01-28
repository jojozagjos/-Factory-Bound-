import { useState } from 'react'
import { MachineType } from '../../types/game'
import { useGameStore } from '../../store/gameStore'
import { BuildingSystem } from '../../systems/BuildingSystem'
import { useMemo } from 'react'
import { buildermentProgression } from '../../data/buildermentProgression'
import './BuildMenu.css'

interface BuildMenuProps {
  onClose: () => void
  onSelectBuilding: (type: MachineType) => void
}

interface BuildingCategory {
  name: string
  icon: string
  buildings: string[]
}

const BuildMenu = ({ onClose, onSelectBuilding }: BuildMenuProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('logistics')
  const { isMachineUnlocked, recentUnlocks, markUnlockSeen } = useGameStore(state => ({
    isMachineUnlocked: state.isMachineUnlocked,
    recentUnlocks: state.recentUnlocks,
    markUnlockSeen: state.markUnlockSeen
  }))
  const setBuildingMode = useGameStore(state => state.setBuildingMode)
  const buildingSystem = new BuildingSystem()

  // build categories dynamically from progression data so IDs match exactly
  const categories: BuildingCategory[] = useMemo(() => {
    const groups: Record<string, string[]> = {}
    // Group machines by base id (strip trailing numeric tier suffixes like _1/_2)
    const lowestTierMap: Record<string, any> = {}
    buildermentProgression.machines.forEach(m => {
      const base = m.id.replace(/_\d+$/, '')
      if (!lowestTierMap[base] || (m.tier && m.tier < lowestTierMap[base].tier)) {
        lowestTierMap[base] = m
      }
    })

    Object.values(lowestTierMap).forEach((m: any) => {
      const cat = m.category || 'misc'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(m.id)
    })

    // Ensure `research_lab` is present in the menu so players can place the lab.
    if (!Object.values(groups).some(arr => arr.includes('research_lab'))) {
      if (!groups['special']) groups['special'] = []
      if (!groups['special'].includes('research_lab')) groups['special'].unshift('research_lab')
    }

    const order = ['extraction', 'crafting', 'transport', 'transport_infrastructure', 'transport_station', 'power', 'storage', 'special', 'logic', 'misc']

    const built: BuildingCategory[] = order
      .filter(o => groups[o])
      .map(o => ({ name: o, icon: o === 'extraction' ? '⛏️' : o === 'crafting' ? '🏭' : o === 'transport' ? '🚚' : '✨', buildings: groups[o] }))

    Object.keys(groups).forEach(k => {
      if (!built.find(b => b.name === k)) built.push({ name: k, icon: '🔧', buildings: groups[k] })
    })

    return built
  }, [])

  // Quick lookup map for machine display names/descriptions
  const machineMap = useMemo(() => {
    const map: Record<string, any> = {}
    buildermentProgression.machines.forEach(m => { map[m.id] = m })
    return map
  }, [])

  const buildingIcons: Partial<Record<string, string>> = {
    belt: '↔️',
    fast_belt: '⤴️',
    
    express_belt: '⚡',
    inserter: '↪️',
    fast_inserter: '⤴️',
    stack_inserter: '📤',
    splitter: '🔀',
    storage: '📦',
    miner: '⛏️',
    smelter: '🔥',
    assembler: '⚙️',
    assembler_t2: '⚙️',
    assembler_t3: '⚙️',
    power_plant: '⚡',
    solar_panel: '🔆',
    accumulator: '🔋',
    turret: '🔫',
    laser_turret: '🔆',
    // base icon removed; use research_lab
    rail: '🛤️',
    rail_station: '🚉',
    dock_station: '⚓',
    boat_1: '🛶',
    boat_2: '⛴️',
    boat_3: '🚢',
    boat_4: '🛳️',
    train_1: '🚆',
    train_2: '🚂',
    train_3: '🚄',
    train_4: '🚅',
    research_lab: '🔬',
    gold_vault: '🏦',
  }

  const buildingNames: Partial<Record<string, string>> = {
    belt: 'Belt T1',
    fast_belt: 'Belt T2',
    express_belt: 'Belt T3',
    inserter: 'Inserter',
    fast_inserter: 'Fast Inserter',
    stack_inserter: 'Stack Inserter',
    splitter: 'Splitter',
    storage: 'Storage Chest',
    miner: 'Miner',
    miner_t2: 'Miner T2',
    miner_t3: 'Miner T3',
    smelter: 'Smelter',
    assembler: 'Assembler',
    assembler_t2: 'Assembler T2',
    assembler_t3: 'Assembler T3',
    power_plant: 'Power Plant',
    solar_panel: 'Solar Panel',
    accumulator: 'Accumulator',
    turret: 'Turret',
    laser_turret: 'Laser Turret',
    // base name removed; use research_lab
    rail: 'Rail',
    rail_station: 'Rail Station',
    dock_station: 'Dock Station',
    boat_1: 'Boat T1',
    boat_2: 'Boat T2',
    boat_3: 'Boat T3',
    boat_4: 'Boat T4',
    train_1: 'Train T1',
    train_2: 'Train T2',
    train_3: 'Train T3',
    train_4: 'Train T4',
    research_lab: 'Research Lab',
    gold_vault: 'Gold Vault',
  }

  const currentCategory = categories.find(c => c.name === selectedCategory)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({ text: '', x: 0, y: 0, visible: false })

  const buildingTooltips: Partial<Record<string, string>> = {
    miner: 'Miner: must be placed on a tile containing ore.',
    miner_t2: 'Upgraded miner: faster extraction.',
    smelter: 'Smelter: converts ore into plates; place near miners or belts.',
    assembler: 'Assembler: crafts items from inputs on belts or chests.',
    belt: 'Belt T1: moves items along the grid.',
    fast_belt: 'Belt T2: faster transport.',
    express_belt: 'Belt T3: high-speed transport.',
    inserter: 'Inserter: moves items between belts and machines.',
    fast_inserter: 'Fast Inserter: moves items faster.',
    stack_inserter: 'Stack Inserter: moves multiple items at once.',
    storage: 'Storage Chest: holds items for later use.',
    power_plant: 'Power Plant: provides power; requires space and resources.',
    solar_panel: 'Solar Panel: passive power; place in open areas.',
    accumulator: 'Accumulator: stores excess power for peaks.',
    rail: 'Rail: place rail tracks to allow trains to move.',
    rail_station: 'Rail Station: load/unload trains.',
    dock_station: 'Dock Station: load/unload boats.',
    boat_1: 'Boat: water transport vehicle.',
    train_1: 'Train: rail transport vehicle.',
    research_lab: 'Research Lab: used for research and progression.',
    // base tooltip removed; research_lab tooltip used instead
  }

  const handleSelectBuilding = (type: MachineType) => {
    if (recentUnlocks.includes(type)) {
      markUnlockSeen(type)
    }
    // Set building mode in the global store so canvas and other UI respond
    setBuildingMode(type)
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
              // Allow players to place the starting research lab even if it's not part of the unlock progression
              const isUnlocked = buildingType === 'research_lab' ? true : isMachineUnlocked(buildingType as any)
              const isLocked = !isUnlocked || cost?.requiredTech !== undefined
              const isNewUnlock = isUnlocked && recentUnlocks.includes(buildingType as any)

              return (
                <div
                  key={buildingType}
                  className={`build-item ${isLocked ? 'locked' : ''} ${isNewUnlock ? 'new' : ''}`}
                  onClick={() => !isLocked && handleSelectBuilding(buildingType as any)}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect()
                    const x = rect.left + rect.width / 2
                    const y = rect.top - 8
                    const prog = machineMap[buildingType]
                    const text = prog ? `${prog.display_name} — Tier ${prog.tier} • ${prog.category || ''}` : (buildingTooltips[buildingType] || buildingNames[buildingType] || buildingType)
                    setTooltip({ text, x, y, visible: true })
                  }}
                  onMouseMove={(e) => setTooltip(t => ({ ...t, x: e.clientX + 12, y: e.clientY + 8 }))}
                  onMouseLeave={() => setTooltip({ text: '', x: 0, y: 0, visible: false })}
                >
                  {isNewUnlock && <span className="new-badge">New</span>}
                    <div className="build-item-icon" title={machineMap[buildingType]?.display_name || buildingNames[buildingType] || buildingType}>
                      {buildingIcons[buildingType] || (buildingNames[buildingType] ? buildingNames[buildingType].charAt(0) : buildingType.charAt(0))}
                    </div>
                  <div className="build-item-info">
                    <h3>{buildingNames[buildingType] || buildingType}</h3>
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
                    {tooltip.visible && (
                      <div className="build-tooltip" style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, zIndex: 1200 }}>
                        {tooltip.text}
                      </div>
                    )}
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
