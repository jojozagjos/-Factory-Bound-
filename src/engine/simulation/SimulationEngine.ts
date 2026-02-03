import type { Machine, Enemy, Projectile } from '../../types/game'
import { ResourceSystem } from '../../systems/ResourceSystem'
import { CombatSystem } from '../../systems/CombatSystem'
import { NodeProgramRuntime } from '../../systems/NodeProgramRuntime'
import { RouteSystem } from '../../systems/RouteSystem'
import { UnitSystem, Unit } from '../../systems/UnitSystem'
import { buildermentPvpExpansion } from '../../data/buildermentPvpExpansion'
import { Profiler } from '../utils/Profiler'

export class SimulationEngine {
  private tickCount = 0
  private readonly tickRate = 60 // 60 ticks per second
  private lastUpdateTime = 0
  private resourceSystem: ResourceSystem
  private combatSystem: CombatSystem
  private nodeProgramRuntime: NodeProgramRuntime
  private unitSystem: UnitSystem
  private turretCooldowns: Map<string, number>
  private profiler: Profiler

  constructor() {
    this.tickCount = 0
    this.resourceSystem = new ResourceSystem()
    this.combatSystem = new CombatSystem()
    this.nodeProgramRuntime = new NodeProgramRuntime()
    this.unitSystem = new UnitSystem()
    this.turretCooldowns = new Map()
    this.profiler = new Profiler()
  }

  // Deterministic update - same inputs always produce same outputs
  update(deltaTime: number, machines: Machine[], enemies: Enemy[], projectiles: Projectile[]): {
    machines: Machine[]
    enemies: Enemy[]
    projectiles: Projectile[]
    units: Unit[]
    removedEntities: string[]
  } {
    const tickStart = performance.now()
    const fixedDelta = 1000 / this.tickRate
    this.lastUpdateTime += deltaTime

    const removedEntities: string[] = []

    while (this.lastUpdateTime >= fixedDelta) {
      this.tick(machines, enemies, projectiles, removedEntities)
      this.lastUpdateTime -= fixedDelta
      this.tickCount++
    }

    // Profile tick duration
    const elapsed = performance.now() - tickStart
    this.profiler.record(elapsed)
    if (this.tickCount % 300 === 0) { // log every 5s at 60 fps
      console.log(`Simulation avg ${this.profiler.getAverage().toFixed(2)}ms, max ${this.profiler.getMax().toFixed(2)}ms over ${this.tickCount} ticks`)
    }

    return { machines, enemies, projectiles, units: this.unitSystem.units, removedEntities }
  }

  private tick(
    machines: Machine[], 
    enemies: Enemy[], 
    projectiles: Projectile[],
    removedEntities: string[]
  ): void {
    // Update machines
    machines.forEach(machine => {
      this.updateMachine(machine, machines)
    })

    // Update turrets separately (they need enemies and projectiles)
    machines.forEach(machine => {
      const isTurret = machine.type === 'turret' || 
                       machine.type === 'turret_gun' || 
                       machine.type === 'turret_cannon'
      if (isTurret && machine.power.connected && machine.power.available >= machine.power.required) {
        this.updateTurret(machine, enemies, projectiles)
      }
    })

    // Update units
    this.unitSystem.update(1 / this.tickRate, {
      machines: machines.map(m => ({
        id: m.id,
        position: m.position,
        health: m.health,
        owner: (m as any).owner,
      })),
      enemyUnits: this.unitSystem.units,
    })

    // Update enemies
    enemies.forEach(enemy => {
      this.updateEnemy(enemy, machines)
    })

    // Update projectiles
    projectiles.forEach(projectile => {
      this.updateProjectile(projectile, enemies, removedEntities)
    })

    // Remove dead entities
    this.cleanupDeadEntities(enemies, projectiles, removedEntities)
  }

  private updateMachine(machine: Machine, allMachines: Machine[]): void {
    if (!machine.power.connected || machine.power.available < machine.power.required) {
      return // No power, no operation
    }

    switch (machine.type) {
      case 'miner':
        this.updateMiner(machine)
        break
      case 'assembler':
        this.updateAssembler(machine)
        break
      case 'belt':
        this.updateBelt(machine, allMachines)
        break
      case 'inserter':
        this.updateInserter(machine, allMachines)
        break
      case 'turret':
        // Turret needs access to enemies and projectiles
        // This will be handled in the tick method
        break
      // Vehicle types
      case 'boat_1':
      case 'boat_2':
      case 'boat_3':
      case 'boat_4':
      case 'train_1':
      case 'train_2':
      case 'train_3':
      case 'train_4':
        this.updateVehicle(machine, allMachines)
        break
      // Station types
      case 'dock_station':
      case 'rail_station':
        this.updateStation(machine, allMachines)
        break
      // Military buildings
      case 'barracks':
      case 'vehicle_factory':
        this.updateMilitaryBuilding(machine, allMachines)
        break
    }

    // Execute node program if present
    if (machine.nodeProgram) {
      this.executeNodeProgram(machine)
    }
  }

