export class Profiler {
  private samples: number[] = []
  private readonly maxSamples = 120

  record(durationMs: number): void {
    this.samples.push(durationMs)
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }
  }

  getAverage(): number {
    if (this.samples.length === 0) return 0
    const sum = this.samples.reduce((a, b) => a + b, 0)
    return sum / this.samples.length
  }

  getMax(): number {
    return this.samples.reduce((m, v) => Math.max(m, v), 0)
  }
}
