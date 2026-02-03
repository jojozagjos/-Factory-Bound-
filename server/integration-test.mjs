#!/usr/bin/env node

/**
 * Multiplayer Integration Test
 * Tests the connection between client and server
 */

import { io } from 'socket.io-client'

const SERVER_URL = 'http://localhost:3001'
const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
}

let testsPassed = 0
let testsFailed = 0

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

function testResult(passed, name) {
  if (passed) {
    log(`✓ PASS: ${name}`, 'green')
    testsPassed++
  } else {
    log(`✗ FAIL: ${name}`, 'red')
    testsFailed++
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runTests() {
  log('\n================================', 'blue')
  log('Multiplayer Integration Tests', 'blue')
  log('================================\n', 'blue')

  // Test 1: Health endpoint
  log('Test 1: Server Health Check', 'yellow')
  try {
    const response = await fetch(`${SERVER_URL}/health`)
    const data = await response.json()
    testResult(response.ok && data.status === 'ok', 'Health endpoint')
  } catch (error) {
    testResult(false, `Health endpoint - ${error.message}`)
  }

  // Test 2: WebSocket connection
  log('\nTest 2: WebSocket Connection', 'yellow')
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  })

  const connected = await new Promise((resolve) => {
    socket.on('connect', () => resolve(true))
    socket.on('connect_error', () => resolve(false))
    setTimeout(() => resolve(false), 5000)
  })

  testResult(connected, 'WebSocket connection')

  if (!connected) {
    log('\nCannot proceed with further tests - server not connected', 'red')
    process.exit(1)
  }

  // Test 3: Create session
  log('\nTest 3: Session Creation', 'yellow')
  const sessionSettings = {
    gameMode: 'coop',
    maxPlayers: 4,
    difficulty: 'normal',
    pvpEnabled: false,
    friendlyFire: false,
    worldSeed: Date.now(),
    modifiers: [],
    enemiesEnabled: true,
    enemyFactoriesEnabled: false,
    oceanEnemiesEnabled: false,
    maxEnemyBases: 5
  }

  const sessionCreated = await new Promise((resolve) => {
    socket.emit('create_session', sessionSettings, (session) => {
      resolve(session && session.id)
    })
    setTimeout(() => resolve(false), 5000)
  })

  testResult(!!sessionCreated, 'Session creation')

  // Test 4: List sessions
  log('\nTest 4: List Sessions', 'yellow')
  const sessionsListed = await new Promise((resolve) => {
    socket.emit('list_sessions', { mode: 'coop' }, (result) => {
      resolve(result.success && Array.isArray(result.sessions))
    })
    setTimeout(() => resolve(false), 5000)
  })

  testResult(sessionsListed, 'List sessions')

  // Test 5: Join session
  log('\nTest 5: Join Session', 'yellow')
  const socket2 = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  })

  await new Promise(resolve => {
    socket2.on('connect', resolve)
    setTimeout(resolve, 2000)
  })

  const sessionJoined = await new Promise((resolve) => {
    if (sessionCreated) {
      const player = {
        id: 'test_player_2',
        username: 'Test Player',
        position: { x: 0, y: 0 },
        inventory: [],
        health: 100,
        maxHealth: 100,
        stats: {
          level: 1,
          experience: 0,
          prestigeLevel: 0,
          unlockedTech: [],
          completedResearch: []
        }
      }

      socket2.emit('join_session', { sessionId: sessionCreated, player }, (result) => {
        resolve(result.success)
      })
      setTimeout(() => resolve(false), 5000)
    } else {
      resolve(false)
    }
  })

  testResult(sessionJoined, 'Join session')

  // Cleanup
  socket.disconnect()
  socket2.disconnect()

  await delay(500)

  // Summary
  log('\n================================', 'blue')
  log('Test Summary', 'blue')
  log('================================', 'blue')
  log(`Passed: ${testsPassed}`, 'green')
  log(`Failed: ${testsFailed}`, 'red')
  log('')

  if (testsFailed === 0) {
    log('✓ All tests passed!', 'green')
    process.exit(0)
  } else {
    log('✗ Some tests failed', 'red')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  log(`\nTest error: ${error.message}`, 'red')
  process.exit(1)
})
