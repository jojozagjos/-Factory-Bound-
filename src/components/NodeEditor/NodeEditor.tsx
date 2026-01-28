import React, { useCallback, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './NodeEditor.css'
import { SimulationEngine } from '../../engine/simulation/SimulationEngine'
import type { Machine } from '../../types/game'

interface NodeEditorProps {
  onClose: () => void
  selectedMachine?: Machine | null
  onSaveProgram?: (programId: string, machineId: string) => void
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: '📊 Item Count Sensor' },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'default',
    data: { label: '🔀 Condition: If > 100' },
    position: { x: 300, y: 100 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: '⚙️ Enable Machine' },
    position: { x: 500, y: 100 },
  },
  {
    id: '4',
    type: 'default',
    data: { label: '🔢 Counter' },
    position: { x: 300, y: 200 },
  },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
]

const NodeEditor = ({ onClose, selectedMachine, onSaveProgram }: NodeEditorProps) => {
  const [nodes, setNodes] = React.useState<Node[]>(initialNodes)
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges)
  const [lastTestResult, setLastTestResult] = useState<string>('')
  const MAX_SAVED_PROGRAMS = 50

  // Determine whether the selected machine supports node programming
  const isEditableMachine = (machine?: Machine | null) => {
    if (!machine) return true // allow sandbox editing when no machine selected
    const t = String(machine.type)
    // Whitelist: assemblers, workshops/factories, research lab, machine_shop, manufacturers, and vehicles
    if (t.includes('assembler') || t.includes('workshop') || t.includes('factory') || t.includes('machine') || t.includes('research') || t.includes('manufacturer')) return true
    if (t.includes('boat') || t.includes('train')) return true
    // Allow programming for docks/stations (route references) as well
    if (t.includes('station') || t.includes('dock')) return true
    return false
  }

  const editable = isEditableMachine(selectedMachine)

  type StoredProgram = { id: string; name?: string; data: { nodes: any[]; connections: any[] } }
  const [savedPrograms, setSavedPrograms] = useState<Record<string, StoredProgram>>(() => {
    try {
      return JSON.parse(localStorage.getItem('node_programs') || '{}') as Record<string, StoredProgram>
    } catch {
      return {}
    }
  })

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  )

  const addNode = (type: string) => {
    if (!editable) {
      alert('This machine does not support node programming.')
      return
    }

    const nodeLabels: Record<string, string> = {
      'input': '📊 Item Count',
      'condition': '🔀 If-Then',
      'counter': '🔢 Counter',
      'timer': '⏱️ Timer',
      'splitter': '↔️ Smart Splitter',
      'output': '⚙️ Machine Control',
      'station': '🚪 Dock/Station',
      'route': '📍 Route Waypoint',
      'loop': '🔄 Loop Route',
    }
    
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: type === 'input' || type === 'output' ? type : 'default',
      data: { 
        label: nodeLabels[type] || 'New Node',
        nodeType: type, // Store the actual type for serialization
      },
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    }
    setNodes([...nodes, newNode])
  }

  const saveProgram = () => {
    const program = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data, position: n.position })),
      connections: edges.map(e => ({ id: e.id, from: e.source, to: e.target })),
    }
    const namePrompt = prompt('Program name (optional):')
    const programName = namePrompt ? namePrompt.trim() : ''

    try {
      const stored = JSON.parse(localStorage.getItem('node_programs') || '{}')
      const savedCount = Object.keys(stored || {}).length
      if (savedCount >= MAX_SAVED_PROGRAMS) {
        alert(`You have reached the saved program limit (${MAX_SAVED_PROGRAMS}). Delete some programs before saving.`)
        return
      }
      const progId = `prog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      stored[progId] = { id: progId, name: programName || undefined, data: program }
      localStorage.setItem('node_programs', JSON.stringify(stored))
      setSavedPrograms(stored)
      
      // If a machine is selected and it supports programming, bind the program to it
      if (selectedMachine && onSaveProgram) {
        if (isEditableMachine(selectedMachine)) {
          onSaveProgram(progId, selectedMachine.id)
        } else {
          // do not bind to unsupported machine types
          console.log('Program saved locally but not bound: machine does not support programming', selectedMachine.type)
        }
      }
      
      alert(`Program saved: ${progId}${selectedMachine ? ' (bound to ' + selectedMachine.type + ')' : ''}`)
    } catch (err) {
      console.error('Failed to save program:', err)
      alert('Failed to save program. See console for details.')
    }
  }

  const deleteProgram = (id: string) => {
    if (!confirm('Delete saved program ' + id + ' ?')) return
    try {
      const stored = JSON.parse(localStorage.getItem('node_programs') || '{}')
      if (stored && stored[id]) {
        delete stored[id]
        localStorage.setItem('node_programs', JSON.stringify(stored))
        setSavedPrograms(stored)
      }
    } catch (err) {
      console.error('Failed to delete program:', err)
      alert('Failed to delete program. See console for details.')
    }
  }

  const handleTestRun = () => {
    if (!editable) {
      alert('Cannot run test: selected machine does not support node programming.')
      return
    }
    const sim = new SimulationEngine()
    const program = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
      connections: edges.map(e => ({ id: e.id, from: e.source, to: e.target })),
    }

    const sandboxMachine: any = {
      id: 'sandbox_1',
      type: selectedMachine?.type || 'assembler',
      inventory: selectedMachine?.inventory || [ { id: 'item_iron', name: 'iron_ore', quantity: 120 } ],
      power: selectedMachine?.power || { connected: true, available: 1000, required: 150 },
      health: selectedMachine?.health || 100,
      maxHealth: selectedMachine?.maxHealth || 100,
      nodeProgram: null,
    }

    try {
      const result = sim.runNodeProgramOnce(program, sandboxMachine)
      const resultText = `Inventory: ${JSON.stringify(result.inventory)}\nPower Required: ${result.power.required}`
      setLastTestResult(resultText)
      alert('Test Run result:\n' + resultText)
    } catch (err) {
      console.error('Test run failed:', err)
      alert('Test run failed. See console for details.')
    }
  }

  return (
    <div className="node-editor-overlay">
      <div className="node-editor">
        <div className="node-editor-header">
          <h2>Visual Node Programming</h2>
          {selectedMachine && <span className="machine-info">📦 {selectedMachine.type}</span>}
          {!editable && (
            <div className="node-editor-warning">This machine does not support node programming. Use sandbox mode or select a supported machine (assemblers, workshops, research labs, vehicles).</div>
          )}
          <button className="close-btn" onClick={onClose} aria-label="Close node editor">
            ✕
          </button>
        </div>

        <div className="node-toolbar">
          <button onClick={() => addNode('input')} className="toolbar-btn" disabled={!editable}>
            📊 Input
          </button>
          <button onClick={() => addNode('condition')} className="toolbar-btn" disabled={!editable}>
            🔀 Condition
          </button>
          <button onClick={() => addNode('counter')} className="toolbar-btn" disabled={!editable}>
            🔢 Counter
          </button>
          <button onClick={() => addNode('timer')} className="toolbar-btn" disabled={!editable}>
            ⏱️ Timer
          </button>
          <button onClick={() => addNode('splitter')} className="toolbar-btn" disabled={!editable}>
            ↔️ Splitter
          </button>
          <button onClick={() => addNode('output')} className="toolbar-btn" disabled={!editable}>
            ⚙️ Output
          </button>
          {selectedMachine && (selectedMachine.type.includes('boat') || selectedMachine.type.includes('train')) && (
            <>
              <button onClick={() => addNode('station')} className="toolbar-btn route-btn" disabled={!editable}>
                🚪 Station
              </button>
              <button onClick={() => addNode('route')} className="toolbar-btn route-btn" disabled={!editable}>
                📍 Route
              </button>
              <button onClick={() => addNode('loop')} className="toolbar-btn route-btn" disabled={!editable}>
                🔄 Loop
              </button>
            </>
          )}
          <button onClick={saveProgram} className="toolbar-btn save-btn" disabled={!editable && !!selectedMachine}>
            💾 Save Program
          </button>
          <button className="toolbar-btn" onClick={handleTestRun} disabled={!editable}>
            ▶ Test Run
          </button>
        </div>

        <div className="node-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={editable ? onNodesChange : undefined}
            onEdgesChange={editable ? onEdgesChange : undefined}
            onConnect={editable ? onConnect : undefined}
            fitView
            nodesDraggable={editable}
            nodesConnectable={editable}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        <div className="node-help">
          <h3>Node Types:</h3>
          <ul>
            <li><strong>Input:</strong> Sensor data, item counts, power status</li>
            <li><strong>Logic:</strong> Conditions, comparisons, mathematical operations</li>
            <li><strong>Output:</strong> Control machines, activate/deactivate, set recipes</li>
            {selectedMachine && (selectedMachine.type.includes('boat') || selectedMachine.type.includes('train')) && (
              <>
                <li><strong>Station:</strong> Reference a dock or rail station by ID</li>
                <li><strong>Route:</strong> Create a waypoint in the vehicle's route path</li>
                <li><strong>Loop:</strong> Set route to loop back to start (else goes to end and stops)</li>
              </>
            )}
          </ul>
          {lastTestResult && (
            <div className="test-result">
              <h4>Last Test Result:</h4>
              <pre>{lastTestResult}</pre>
            </div>
          )}
          <div className="saved-programs">
            <h4>Saved Programs ({Object.keys(savedPrograms).length}/{MAX_SAVED_PROGRAMS})</h4>
            <div className="program-list">
              {Object.entries(savedPrograms).map(([id, storedProg]) => {
                const prog = storedProg.data
                const displayName = storedProg.name || id
                return (
                <div key={id} className="program-item">
                  <small title={id}>{displayName}</small>
                  <div className="program-actions">
                    <button onClick={() => {
                      setNodes((prog.nodes || []).map((n: any) => ({ ...n })))
                      setEdges((prog.connections || []).map((c: any) => ({ id: c.id, source: c.from, target: c.to })))
                    }}>Load</button>
                    <button className="delete-btn" onClick={() => deleteProgram(id)}>Delete</button>
                  </div>
                </div>
              )})}
            </div>
            <div style={{ marginTop: 8, color: '#ccc', fontSize: 12 }}>
              Limit: {MAX_SAVED_PROGRAMS} programs (localStorage size applies)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeEditor
