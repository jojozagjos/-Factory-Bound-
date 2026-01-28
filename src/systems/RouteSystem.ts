import type { Machine, VehicleRoute } from '../types/game'

/**
 * RouteSystem: Converts node editor programs into vehicle routes for boats/trains
 * 
 * A route program is a linear sequence of Station nodes connected by Route edges.
 * The system extracts this sequence and builds a VehicleRoute that the vehicle follows.
 */

export class RouteSystem {
  /**
   * Parse a node program into a VehicleRoute
   * 
   * Algorithm:
   * 1. Find all 'station' type nodes (represent dock/rail stations)
   * 2. Extract the linear sequence by following edges
   * 3. Build a VehicleRoute with the waypoint IDs in order
   * 4. Check for 'loop' node to determine if route should loop
   */
  static parseRouteFromProgram(
    nodes: any[],
    edges: any[],
    _machineId: string,
    machines: Machine[]
  ): VehicleRoute | null {
    // Find all station nodes
    const stationNodes = nodes.filter(n => n.data?.nodeType === 'station' || n.type === 'station')
    if (stationNodes.length === 0) return null
    
    // Check for loop node
    const loopNode = nodes.find(n => n.data?.nodeType === 'loop' || n.type === 'loop')
    const shouldLoop = !!loopNode
    
    // Build edges map for traversal
    const edgeMap = new Map<string, string[]>()
    edges.forEach(e => {
      if (!edgeMap.has(e.source)) edgeMap.set(e.source, [])
      edgeMap.get(e.source)!.push(e.target)
    })
    
    // Find start node (station with no incoming edges)
    const incomingEdges = new Set<string>()
    edges.forEach(e => incomingEdges.add(e.target))
    const startNode = stationNodes.find(n => !incomingEdges.has(n.id))
    
    if (!startNode) {
      console.warn('RouteSystem: No start station found')
      return null
    }
    
    // Traverse the route
    const waypointIds: string[] = []
    let currentNodeId = startNode.id
    const visited = new Set<string>()
    
    while (currentNodeId && stationNodes.some(n => n.id === currentNodeId)) {
      if (visited.has(currentNodeId)) break // Prevent infinite loops
      visited.add(currentNodeId)
      
      // Extract station machine ID from node data
      const stationId = currentNodeId.replace(/^station_/, '')
      const stationMachine = machines.find(m => m.id === stationId || (m.type as string) === 'dock_station' || (m.type as string) === 'rail_station')
      
      if (stationMachine) {
        waypointIds.push(stationMachine.id)
      }
      
      // Move to next station
      const nextNodes = edgeMap.get(currentNodeId) || []
      const nextStationNode = nextNodes
        .map(nId => nodes.find(n => n.id === nId))
        .find(n => n && (n.data?.nodeType === 'station' || n.type === 'station'))
      
      if (nextStationNode) {
        currentNodeId = nextStationNode.id
      } else {
        break
      }
    }
    
    if (waypointIds.length === 0) {
      console.warn('RouteSystem: No valid waypoints found')
      return null
    }
    
    return {
      id: `route_${Date.now()}`,
      waypointIds,
      currentWaypointIndex: 0,
      isActive: false,
      loop: shouldLoop,
    }
  }
  
  /**
   * Activate a route on a vehicle (boat/train)
   */
  static activateRoute(machine: Machine): boolean {
    if (!machine.route) return false
    machine.route.isActive = true
    machine.route.currentWaypointIndex = 0
    return true
  }
  
  /**
   * Deactivate a route
   */
  static deactivateRoute(machine: Machine): boolean {
    if (!machine.route) return false
    machine.route.isActive = false
    return true
  }
  
  /**
   * Get current waypoint for a vehicle
   */
  static getCurrentWaypoint(machine: Machine, machines: Machine[]): Machine | null {
    if (!machine.route || machine.route.waypointIds.length === 0) return null
    
    const waypointId = machine.route.waypointIds[machine.route.currentWaypointIndex]
    return machines.find(m => m.id === waypointId) || null
  }
  
  /**
   * Get all waypoints in a route
   */
  static getRouteWaypoints(machine: Machine, machines: Machine[]): Machine[] {
    if (!machine.route) return []
    
    return machine.route.waypointIds
      .map(id => machines.find(m => m.id === id))
      .filter(m => m !== undefined) as Machine[]
  }
}
