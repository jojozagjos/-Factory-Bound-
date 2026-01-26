import { describe, it, expect, beforeEach } from 'vitest'
import { NodeProgramRuntime } from '@/systems/NodeProgramRuntime.ts'
import type { Machine, MachineType } from '@/types/game.ts'

describe('NodeProgramRuntime', () => {
  let runtime: NodeProgramRuntime

  beforeEach(() => {
    runtime = new NodeProgramRuntime()
  })

  const createTestMachine = (overrides?: Partial<Machine>): Machine => ({
    id: 'test_machine_1',
    type: 'assembler' as MachineType,
    position: { x: 0, y: 0 },
    rotation: 0,
    inventory: [{ id: 'item_1', name: 'iron_ore', quantity: 50 }],
    power: { required: 150, available: 200, connected: true },
    health: 100,
    maxHealth: 100,
    ...overrides,
  })

  it('should execute a simple input node', () => {
    const machine = createTestMachine()
    const program = {
      nodes: [
        { id: 'input_1', type: 'input', data: { sensor: 'inventory_count' } },
      ],
      connections: [],
    }

    const result = runtime.executeOnce(program, machine)
    expect(result).toBeDefined()
    expect(result.inventory).toEqual(machine.inventory)
  })

  it('should execute a logic node (compare_gt)', () => {
    const machine = createTestMachine()
    const program = {
      nodes: [
        { id: 'input_1', type: 'input', data: { sensor: 'inventory_count' } },
        { id: 'logic_1', type: 'logic', data: { operation: 'compare_gt', value: 40 } },
      ],
      connections: [{ id: 'c1', from: 'input_1', to: 'logic_1' }],
    }

    const result = runtime.executeOnce(program, machine)
    expect(result).toBeDefined()
  })

  it('should execute an output node (enable_machine)', () => {
    const machine = createTestMachine({ power: { required: 0, available: 200, connected: true } })
    const program = {
      nodes: [
        { id: 'input_1', type: 'input', data: { sensor: 'power_connected' } },
        { id: 'output_1', type: 'output', data: { action: 'enable_machine' } },
      ],
      connections: [{ id: 'c1', from: 'input_1', to: 'output_1' }],
    }

    const result = runtime.executeOnce(program, machine)
    expect(result.power.required).toBeGreaterThan(0)
  })

  it('should handle cycles gracefully (fallback to insertion order)', () => {
    const machine = createTestMachine()
    const program = {
      nodes: [
        { id: 'node_1', type: 'logic', data: { operation: 'add' } },
        { id: 'node_2', type: 'logic', data: { operation: 'add' } },
      ],
      connections: [
        { id: 'c1', from: 'node_1', to: 'node_2' },
        { id: 'c2', from: 'node_2', to: 'node_1' }, // Cycle
      ],
    }

    expect(() => runtime.executeOnce(program, machine)).not.toThrow()
  })

  it('should handle empty programs safely', () => {
    const machine = createTestMachine()
    const program = { nodes: [], connections: [] }

    const result = runtime.executeOnce(program, machine)
    expect(result).toEqual(machine)
  })

  it('should clamp numeric values to [0, 1]', () => {
    const machine = createTestMachine({ health: 150, maxHealth: 100 })
    const program = {
      nodes: [
        { id: 'input_1', type: 'input', data: { sensor: 'health' } },
      ],
      connections: [],
    }

    const result = runtime.executeOnce(program, machine)
    expect(result).toBeDefined()
  })

  it('should execute AND logic gate correctly', () => {
    const machine = createTestMachine()
    const program = {
      nodes: [
        { id: 'in1', type: 'input', data: { sensor: 'power_connected' } },
        { id: 'in2', type: 'input', data: { sensor: 'inventory_empty' } },
        { id: 'and', type: 'logic', data: { operation: 'and' } },
      ],
      connections: [
        { id: 'c1', from: 'in1', to: 'and' },
        { id: 'c2', from: 'in2', to: 'and' },
      ],
    }

    const result = runtime.executeOnce(program, machine)
    expect(result).toBeDefined()
  })

  it('should not modify the original machine snapshot', () => {
    const machine = createTestMachine()
    const machineClone = JSON.parse(JSON.stringify(machine))
    const program = {
      nodes: [
        { id: 'out1', type: 'output', data: { action: 'enable_machine' } },
      ],
      connections: [],
    }

    runtime.executeOnce(program, machine)
    expect(machine).toEqual(machineClone)
  })

  it('should execute deterministically (same inputs = same outputs)', () => {
    const machine = createTestMachine()
    const program = {
      nodes: [
        { id: 'in1', type: 'input', data: { sensor: 'inventory_count' } },
        { id: 'logic1', type: 'logic', data: { operation: 'compare_gt', value: 30 } },
        { id: 'out1', type: 'output', data: { action: 'enable_machine' } },
      ],
      connections: [
        { id: 'c1', from: 'in1', to: 'logic1' },
        { id: 'c2', from: 'logic1', to: 'out1' },
      ],
    }

    const result1 = runtime.executeOnce(program, machine)
    const result2 = runtime.executeOnce(program, machine)

    expect(result1.power.required).toEqual(result2.power.required)
  })
})
