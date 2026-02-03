import type { TutorialStep } from '../../types/game'

/**
 * Enhanced tutorial steps with completion validation
 * Each step requires the player to actually complete the task before progressing
 */
export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Factory Bound!',
    description: 'Welcome to Factory Bound! In this game, you\'ll build an automated factory, defend against enemies, and research new technologies. Let\'s start with the basics.',
    position: 'center',
    objective: 'Click "Next" to continue',
    completionCondition: () => true, // Always allow first step
  },
  {
    id: 'camera_controls',
    title: 'Camera Controls',
    description: 'Use WASD or Arrow keys to pan the camera around the map. Try it now! Move your camera at least 50 pixels in any direction to continue.',
    position: 'center',
    objective: 'Move the camera to explore',
    completionCondition: (state: any) => {
      // Check if camera has moved from initial position
      const camera = state.camera || { x: 0, y: 0 }
      return Math.abs(camera.x) > 50 || Math.abs(camera.y) > 50
    },
  },
  {
    id: 'resources_intro',
    title: 'Understanding Resources',
    description: 'The map contains various resources like Iron Ore and Copper Ore. These are essential for building your factory. Resources appear as colored patches on the ground.',
    target: '.resource-display',
    position: 'bottom',
    objective: 'Click "Next" to continue',
    completionCondition: () => true,
  },
  {
    id: 'building_menu',
    title: 'Build Menu',
    description: 'Click the "Build" button (B key) to open the build menu. This is where you\'ll find all available machines.',
    target: '.quick-btn:nth-child(4)',
    position: 'bottom',
    objective: 'Open the build menu',
    completionCondition: (state: any) => state.buildMenuOpen === true,
  },
  {
    id: 'place_miner',
    title: 'Placing Your First Miner',
    description: 'Miners extract resources from ore patches. Select "Miner" from the build menu and place it on an ore patch. The miner will turn green when in a valid location.',
    position: 'center',
    objective: 'Place a miner on an ore patch',
    completionCondition: (state: any) => {
      // Check if player has placed at least one miner
      return (state.machines || []).some((m: any) => m.type === 'miner')
    },
  },
  {
    id: 'transport_belts',
    title: 'Transport Belts',
    description: 'Belts move items between machines. Place at least 3 belt segments to create a transport line. Belts automatically connect to adjacent belts.',
    position: 'center',
    objective: 'Place 3 transport belts',
    completionCondition: (state: any) => {
      const beltCount = (state.machines || []).filter((m: any) => m.type === 'belt').length
      return beltCount >= 3
    },
  },
  {
    id: 'inserters',
    title: 'Inserters',
    description: 'Inserters transfer items from one machine to another. Place an inserter between two machines or between a belt and a machine. The inserter\'s arm shows the transfer direction.',
    position: 'center',
    objective: 'Place an inserter',
    completionCondition: (state: any) => {
      return (state.machines || []).some((m: any) => m.type === 'inserter')
    },
  },
  {
    id: 'assemblers',
    title: 'Assemblers and Crafting',
    description: 'Assemblers craft items using recipes. Build an assembler - it will appear in your machine list once placed.',
    position: 'center',
    objective: 'Build an assembler',
    completionCondition: (state: any) => {
      return (state.machines || []).some((m: any) => m.type === 'assembler')
    },
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Press E or click the Inventory button to view your items. Open your inventory now to continue.',
    target: '.quick-btn:nth-child(1)',
    position: 'bottom',
    objective: 'Open your inventory',
    completionCondition: (state: any) => state.inventoryOpen === true,
  },
  {
    id: 'tech_tree',
    title: 'Research and Technology',
    description: 'Press T or click the Tech Tree button to see available technologies. Open the tech tree to continue.',
    target: '.quick-btn:nth-child(3)',
    position: 'bottom',
    objective: 'View the tech tree',
    completionCondition: (state: any) => state.techTreeOpen === true,
  },
  {
    id: 'node_editor_intro',
    title: 'Introduction to Node Programming',
    description: 'The Node Editor (R key) lets you program machine behavior using visual nodes! This is a powerful tool for automation. Open the Node Editor now.',
    target: '.quick-btn:nth-child(2)',
    position: 'bottom',
    objective: 'Open the Node Editor',
    completionCondition: (state: any) => state.nodeEditorOpen === true,
  },
  {
    id: 'node_basics_1',
    title: 'Node Editor: Input Nodes',
    description: 'In the Node Editor, click "Input" to add a sensor node. Input nodes read data from machines like inventory count, power status, or health.',
    position: 'center',
    objective: 'Add an Input node',
    completionCondition: (state: any) => {
      // Check if there's at least one input node in the current program
      return (state.currentNodeProgram?.nodes || []).some((n: any) => n.type === 'input')
    },
  },
  {
    id: 'node_basics_2',
    title: 'Node Editor: Logic Nodes',
    description: 'Click "Condition" to add a logic node. Logic nodes compare values and make decisions. For example, "If inventory > 100".',
    position: 'center',
    objective: 'Add a Condition node',
    completionCondition: (state: any) => {
      return (state.currentNodeProgram?.nodes || []).some((n: any) => 
        n.type === 'default' || n.data?.nodeType === 'condition'
      )
    },
  },
  {
    id: 'node_basics_3',
    title: 'Node Editor: Output Nodes',
    description: 'Click "Output" to add an action node. Output nodes control machines - they can enable/disable them or change their recipes.',
    position: 'center',
    objective: 'Add an Output node',
    completionCondition: (state: any) => {
      return (state.currentNodeProgram?.nodes || []).some((n: any) => n.type === 'output')
    },
  },
  {
    id: 'node_basics_4',
    title: 'Node Editor: Connecting Nodes',
    description: 'Connect your nodes by dragging from one node\'s output to another\'s input. Create at least one connection to build a simple program.',
    position: 'center',
    objective: 'Connect nodes together',
    completionCondition: (state: any) => {
      return (state.currentNodeProgram?.connections || []).length > 0
    },
  },
  {
    id: 'node_save',
    title: 'Node Editor: Saving Programs',
    description: 'Click "Save Program" to save your node program. Saved programs can be loaded and applied to machines. Save your program now!',
    position: 'center',
    objective: 'Save your node program',
    completionCondition: (state: any) => {
      // Check if user has saved at least one program
      return (state.savedNodePrograms || 0) > 0
    },
  },
  {
    id: 'tutorial_complete',
    title: 'Tutorial Complete!',
    description: 'Excellent work! You\'ve learned:\n• Building and placing machines\n• Creating transport networks\n• Using the node editor for automation\n\nNow build your factory empire!',
    position: 'center',
    objective: 'Start playing!',
    completionCondition: () => true,
  },
]
