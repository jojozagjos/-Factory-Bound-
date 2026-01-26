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
  const [savedPrograms, setSavedPrograms] = useState<Record<string, { nodes: any[]; connections: any[] }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('node_programs') || '{}')
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
    const nodeLabels: Record<string, string> = {
      'input': '📊 Item Count',
      'condition': '🔀 If-Then',
      'counter': '🔢 Counter',
      'timer': '⏱️ Timer',
      'splitter': '↔️ Smart Splitter',
      'output': '⚙️ Machine Control',
    }
    
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: type === 'input' || type === 'output' ? type : 'default',
      data: { 
        label: nodeLabels[type] || 'New Node'
      },
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    }
    setNodes([...nodes, newNode])
  }

  const saveProgram = () => {
    const program = {
      nodes: nodes.map(n => ({ id: n.id, type: n.type, data: n.data })),
      connections: edges.map(e => ({ id: e.id, from: e.source, to: e.target })),
    }

    try {
      const stored = JSON.parse(localStorage.getItem('node_programs') || '{}')
      const progId = `prog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      stored[progId] = program
      localStorage.setItem('node_programs', JSON.stringify(stored))
      setSavedPrograms(stored)
      
      // If a machine is selected, bind the program to it
      if (selectedMachine && onSaveProgram) {
        onSaveProgram(progId, selectedMachine.id)
      }
      
      alert(`Program saved: ${progId}${selectedMachine ? ' (bound to ' + selectedMachine.type + ')' : ''}`)
    } catch (err) {
      console.error('Failed to save program:', err)
      alert('Failed to save program. See console for details.')
    }
  }

  const handleTestRun = () => {
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
          <button className="close-btn" onClick={onClose} aria-label="Close node editor">
            ✕
          </button>
        </div>

        <div className="node-toolbar">
          <button onClick={() => addNode('input')} className="toolbar-btn">
            📊 Input
          </button>
          <button onClick={() => addNode('condition')} className="toolbar-btn">
            🔀 Condition
          </button>
          <button onClick={() => addNode('counter')} className="toolbar-btn">
            🔢 Counter
          </button>
          <button onClick={() => addNode('timer')} className="toolbar-btn">
            ⏱️ Timer
          </button>
          <button onClick={() => addNode('splitter')} className="toolbar-btn">
            ↔️ Splitter
          </button>
          <button onClick={() => addNode('output')} className="toolbar-btn">
            ⚙️ Output
          </button>
          <button onClick={saveProgram} className="toolbar-btn save-btn">
            💾 Save Program
          </button>
          <button className="toolbar-btn" onClick={handleTestRun}>
            ▶ Test Run
          </button>
        </div>

        <div className="node-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
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
          </ul>
          {lastTestResult && (
            <div className="test-result">
              <h4>Last Test Result:</h4>
              <pre>{lastTestResult}</pre>
            </div>
          )}
          <div className="saved-programs">
            <h4>Saved Programs ({Object.keys(savedPrograms).length})</h4>
            <div className="program-list">
              {Object.entries(savedPrograms).map(([id, prog]) => (
                <div key={id} className="program-item">
                  <small>{id}</small>
                  <button onClick={() => {
                    setNodes(prog.nodes.map((n, i) => ({ ...n, position: { x: 100 + i * 100, y: 100 } })))
                    setEdges(prog.connections.map(c => ({ id: c.id, source: c.from, target: c.to })))
                  }}>Load</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeEditor
