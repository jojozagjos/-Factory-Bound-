import { describe, it, expect } from 'vitest'
import { ProceduralGenerator } from '../engine/procedural/MapGenerator'

describe('ProceduralGenerator', () => {
  it('should generate a map with the correct dimensions', () => {
    const seed = 12345
    const generator = new ProceduralGenerator(seed)
    const map = generator.generateMap(100, 100)

    expect(map.width).toBe(100)
    expect(map.height).toBe(100)
    expect(map.tiles.size).toBeGreaterThan(0)
  })

  it('should generate the same map for the same seed', () => {
    const seed = 67890
    const generator1 = new ProceduralGenerator(seed)
    const generator2 = new ProceduralGenerator(seed)

    const map1 = generator1.generateMap(50, 50)
    const map2 = generator2.generateMap(50, 50)

    // Compare first tile
    const tile1 = map1.tiles.get('0,0')
    const tile2 = map2.tiles.get('0,0')

    expect(tile1?.type).toBe(tile2?.type)
  })

  it('should generate spawn points with minimum distance', () => {
    const seed = 11111
    const generator = new ProceduralGenerator(seed)
    const map = generator.generateMap(200, 200)
    const spawnPoints = generator.generateSpawnPoints(map, 4)

    expect(spawnPoints.length).toBeGreaterThan(0)
    expect(spawnPoints.length).toBeLessThanOrEqual(4)

    // Check minimum distance between spawn points
    for (let i = 0; i < spawnPoints.length; i++) {
      for (let j = i + 1; j < spawnPoints.length; j++) {
        const dx = spawnPoints[i].x - spawnPoints[j].x
        const dy = spawnPoints[i].y - spawnPoints[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        expect(distance).toBeGreaterThan(30) // Minimum distance check
      }
    }
  })
})