  private updateMiner(machine: Machine): void {
    // Mining logic - extract resources from ground
    if (machine.inventory.length < 10) {
      // Simplified: add ore every few ticks
      if (this.tickCount % 60 === 0) {
        const existingOre = machine.inventory.find(item => item.name === 'iron_ore')
        if (existingOre) {
          existingOre.quantity += 1
        } else {
          machine.inventory.push({
            id: `ore_${Date.now()}`,
            name: 'iron_ore',
            quantity: 1,
          })
        }
      }
    }
  }

  private updateAssembler(machine: Machine): void {
    if (!machine.recipe) return

    // Check if we have ingredients using ResourceSystem
    if (this.resourceSystem.hasIngredients(machine)) {
      // Consume ingredients
      this.resourceSystem.consumeIngredients(machine)
      
      // Produce outputs
      this.resourceSystem.produceOutputs(machine)
    }
  }

  private updateBelt(machine: Machine, allMachines: Machine[]): void {
    // Transport items to next belt or machine
    if (machine.inventory.length > 0) {
      // Find next machine in direction
      const nextPos = this.getNextPosition(machine.position, machine.rotation)
      const nextMachine = allMachines.find(
        m => m.position.x === nextPos.x && m.position.y === nextPos.y
      )

      if (nextMachine && nextMachine.inventory.length < 10) {
        const item = machine.inventory.shift()
        if (item) {
          nextMachine.inventory.push(item)
        }
      }
    }
  }

  private updateInserter(machine: Machine, allMachines: Machine[]): void {
    // Pick up from one machine and place in another
    const sourcePos = this.getNextPosition(machine.position, machine.rotation)
    const targetPos = this.getNextPosition(machine.position, (machine.rotation + 180) % 360)

    const source = allMachines.find(m => m.position.x === sourcePos.x && m.position.y === sourcePos.y)
    const target = allMachines.find(m => m.position.x === targetPos.x && m.position.y === targetPos.y)

    if (source && target && source.inventory.length > 0 && target.inventory.length < 10) {
      const item = source.inventory.shift()
      if (item) {
        target.inventory.push(item)
      }
    }
  }

  private updateTurret(machine: Machine, enemies: Enemy[], projectiles: Projectile[]): void {
    // Check cooldown
    const cooldown = this.turretCooldowns.get(machine.id) || 0
    if (cooldown > 0) {
      this.turretCooldowns.set(machine.id, cooldown - 1)
      return
    }

    // Find nearest enemy in range
    const target = this.combatSystem.findTurretTarget(machine, enemies, 15)
    if (!target) return

    // Check if turret has ammo
    if (!this.combatSystem.consumeAmmo(machine)) return

    // Create projectile
    const projectile = this.combatSystem.createProjectile(machine, target, 20)
    projectiles.push(projectile)

    // Set cooldown (60 ticks = 1 second)
    this.turretCooldowns.set(machine.id, 30) // 0.5 second cooldown
  }

  private updateEnemy(enemy: Enemy, machines: Machine[]): void {
    // Find nearest machine using combat system
    const target = this.combatSystem.findNearestTarget(enemy, machines)
    if (!target) return

    // Move toward target
    this.combatSystem.moveEnemyToward(enemy, target.position)

    // Check if in attack range
    if (this.combatSystem.isInAttackRange(enemy, target.position)) {
      // Attack machine (damage applied every second)
      if (this.tickCount % 60 === 0) {
        this.combatSystem.attackMachine(enemy, target)
      }
    }
  }

  private updateProjectile(
    projectile: Projectile, 
    enemies: Enemy[], 
    removedEntities: string[]
  ): void {
    // Move projectile using combat system
    this.combatSystem.updateProjectile(projectile)

    // Check collision with enemies
    for (const enemy of enemies) {
      if (this.combatSystem.checkProjectileHit(projectile, enemy)) {
        const killed = this.combatSystem.damageEnemy(enemy, projectile.damage)
        removedEntities.push(projectile.id)
        
        // Mark enemy for removal if killed
        if (killed) {
          // Enemy will be removed in cleanupDeadEntities
        }
        break
      }
    }

    // Check if out of bounds (remove if so)
    // Assume max map size of 1000x1000
    if (this.combatSystem.isProjectileOutOfBounds(projectile, 1000, 1000)) {
      removedEntities.push(projectile.id)
    }
  }

