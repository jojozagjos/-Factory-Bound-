import type { Machine, ProgramNode, NodeConnection } from '../types/game'

/**
 * Safe, deterministic runtime for executing node programs on machines.
 * Features:
 * - Topological sorting for deterministic execution
 * - Per-tick execution budget to prevent runaway programs
 * - Input validation and sandboxing
 * - Error recovery without halting the whole tick
 */
export class NodeProgramRuntime {
  private readonly MAX_NODES_PER_TICK = 100
  private readonly MAX_EXECUTION_TIME_MS = 5 // milliseconds per tick
  private executionStats: Map<string, { executionCount: number; lastExecutedTick: number }> = new Map()

  /**
   * Execute a node program once, returning the mutated machine state.
   * This is safe for use in the editor (runNodeProgramOnce is the old name).
   */
  executeOnce(nodeProgram: { nodes: ProgramNode[] | any[]; connections: NodeConnection[] | any[] }, machineSnapshot: Machine): Machine {
    if (!nodeProgram || !nodeProgram.nodes || nodeProgram.nodes.length === 0) {
      return machineSnapshot
    }

    // Clone to avoid mutation
    const machine = JSON.parse(JSON.stringify(machineSnapshot)) as Machine
    const { nodes, connections } = nodeProgram

    // Validate and convert nodes
    const validNodes = nodes.filter((n: any) => n && n.id && n.type)
    if (validNodes.length === 0) return machine

    // Compute topological order
    const order = this.topologicalSort(validNodes, connections || [])
    if (order.length === 0) return machine // Cycle detected, abort

    // Execute in order with budget
    const nodeMap = new Map(validNodes.map((n: any) => [n.id, n]))
    const nodeOutputs: Map<string, number> = new Map()
    const startTime = performance.now()

    let executedCount = 0
    for (const nodeId of order) {
      // Budget check
      executedCount += 1
      if (executedCount > this.MAX_NODES_PER_TICK || performance.now() - startTime > this.MAX_EXECUTION_TIME_MS) {
        console.warn('Node program execution timeout')
        break
      }

      const node = nodeMap.get(nodeId)
      if (!node) continue

      try {
        this.executeNode(node, machine, connections || [], nodeOutputs)
      } catch (err) {
        console.error(`Error executing node ${nodeId}:`, err)
        // Continue with next node instead of halting
      }
    }

    return machine
  }

  /**
   * Topological sort to ensure deterministic, cycle-free execution order
   */
  private topologicalSort(nodes: any[], connections: any[]): string[] {
    const indegree: Map<string, number> = new Map()
    const graph: Map<string, string[]> = new Map()

    nodes.forEach(n => {
      indegree.set(n.id, 0)
      graph.set(n.id, [])
    })

    connections.forEach((c: any) => {
      if (indegree.has(c.from) && indegree.has(c.to)) {
        graph.get(c.from)?.push(c.to)
        indegree.set(c.to, (indegree.get(c.to) || 0) + 1)
      }
    })

    const queue: string[] = []
    indegree.forEach((d, id) => {
      if (d === 0) queue.push(id)
    })

    const ordered: string[] = []
    while (queue.length > 0) {
      const id = queue.shift()!
      ordered.push(id)
      const neighbors = graph.get(id) || []
      neighbors.forEach(nb => {
        indegree.set(nb, (indegree.get(nb) || 1) - 1)
        if (indegree.get(nb) === 0) queue.push(nb)
      })
    }

    // If not all nodes visited, cycle exists
    if (ordered.length < nodes.length) {
      console.warn('Cycle detected in node graph; falling back to insertion order')
      return nodes.map((n: any) => n.id)
    }

    return ordered
  }

  /**
   * Execute a single node, updating machine state and node outputs
   */
  private executeNode(
    node: any,
    machine: Machine,
    connections: any[],
    nodeOutputs: Map<string, number>
  ): void {
    switch (node.type) {
      case 'input':
        this.executeInputNode(node, machine, nodeOutputs)
        break
      case 'logic':
        this.executeLogicNode(node, connections, nodeOutputs)
        break
      case 'output':
        this.executeOutputNode(node, machine, connections, nodeOutputs)
        break
      default:
        // Unknown node type, safe to ignore
        break
    }
  }

