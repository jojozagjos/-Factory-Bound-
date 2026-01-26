import type { TutorialStep, GameState } from '@/types/game.ts'

type TutorialMetrics = GameState & {
  nodeCount?: number
  inputNodeCount?: number
  logicNodeCount?: number
  outputNodeCount?: number
  edgeCount?: number
  testRunCount?: number
  savedProgramCount?: number
  wavesSurvived?: number
  turretsBuilt?: number
  ammoDelivered?: number
  wallsBuilt?: number
  sessionCreated?: boolean
  playerCount?: number
  cooperativeActions?: number
  chainedMachines?: number
}

/**
 * Progressive tutorial system teaching:
 * 1. Node programming basics
 * 2. Combat mechanics
 * 3. Co-op multiplayer
 * 4. Advanced automation strategies
 */
export class EnhancedTutorial {
  static readonly TUTORIALS = {
    NODE_BASICS: 'node_basics',
    COMBAT_101: 'combat_101',
    COOP_INTRO: 'coop_intro',
    ADVANCED_AUTOMATION: 'advanced_automation',
  }

  static getTutorialSteps(tutorialId: string): TutorialStep[] {
    switch (tutorialId) {
      case this.TUTORIALS.NODE_BASICS:
        return this.nodeBasicsTutorial()
      case this.TUTORIALS.COMBAT_101:
        return this.combat101Tutorial()
      case this.TUTORIALS.COOP_INTRO:
        return this.coopIntroTutorial()
      case this.TUTORIALS.ADVANCED_AUTOMATION:
        return this.advancedAutomationTutorial()
      default:
        return []
    }
  }

  private static nodeBasicsTutorial(): TutorialStep[] {
    return [
      {
        id: 'node_intro',
        title: 'Welcome to Node Programming',
        description: 'Learn to program machines using visual nodes instead of writing code.',
        target: '.node-editor',
        position: 'center',
        objective: 'Open the Node Editor and place your first sensor node',
        completionCondition: (state: TutorialMetrics) => (state.nodeCount ?? 0) > 0,
      },
      {
        id: 'node_sensors',
        title: 'Input Sensors',
        description: 'Input nodes read data from machines:\n• Inventory Count\n• Power Status\n• Health Level\n\nThey convert sensor data into numbers 0-1.',
        target: '.node-toolbar-btn:first',
        position: 'right',
        objective: 'Place 3 different input sensor nodes',
        completionCondition: (state: TutorialMetrics) => (state.inputNodeCount ?? 0) >= 3,
      },
      {
        id: 'node_logic',
        title: 'Logic Nodes',
        description: 'Logic nodes process inputs:\n• Greater Than / Less Than\n• AND / OR gates\n• Addition / Multiplication\n\nConnect them to process sensor values.',
        target: '.node-toolbar-btn:nth-child(2)',
        position: 'right',
        objective: 'Add a comparison (greater than) node',
        completionCondition: (state: TutorialMetrics) => (state.logicNodeCount ?? 0) >= 1,
      },
      {
        id: 'node_output',
        title: 'Output Actions',
        description: 'Output nodes control machine behavior:\n• Enable/Disable Machine\n• Activate Recipe\n• Drain Inventory\n\nThey execute actions based on logic results.',
        target: '.node-toolbar-btn:last',
        position: 'right',
        objective: 'Place an output action node',
        completionCondition: (state: TutorialMetrics) => (state.outputNodeCount ?? 0) >= 1,
      },
      {
        id: 'node_wiring',
        title: 'Connecting Nodes',
        description: 'Drag from output handles to input handles to create connections.\nData flows from left (inputs) → center (logic) → right (outputs).',
        target: '.node-canvas',
        position: 'center',
        objective: 'Create a connection between nodes',
        completionCondition: (state: TutorialMetrics) => (state.edgeCount ?? 0) >= 1,
      },
      {
        id: 'node_test',
        title: 'Test Your Program',
        description: 'Click "Test Run" to simulate your program on a sandbox machine.\nWatch the results to debug and iterate.',
        target: '.toolbar-btn:contains("Test")',
        position: 'bottom',
        objective: 'Run a successful test',
        completionCondition: (state: TutorialMetrics) => (state.testRunCount ?? 0) >= 1,
      },
      {
        id: 'node_save',
        title: 'Save Your Program',
        description: 'Click "Save Program" to persist your logic.\nPrograms are saved locally and can be loaded later or bound to machines.',
        target: '.toolbar-btn.save-btn',
        position: 'bottom',
        objective: 'Save a node program',
        completionCondition: (state: TutorialMetrics) => (state.savedProgramCount ?? 0) >= 1,
      },
    ]
  }

