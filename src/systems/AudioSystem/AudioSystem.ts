/**
 * AudioSystem - Manages all game audio (music, sound effects, ambient sounds)
 * 
 * PLACEHOLDER SYSTEM - Replace audio files in /public/sounds/ and /public/music/
 * with actual audio assets. Currently uses silent placeholders.
 */

export type SoundEffect = 
  | 'place_building'
  | 'destroy_building'
  | 'machine_working'
  | 'item_pickup'
  | 'item_craft'
  | 'button_click'
  | 'enemy_hurt'
  | 'enemy_death'
  | 'turret_shoot'
  | 'explosion'
  | 'victory'
  | 'defeat'
  | 'level_up'
  | 'research_complete'
  | 'power_on'
  | 'power_off'
  | 'conveyor_move'
  | 'inserter_grab'
  | 'mining'
  | 'smelting'

export type MusicTrack =
  | 'menu_theme'
  | 'gameplay_ambient'
  | 'gameplay_action'
  | 'victory_theme'
  | 'defeat_theme'

interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  ambientVolume: number
  muted: boolean
}

class AudioSystem {
  private musicAudio: HTMLAudioElement | null = null
  private currentTrack: MusicTrack | null = null
  private sfxPool: Map<string, HTMLAudioElement[]> = new Map()
  private settings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    ambientVolume: 0.3,
    muted: false,
  }

  constructor() {
    this.initializeAudioPool()
  }

  /**
   * Initialize audio pool for sound effects
   * Creates multiple instances for simultaneous sounds
   */
  private initializeAudioPool() {
    const sfxList: SoundEffect[] = [
      'place_building',
      'destroy_building',
      'machine_working',
      'item_pickup',
      'item_craft',
      'button_click',
      'enemy_hurt',
      'enemy_death',
      'turret_shoot',
      'explosion',
      'victory',
      'defeat',
      'level_up',
      'research_complete',
      'power_on',
      'power_off',
      'conveyor_move',
      'inserter_grab',
      'mining',
      'smelting',
    ]

    // Create 3 instances of each sound for overlapping plays
    sfxList.forEach(sfx => {
      const instances: HTMLAudioElement[] = []
      for (let i = 0; i < 3; i++) {
        const audio = new Audio(`/sounds/${sfx}.mp3`)
        audio.volume = this.getEffectiveVolume('sfx')
        instances.push(audio)
      }
      this.sfxPool.set(sfx, instances)
    })
  }

  /**
   * Play a sound effect
   * Automatically finds an available audio instance
   */
  playSFX(effect: SoundEffect, volume: number = 1.0) {
    if (this.settings.muted) return

    const instances = this.sfxPool.get(effect)
    if (!instances) {
      console.warn(`Sound effect not found: ${effect}`)
      return
    }

    // Find first available (not playing) instance
    const available = instances.find(audio => audio.paused || audio.ended)
    const audio = available || instances[0]

    audio.volume = this.getEffectiveVolume('sfx') * volume
    audio.currentTime = 0
    audio.play().catch(() => {
      // Silent fail - browser may block autoplay
    })
  }

  /**
   * Play background music
   * Automatically loops and fades between tracks
   */
  playMusic(track: MusicTrack, fadeIn: boolean = true) {
    if (this.settings.muted) return

    // Stop current music if playing
    if (this.musicAudio && this.currentTrack !== track) {
      this.stopMusic(true)
    }

    // Don't restart same track
    if (this.currentTrack === track && this.musicAudio && !this.musicAudio.paused) {
      return
    }

    this.currentTrack = track
    this.musicAudio = new Audio(`/music/${track}.mp3`)
    this.musicAudio.loop = true
    this.musicAudio.volume = fadeIn ? 0 : this.getEffectiveVolume('music')

    this.musicAudio.play().catch(() => {
      // Silent fail - browser may block autoplay
    })

    // Fade in if requested
    if (fadeIn) {
      this.fadeMusicVolume(0, this.getEffectiveVolume('music'), 2000)
    }
  }

  /**
   * Stop currently playing music
   */
  stopMusic(fadeOut: boolean = true) {
    if (!this.musicAudio) return

    if (fadeOut) {
      this.fadeMusicVolume(this.musicAudio.volume, 0, 1000).then(() => {
        this.musicAudio?.pause()
        this.musicAudio = null
        this.currentTrack = null
      })
    } else {
      this.musicAudio.pause()
      this.musicAudio = null
      this.currentTrack = null
    }
  }

  /**
   * Fade music volume over time
   */
  private fadeMusicVolume(from: number, to: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      if (!this.musicAudio) {
        resolve()
        return
      }

      const steps = 20
      const stepTime = duration / steps
      const stepSize = (to - from) / steps
      let currentStep = 0

      const interval = setInterval(() => {
        if (!this.musicAudio) {
          clearInterval(interval)
          resolve()
          return
        }

        currentStep++
        this.musicAudio.volume = Math.max(0, Math.min(1, from + stepSize * currentStep))

        if (currentStep >= steps) {
          clearInterval(interval)
          resolve()
        }
      }, stepTime)
    })
  }

  /**
   * Calculate effective volume based on settings
   */
  private getEffectiveVolume(type: 'music' | 'sfx' | 'ambient'): number {
    const typeVolume = this.settings[`${type}Volume`]
    return this.settings.masterVolume * typeVolume
  }

  /**
   * Update audio settings
   */
  updateSettings(settings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...settings }

    // Update music volume immediately
    if (this.musicAudio) {
      this.musicAudio.volume = this.getEffectiveVolume('music')
    }

    // Update SFX pool volumes
    this.sfxPool.forEach(instances => {
      instances.forEach(audio => {
        audio.volume = this.getEffectiveVolume('sfx')
      })
    })
  }

  /**
   * Get current settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings }
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted: boolean) {
    this.settings.muted = muted
    if (this.musicAudio) {
      this.musicAudio.muted = muted
    }
  }

  /**
   * Cleanup - stop all audio
   */
  cleanup() {
    this.stopMusic(false)
    this.sfxPool.forEach(instances => {
      instances.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    })
    this.sfxPool.clear()
  }
}

// Singleton instance
export const audioSystem = new AudioSystem()
export default AudioSystem
