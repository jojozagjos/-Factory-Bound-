import seedrandom from 'seedrandom'
import type { WorldMap, WorldTile, WorldModifier } from '../../types/game'

export class ProceduralGenerator {
  private rng: seedrandom.PRNG

  constructor(seed: number) {
    this.rng = seedrandom(seed.toString())
  }

  generateMap(width: number, height: number, modifiers: WorldModifier[] = []): WorldMap {
    const tiles = new Map<string, WorldTile>()
    
    // Generate base terrain using Perlin-like noise
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.generateTile(x, y, modifiers)
        tiles.set(`${x},${y}`, tile)
      }
    }

    // Apply modifiers
    modifiers.forEach(modifier => {
      this.applyModifier(tiles, modifier)
    })

    return {
      seed: parseInt(this.rng.int32().toString()),
      width,
      height,
      tiles,
      modifiers,
    }
  }

  private generateTile(x: number, y: number, _modifiers: WorldModifier[]): WorldTile {
    const noise = this.noise2D(x / 50, y / 50)
    
    let type: WorldTile['type'] = 'grass'
    let resource = undefined

    // Determine tile type based on noise
    if (noise < -0.3) {
      type = 'water'
    } else if (noise < 0) {
      type = 'sand'
    } else if (noise > 0.5) {
      type = 'stone'
    } else {
      type = 'grass'
    }

    // Add resources
    if (type === 'stone' && this.rng() > 0.7) {
      resource = {
        type: 'iron_ore',
        amount: Math.floor(100 + this.rng() * 400),
        richness: this.rng(),
      }
    } else if (type === 'grass' && this.rng() > 0.85) {
      resource = {
        type: 'copper_ore',
        amount: Math.floor(100 + this.rng() * 400),
        richness: this.rng(),
      }
    }

    return { x, y, type, resource }
  }

  private noise2D(x: number, y: number): number {
    // Simplified noise function using seeded random
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    
    const u = this.fade(xf)
    const v = this.fade(yf)
    
    // Hash coordinates
    const a = this.hash(X) + Y
    const b = this.hash(X + 1) + Y
    
    // Interpolate
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.hash(a), xf, yf), this.grad(this.hash(b), xf - 1, yf)),
      this.lerp(u, this.grad(this.hash(a + 1), xf, yf - 1), this.grad(this.hash(b + 1), xf - 1, yf - 1))
    )
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  private hash(_i: number): number {
    return Math.floor(this.rng() * 256) & 255
  }

  private applyModifier(tiles: Map<string, WorldTile>, modifier: WorldModifier): void {
    // Apply world modifiers to tiles
    if (modifier.effects.resourceMultiplier) {
      tiles.forEach(tile => {
        if (tile.resource) {
          tile.resource.amount *= modifier.effects.resourceMultiplier
        }
      })
    }
  }

  // Generate spawn points
  generateSpawnPoints(map: WorldMap, count: number): Array<{ x: number; y: number }> {
    const spawnPoints: Array<{ x: number; y: number }> = []
    const minDistance = Math.min(map.width, map.height) / 4

    for (let i = 0; i < count; i++) {
      let attempts = 0
      let point: { x: number; y: number } | null = null

      while (attempts < 100) {
        const x = Math.floor(this.rng() * map.width)
        const y = Math.floor(this.rng() * map.height)
        const tile = map.tiles.get(`${x},${y}`)

        if (tile && tile.type !== 'water') {
          const tooClose = spawnPoints.some(sp => {
            const dx = sp.x - x
            const dy = sp.y - y
            return Math.sqrt(dx * dx + dy * dy) < minDistance
          })

          if (!tooClose) {
            point = { x, y }
            break
          }
        }
        attempts++
      }

      if (point) {
        spawnPoints.push(point)
      }
    }

    return spawnPoints
  }
}
