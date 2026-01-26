import seedrandom from 'seedrandom'
import type { WorldMap, WorldTile, WorldModifier } from '../../types/game'

export class ProceduralGenerator {
  private rng: seedrandom.PRNG
  private perm: number[]

  constructor(seed: number) {
    this.rng = seedrandom(seed.toString())
    // Create a seeded permutation table (0..255) shuffled by the seeded RNG
    const p: number[] = Array.from({ length: 256 }, (_, i) => i)
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      const tmp = p[i]
      p[i] = p[j]
      p[j] = tmp
    }
    // Duplicate to avoid overflow in noise lookup
    this.perm = new Array(512)
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]
  }

  generateMap(width: number, height: number, modifiers: WorldModifier[] = []): WorldMap {
    const tiles = new Map<string, WorldTile>()
    
    // Generate base terrain using fractal noise (FBM) and an island mask
    const centerX = (width - 1) / 2
    const centerY = (height - 1) / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // compute elevation using FBM (fractal brownian motion)
        const nx = x / Math.max(width, height)
        const ny = y / Math.max(width, height)
        const elevation = this.fbm(nx * 3, ny * 3, 5)

        // radial falloff for island shape, modulated by a secondary noise so it's not a perfect circle
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const dNorm = dist / maxDist // 0=center, 1=edge
        const edgeNoise = this.fbm(nx * 1.5 + 10, ny * 1.5 + 10, 3) * 0.5
        const islandMask = Math.pow(dNorm, 1.6) * (0.8 + 0.6 * edgeNoise)

        // final value: elevation minus mask -> negative = water, positive = land
        const value = elevation - islandMask

        const tile = this.generateTileFromValue(x, y, value)
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

  // Fractal Brownian Motion - sum of octaves of noise2D
  private fbm(x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
    let amp = 1
    let freq = 1
    let sum = 0
    let max = 0
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.noise2D(x * freq, y * freq)
      max += amp
      amp *= gain
      freq *= lacunarity
    }
    return sum / max
  }

  // Create tile type & resources based on a combined elevation value
  private generateTileFromValue(x: number, y: number, value: number): WorldTile {
    let type: WorldTile['type'] = 'grass'
    let resource = undefined

    // thresholds tuned for island appearance
    if (value < -0.05) {
      type = 'water'
    } else if (value < 0) {
      type = 'sand'
    } else if (value > 0.55) {
      type = 'stone'
    } else {
      type = 'grass'
    }

    // resource clustering using another FBM and seeded RNG
    const resourceNoise = this.fbm(x / 20, y / 20, 3)
    if ((type === 'stone' || type === 'grass') && this.rng() > 0.6 && resourceNoise > 0.45) {
      resource = {
        type: 'iron_ore',
        amount: Math.floor(150 + this.rng() * 600),
        richness: Math.min(1, Math.max(0.3, resourceNoise)),
      }
    } else if (type === 'grass' && this.rng() > 0.75 && resourceNoise < -0.45) {
      resource = {
        type: 'copper_ore',
        amount: Math.floor(120 + this.rng() * 500),
        richness: Math.min(1, Math.max(0.3, -resourceNoise)),
      }
    } else if (type === 'grass' && this.rng() > 0.85 && resourceNoise > 0.35 && resourceNoise < 0.45) {
      resource = {
        type: 'coal',
        amount: Math.floor(80 + this.rng() * 300),
        richness: Math.min(1, Math.max(0.2, resourceNoise - 0.35)),
      }
    } else if (type === 'grass' && this.rng() > 0.8 && resourceNoise < -0.35 && resourceNoise > -0.6) {
      resource = {
        type: 'stone',
        amount: Math.floor(100 + this.rng() * 400),
        richness: Math.min(1, Math.max(0.3, -resourceNoise + 0.35)),
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

  private hash(i: number): number {
    // Use the seeded permutation table for deterministic, seed-dependent hashing
    return this.perm[i & 255]
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