  private cleanupDeadEntities(
    enemies: Enemy[], 
    projectiles: Projectile[], 
    removedEntities: string[]
  ): void {
    // Remove dead enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].health <= 0) {
        removedEntities.push(enemies[i].id)
        enemies.splice(i, 1)
      }
    }

    // Remove consumed projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (removedEntities.includes(projectiles[i].id)) {
        projectiles.splice(i, 1)
      }
    }
  }

  private updateVehicle(vehicle: Machine, allMachines: Machine[]): void {
    // Boats and trains move along programmed routes
    if (!vehicle.route || !vehicle.route.isActive || vehicle.route.waypointIds.length === 0) {
      return // No route or inactive
    }

    // Get current target waypoint
    const currentWaypoint = RouteSystem.getCurrentWaypoint(vehicle, allMachines)
    if (!currentWaypoint) {
      console.warn(`Vehicle ${vehicle.id} has invalid waypoint, stopping route`)
      vehicle.route.isActive = false
      return
    }

    // Initialize route progress if not set
    if (vehicle.routeProgress === undefined) {
      vehicle.routeProgress = 0
    }

    // Calculate movement speed based on vehicle tier
    // Speed is in tiles per second, divide by 60 for tiles per tick
    const speedMap: Record<string, number> = {
      'boat_1': 5,
      'boat_2': 8,
      'boat_3': 12,
      'boat_4': 15,
      'train_1': 10,
      'train_2': 15,
      'train_3': 20,
      'train_4': 25,
    }
    const speed = speedMap[vehicle.type] || 5
    const tilesPerTick = speed / 60 // Convert to per-tick movement

    // Calculate distance to target
    const dx = currentWaypoint.position.x - vehicle.position.x
    const dy = currentWaypoint.position.y - vehicle.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if arrived at waypoint
    if (distance < 1) {
      // Arrived! Load/unload at station
      this.vehicleLoadUnload(vehicle, currentWaypoint)

      // Move to next waypoint
      vehicle.route.currentWaypointIndex++
      
      // Check if route is complete
      if (vehicle.route.currentWaypointIndex >= vehicle.route.waypointIds.length) {
        if (vehicle.route.loop) {
          // Loop back to start
          vehicle.route.currentWaypointIndex = 0
          vehicle.routeProgress = 0
        } else {
          // End of route
          vehicle.route.isActive = false
          console.log(`Vehicle ${vehicle.id} completed route`)
        }
      } else {
        vehicle.routeProgress = 0
      }
      return
    }

    // Move toward waypoint
    const moveX = (dx / distance) * tilesPerTick
    const moveY = (dy / distance) * tilesPerTick
    
    vehicle.position.x += moveX
    vehicle.position.y += moveY
    vehicle.routeProgress = Math.min(1, vehicle.routeProgress + (tilesPerTick / distance))

    // Update rotation to face movement direction
    vehicle.rotation = Math.atan2(dy, dx) * (180 / Math.PI)
  }

  private vehicleLoadUnload(vehicle: Machine, station: Machine): void {
    // Transfer items between vehicle and station
    // Station acts as a buffer - vehicles pick up items when arriving
    // and drop off items when leaving

    // Get vehicle capacity based on type
    const capacityMap: Record<string, number> = {
      'boat_1': 50,
      'boat_2': 100,
      'boat_3': 200,
      'boat_4': 300,
      'train_1': 100,
      'train_2': 200,
      'train_3': 300,
      'train_4': 500,
    }
    const capacity = capacityMap[vehicle.type] || 50

    // Calculate current vehicle inventory size
    const currentLoad = vehicle.inventory.reduce((sum, item) => sum + item.quantity, 0)

    // UNLOAD: Transfer items from vehicle to station (if station has space)
    if (vehicle.inventory.length > 0) {
      const stationLoad = station.inventory.reduce((sum, item) => sum + item.quantity, 0)
      const stationCapacity = 1000 // Stations have large capacity
      
      if (stationLoad < stationCapacity) {
        // Transfer items
        for (const vehicleItem of vehicle.inventory) {
          const existingItem = station.inventory.find(i => i.name === vehicleItem.name)
          if (existingItem) {
            const transferQty = Math.min(vehicleItem.quantity, stationCapacity - stationLoad)
            existingItem.quantity += transferQty
            vehicleItem.quantity -= transferQty
          } else {
            station.inventory.push({ ...vehicleItem })
          }
        }
        
        // Remove empty items
        vehicle.inventory = vehicle.inventory.filter(item => item.quantity > 0)
        console.log(`Vehicle ${vehicle.id} unloaded at station ${station.id}`)
      }
    }

    // LOAD: Transfer items from station to vehicle (if vehicle has space)
    if (currentLoad < capacity && station.inventory.length > 0) {
      const availableSpace = capacity - currentLoad
      
      for (const stationItem of station.inventory) {
        if (availableSpace <= 0) break
        
        const transferQty = Math.min(stationItem.quantity, availableSpace)
        const existingVehicleItem = vehicle.inventory.find(i => i.name === stationItem.name)
        
        if (existingVehicleItem) {
          existingVehicleItem.quantity += transferQty
        } else {
          vehicle.inventory.push({
            id: `item_${Date.now()}_${Math.random()}`,
            name: stationItem.name,
            quantity: transferQty,
          })
        }
        
        stationItem.quantity -= transferQty
      }
      
      // Remove empty items from station
      station.inventory = station.inventory.filter(item => item.quantity > 0)
      console.log(`Vehicle ${vehicle.id} loaded at station ${station.id}`)
    }
  }

  private updateMilitaryBuilding(building: Machine, _allMachines: Machine[]): void {
    // Barracks and vehicle factories produce units when they have resources
    interface MilitaryBuilding extends Machine {
      productionQueue?: Array<{ unitType: string; progress: number; maxProgress: number }>
      productionProgress?: number
    }
    
    const militaryBuilding = building as MilitaryBuilding
    
    // Check if building has a production queue
    if (!militaryBuilding.productionQueue) {
      militaryBuilding.productionQueue = []
      militaryBuilding.productionProgress = 0
    }

    const queue = militaryBuilding.productionQueue
    
    // If no units in queue and has inventory, try to start production
    if (queue.length === 0 && building.inventory.length > 0) {
      // Try to find a unit recipe we can produce
      const pvpUnits: any[] = buildermentPvpExpansion.units as any[]
      const producibleUnits = pvpUnits.filter((u: any) => u.produced_by === building.type)
      
      for (const unitDef of producibleUnits) {
        const recipeInputs: any[] = unitDef.recipe?.inputs || []
        
        // Check if we have all ingredients
        const hasIngredients = recipeInputs.every((input: any) => {
          const item = building.inventory.find(i => i.name === input.item)
          return item && item.quantity >= input.qty
        })
        
        if (hasIngredients) {
          // Consume ingredients
          recipeInputs.forEach((input: any) => {
            const item = building.inventory.find(i => i.name === input.item)
            if (item) {
              item.quantity -= input.qty
            }
          })
          
          // Remove empty items
          building.inventory = building.inventory.filter(i => i.quantity > 0)
          
          // Start production
          queue.push({
            unitType: unitDef.id,
            progress: 0,
            maxProgress: unitDef.recipe.time_seconds * this.tickRate, // Convert to ticks
          })
          
          console.log(`${building.type} started producing ${unitDef.id}`)
          break
        }
      }
    }
    
    // Process production queue
    if (queue.length > 0) {
      const current = queue[0]
      current.progress++
      
      if (current.progress >= current.maxProgress) {
        // Unit complete! Spawn it
        const spawnX = building.position.x + 2 // Spawn to the right of building
        const spawnY = building.position.y
        
        const owner = (building as any).owner || 'local'
        this.unitSystem.spawnUnit(current.unitType, spawnX, spawnY, owner)
        
        console.log(`${building.type} completed ${current.unitType}`)
        queue.shift()
      }
    }
  }

  private updateStation(_station: Machine, _allMachines: Machine[]): void {
    // Stations can accept items from belts/inserters and hold them for vehicles
    // They also output items that vehicles delivered
    // This is handled by normal belt/inserter logic, so stations just need to exist
    // as valid targets for item transfer
    
    // No special update logic needed - stations are passive buffers
    // The vehicleLoadUnload method handles the vehicle interaction
  }

  private executeNodeProgram(machine: Machine): void {
    // Use the new safe runtime
    if (!machine.nodeProgram) return

    try {
      const result = this.nodeProgramRuntime.executeOnce(machine.nodeProgram, machine)
      // Update machine with result state (power, recipe, etc. may be modified)
      machine.power = result.power
      machine.inventory = result.inventory
      machine.health = result.health
    } catch (err) {
      console.error('Node program execution error:', err)
      // Continue with next machine instead of halting
    }
  }

  /**
   * Safely execute a node program against a machine snapshot and return the mutated snapshot.
   * This does not modify simulation-wide state and is intended for editor "Test Run".
   */
  runNodeProgramOnce(nodeProgram: { nodes: any[]; connections: any[] }, machineSnapshot: Machine): Machine {
    if (!nodeProgram || !machineSnapshot) return machineSnapshot

    // Clone inputs to avoid mutating caller objects
    const machine = JSON.parse(JSON.stringify(machineSnapshot)) as Machine
    const { nodes, connections } = nodeProgram

    // Build adjacency and compute execution order via simple topological sort
    const indegree: Map<string, number> = new Map()
    const graph: Map<string, string[]> = new Map()
    nodes.forEach(n => { indegree.set(n.id, 0); graph.set(n.id, []) })
    connections.forEach((c: any) => {
      // c.from -> c.to
      if (!graph.has(c.from)) graph.set(c.from, [])
      graph.get(c.from)!.push(c.to)
      indegree.set(c.to, (indegree.get(c.to) || 0) + 1)
    })

    const queue: string[] = []
    indegree.forEach((d, id) => { if (d === 0) queue.push(id) })

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

    // Fallback: if cycle exists, fall back to original nodes order
    if (ordered.length === 0) {
      nodes.forEach(n => ordered.push(n.id))
    }

    const nodeMap = new Map(nodes.map((n: any) => [n.id, n]))
    const nodeOutputs: Map<string, any> = new Map()

    // Execute nodes in order with simple, bounded operations
    for (const nodeId of ordered) {
      const node = nodeMap.get(nodeId)
      if (!node) continue

      try {
        switch (node.type) {
          case 'input': {
            if (node.data?.sensor === 'inventory_count') {
              nodeOutputs.set(node.id, machine.inventory.reduce((s, it) => s + (it.quantity || 0), 0))
            } else if (node.data?.sensor === 'power_status') {
              nodeOutputs.set(node.id, machine.power.connected ? 1 : 0)
            } else if (node.data?.sensor === 'health') {
              nodeOutputs.set(node.id, machine.health / machine.maxHealth)
            } else {
              nodeOutputs.set(node.id, 0)
            }
            break
          }

          case 'logic': {
            const inputs = connections
              .filter((conn: any) => conn.to === node.id)
              .map((conn: any) => nodeOutputs.get(conn.from) || 0)

            if (node.data?.operation === 'compare_gt') {
              nodeOutputs.set(node.id, inputs[0] > (node.data.value || 0) ? 1 : 0)
            } else if (node.data?.operation === 'compare_lt') {
              nodeOutputs.set(node.id, inputs[0] < (node.data.value || 0) ? 1 : 0)
            } else if (node.data?.operation === 'and') {
              nodeOutputs.set(node.id, inputs.every((v: any) => v > 0) ? 1 : 0)
            } else if (node.data?.operation === 'or') {
              nodeOutputs.set(node.id, inputs.some((v: any) => v > 0) ? 1 : 0)
            } else {
              nodeOutputs.set(node.id, 0)
            }
            break
          }

          case 'output': {
            const outputInputs = connections
              .filter((conn: any) => conn.to === node.id)
              .map((conn: any) => nodeOutputs.get(conn.from) || 0)
            const shouldActivate = outputInputs.some((v: any) => v > 0)
            if (node.data?.action === 'enable_machine') {
              machine.power.required = shouldActivate ? this.getDefaultPowerRequirement(machine.type) : 0
            }
            break
          }

          default:
            // Unknown node type — ignore
            break
        }
      } catch (err) {
        // Catch errors from malformed node data to keep editor safe
        console.error('Node execution error (sandboxed):', err)
      }
    }

    return machine
  }

  private getDefaultPowerRequirement(type: string): number {
    const powerMap: Record<string, number> = {
      miner: 90,
      assembler: 150,
      smelter: 180,
      belt: 5,
      inserter: 13,
      turret: 40,
      boat_1: 20,
      boat_2: 30,
      boat_3: 45,
      boat_4: 60,
      train_1: 40,
      train_2: 60,
      train_3: 80,
      train_4: 100,
      dock_station: 25,
      rail_station: 35,
    }
    return powerMap[type] || 0
  }

  private getNextPosition(pos: { x: number; y: number }, rotation: number): { x: number; y: number } {
    const rad = (rotation * Math.PI) / 180
    return {
      x: Math.round(pos.x + Math.cos(rad)),
      y: Math.round(pos.y + Math.sin(rad)),
    }
  }

  getTickCount(): number {
    return this.tickCount
  }
}
