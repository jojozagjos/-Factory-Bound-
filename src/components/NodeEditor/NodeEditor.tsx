import React, { useCallback } from 'react'
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

interface NodeEditorProps {
  onClose: () => void
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input: Sensor Data' },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'default',
    data: { label: 'Logic: If-Then' },
    position: { x: 300, y: 100 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Output: Activate Belt' },
    position: { x: 500, y: 100 },
  },
]

const initialEdges: Edge[] = []

const NodeEditor = ({ onClose }: NodeEditorProps) => {
  const [nodes, setNodes] = React.useState<Node[]>(initialNodes)
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges)

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
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: type === 'input' || type === 'output' ? type : 'default',
      data: { 
        label: type === 'input' 
          ? 'New Input' 
          : type === 'output' 
          ? 'New Output' 
          : 'New Logic Node' 
      },
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
    }
    setNodes([...nodes, newNode])
  }

  return (
    <div className="node-editor-overlay">
      <div className="node-editor">
        <div className="node-editor-header">
          <h2>Visual Node Programming</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close node editor">
            ✕
          </button>
        </div>

        <div className="node-toolbar">
          <button onClick={() => addNode('input')} className="toolbar-btn">
            ➕ Input
          </button>
          <button onClick={() => addNode('logic')} className="toolbar-btn">
            ➕ Logic
          </button>
          <button onClick={() => addNode('output')} className="toolbar-btn">
            ➕ Output
          </button>
          <button className="toolbar-btn">
            💾 Save Program
          </button>
          <button className="toolbar-btn">
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
        </div>
      </div>
    </div>
  )
}

export default NodeEditor