  /**
   * Input nodes (sensors) read machine state
   */
  private executeInputNode(node: any, machine: Machine, outputs: Map<string, number>): void {
    const sensor = node.data?.sensor as string
    let value = 0

    switch (sensor) {
      case 'inventory_count':
        value = machine.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)
        break
      case 'inventory_empty':
        value = machine.inventory.length === 0 ? 1 : 0
        break
      case 'inventory_full':
        value = machine.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0) >= (machine.type === 'storage' ? 100 : 10) ? 1 : 0
        break
      case 'power_connected':
        value = machine.power.connected ? 1 : 0
        break
      case 'power_status':
        value = machine.power.available >= machine.power.required ? 1 : 0
        break
      case 'health':
        value = machine.health / machine.maxHealth
        break
      case 'health_low':
        value = machine.health / machine.maxHealth < 0.3 ? 1 : 0
        break
      default:
        value = 0
    }

    outputs.set(node.id, Math.max(0, Math.min(1, value))) // Clamp to [0, 1]
  }

  /**
   * Logic nodes perform operations on inputs
   */
  private executeLogicNode(node: any, connections: any[], outputs: Map<string, number>): void {
    const inputs = connections
      .filter((c: any) => c.to === node.id)
      .map((c: any) => outputs.get(c.from) ?? 0)
      .filter((v: number) => !isNaN(v))

    if (inputs.length === 0) {
      outputs.set(node.id, 0)
      return
    }

    const op = node.data?.operation as string
    let result = 0

    switch (op) {
      case 'compare_gt':
        result = inputs[0] > (node.data?.value ?? 0) ? 1 : 0
        break
      case 'compare_lt':
        result = inputs[0] < (node.data?.value ?? 0) ? 1 : 0
        break
      case 'compare_eq':
        result = Math.abs(inputs[0] - (node.data?.value ?? 0)) < 0.01 ? 1 : 0
        break
      case 'and':
        result = inputs.every(v => v > 0.5) ? 1 : 0
        break
      case 'or':
        result = inputs.some(v => v > 0.5) ? 1 : 0
        break
      case 'not':
        result = inputs[0] < 0.5 ? 1 : 0
        break
      case 'add':
        result = Math.min(1, inputs.reduce((sum, v) => sum + v, 0))
        break
      case 'multiply':
        result = inputs.reduce((prod, v) => prod * v, 1)
        break
      default:
        result = 0
    }

    outputs.set(node.id, Math.max(0, Math.min(1, result)))
  }

  /**
   * Output nodes (actions) mutate machine state
   */
  private executeOutputNode(node: any, machine: Machine, connections: any[], outputs: Map<string, number>): void {
    const inputs = connections
      .filter((c: any) => c.to === node.id)
      .map((c: any) => outputs.get(c.from) ?? 0)

    const signal = inputs.some(v => v > 0.5) ? 1 : 0
    const action = node.data?.action as string

    switch (action) {
      case 'enable_machine':
        // If signal is 1, enable; otherwise disable
        const defaultPower = this.getDefaultPowerRequirement(machine.type as any)
        machine.power.required = signal ? defaultPower : 0
        break
      case 'activate_recipe':
        // Would set machine.recipe based on signal
        break
      case 'drain_inventory':
        // Would remove items from inventory
        if (signal && machine.inventory.length > 0) {
          const item = machine.inventory[0]
          item.quantity = Math.max(0, item.quantity - 1)
          if (item.quantity === 0) {
            machine.inventory.shift()
          }
        }
        break
      default:
        // Unknown action, ignore
        break
    }
  }

  /**
   * Get default power requirement for a machine type
   */
  private getDefaultPowerRequirement(type: string): number {
    const powerMap: Record<string, number> = {
      miner: 90,
      assembler: 150,
      smelter: 180,
      belt: 5,
      inserter: 13,
      turret: 40,
      storage: 0,
      research_lab: 120,
      power_plant: 0,
      solar_panel: 0,
      accumulator: 0,
    }
    return powerMap[type] || 50
  }

  /**
   * Get execution statistics (for performance monitoring)
   */
  getStats(programId: string): { executionCount: number; lastExecutedTick: number } | null {
    return this.executionStats.get(programId) || null
  }
}
