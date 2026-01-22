import { useGameStore } from '../../store/gameStore'
import './TechTree.css'

interface TechTreeProps {
  onClose: () => void
}

const TechTree = ({ onClose }: TechTreeProps) => {
  const techTree = useGameStore(state => state.techTree)
  const unlockTech = useGameStore(state => state.unlockTech)

  const paradigms = ['logistics', 'production', 'power', 'combat', 'research']
  
  const getTechsByParadigm = (paradigm: string) => {
    return techTree.filter(tech => tech.paradigm === paradigm)
  }

  const paradigmIcons: Record<string, string> = {
    logistics: '🚚',
    production: '🏭',
    power: '⚡',
    combat: '🛡️',
    research: '🔬',
  }

  const handleResearch = (techId: string) => {
    unlockTech(techId)
  }

  return (
    <div className="tech-tree-overlay" onClick={onClose}>
      <div className="tech-tree" onClick={(e) => e.stopPropagation()}>
        <div className="tech-tree-header">
          <h2>🔬 Technology Tree</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close tech tree"
          >
            ✕
          </button>
        </div>

        <div className="tech-tree-content">
          {paradigms.map(paradigm => {
            const techs = getTechsByParadigm(paradigm)
            if (techs.length === 0) return null

            return (
              <div key={paradigm} className="tech-paradigm">
                <div className="paradigm-header">
                  <span className="paradigm-icon">{paradigmIcons[paradigm]}</span>
                  <h3>{paradigm}</h3>
                </div>
                
                <div className="tech-nodes">
                  {techs.map(tech => (
                    <div
                      key={tech.id}
                      className={`tech-node ${tech.researched ? 'researched' : ''} ${
                        tech.dependencies.every(depId => 
                          techTree.find(t => t.id === depId)?.researched
                        ) ? 'available' : 'locked'
                      }`}
                      onClick={() => !tech.researched && handleResearch(tech.id)}
                    >
                      <div className="tech-node-name">{tech.name}</div>
                      <div className="tech-node-description">{tech.description}</div>
                      <div className="tech-node-cost">
                        {tech.cost.map((item, idx) => (
                          <span key={idx} className="cost-badge">
                            {item.name}: {item.quantity}
                          </span>
                        ))}
                      </div>
                      {tech.researched && (
                        <div className="researched-badge">✓ Researched</div>
                      )}
                      {tech.dependencies.length > 0 && !tech.researched && (
                        <div className="dependencies-badge">
                          Requires: {tech.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="tech-tree-footer">
          <div className="tech-tree-hint">
            💡 Research technologies to unlock new buildings and capabilities
          </div>
        </div>
      </div>
    </div>
  )
}

export default TechTree