  private static combat101Tutorial(): TutorialStep[] {
    return [
      {
        id: 'combat_intro',
        title: 'Defense Against Enemies',
        description: 'Enemies will periodically attack your base. Defend using turrets and walls.',
        target: '.game-canvas',
        position: 'center',
        objective: 'Survive the first enemy wave',
        completionCondition: (state: TutorialMetrics) => (state.wavesSurvived ?? 0) >= 1,
      },
      {
        id: 'turret_placement',
        title: 'Place a Turret',
        description: 'Turrets automatically target and shoot enemies in range.\nThey require power and ammunition to operate.',
        target: '.build-menu',
        position: 'left',
        objective: 'Build and power a turret',
        completionCondition: (state: TutorialMetrics) => (state.turretsBuilt ?? 0) >= 1,
      },
      {
        id: 'ammo_supply',
        title: 'Ammunition Supply',
        description: 'Use conveyor belts and inserters to feed ammo magazines to your turrets.\nWithout ammo, turrets cannot fire.',
        target: '.inventory',
        position: 'bottom',
        objective: 'Deliver ammo to a turret',
        completionCondition: (state: TutorialMetrics) => (state.ammoDelivered ?? 0) > 0,
      },
      {
        id: 'walls',
        title: 'Build Walls',
        description: 'Walls slow down enemies and protect key structures.\nPlace them strategically around important buildings.',
        target: '.build-menu',
        position: 'left',
        objective: 'Build at least 5 wall segments',
        completionCondition: (state: TutorialMetrics) => (state.wallsBuilt ?? 0) >= 5,
      },
    ]
  }

  private static coopIntroTutorial(): TutorialStep[] {
    return [
      {
        id: 'coop_lobby',
        title: 'Host a Co-op Game',
        description: 'Start a multiplayer game by hosting a session.\nYour friends can join using the lobby code.',
        target: '.multiplayer-lobby',
        position: 'center',
        objective: 'Create a co-op session',
        completionCondition: (state: TutorialMetrics) => state.sessionCreated === true,
      },
      {
        id: 'coop_sync',
        title: 'Shared Factory',
        description: 'In co-op, all players share the same world and factory.\nEveryone can build, remove, and program machines.',
        target: '.game-canvas',
        position: 'center',
        objective: 'Have another player join',
        completionCondition: (state: TutorialMetrics) => (state.playerCount ?? 0) >= 2,
      },
      {
        id: 'coop_roles',
        title: 'Roles & Coordination',
        description: 'Assign roles:\n• Engineers: Build & optimize production\n• Soldiers: Build defenses\n• Researchers: Unlock technologies\nCoordinate to succeed.',
        target: '.player-list',
        position: 'left',
        objective: 'Work together with another player',
        completionCondition: (state: TutorialMetrics) => (state.cooperativeActions ?? 0) >= 3,
      },
    ]
  }

  private static advancedAutomationTutorial(): TutorialStep[] {
    return [
      {
        id: 'advanced_circuits',
        title: 'Complex Logic Circuits',
        description: 'Combine multiple sensors and gates to create sophisticated control logic.\nExample: "Enable if (inventory < 100) AND (power available)"',
        target: '.node-editor',
        position: 'center',
        objective: 'Create a multi-input logic program',
        completionCondition: (state: TutorialMetrics) => (state.nodeCount ?? 0) >= 5,
      },
      {
        id: 'advanced_chaining',
        title: 'Machine Chaining',
        description: 'Use node programs to coordinate multiple machines.\nExample: Feed one assembler output into another for a production line.',
        target: '.game-canvas',
        position: 'center',
        objective: 'Create a multi-machine production chain',
        completionCondition: (state: TutorialMetrics) => (state.chainedMachines ?? 0) >= 3,
      },
    ]
  }

  /**
   * Check if player has completed a tutorial
   */
  static isTutorialComplete(tutorialId: string, completedSteps: string[]): boolean {
    const steps = this.getTutorialSteps(tutorialId)
    const requiredSteps = steps.map(s => s.id)
    return requiredSteps.every(id => completedSteps.includes(id))
  }

  /**
   * Get next tutorial to unlock (progression)
   */
  static getNextTutorial(completedTutorials: string[]): string | null {
    const order = [
      this.TUTORIALS.NODE_BASICS,
      this.TUTORIALS.COMBAT_101,
      this.TUTORIALS.COOP_INTRO,
      this.TUTORIALS.ADVANCED_AUTOMATION,
    ]

    for (const tutorial of order) {
      if (!completedTutorials.includes(tutorial)) {
        return tutorial
      }
    }

    return null // All tutorials completed
  }
}
