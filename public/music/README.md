# Music Placeholders

This directory contains placeholder audio files for game background music.

## Required Music Tracks

Replace these placeholder `.mp3` files with actual music:

### Menu Music
- `menu_theme.mp3` - Background music for main menu
  - Mood: Upbeat, welcoming, tech-inspired
  - Duration: 2-4 minutes (looping)

### Gameplay Music
- `gameplay_ambient.mp3` - Calm background music during normal gameplay
  - Mood: Focused, industrial, atmospheric
  - Duration: 3-5 minutes (looping)

- `gameplay_action.mp3` - Intense music during combat/enemy waves
  - Mood: Energetic, tense, driving
  - Duration: 2-4 minutes (looping)

### Event Music
- `victory_theme.mp3` - Music that plays on victory
  - Mood: Triumphant, celebratory
  - Duration: 30-60 seconds

- `defeat_theme.mp3` - Music that plays on defeat
  - Mood: Somber, reflective
  - Duration: 20-40 seconds

## Audio Specifications

**Recommended Format:** MP3 (192-320 kbps)
**Alternative Formats:** OGG (will need code changes)
**Duration:** See individual track notes above
**Sample Rate:** 44.1 kHz or 48 kHz
**Channels:** Stereo

## Music Style Guidelines

Factory Bound is an automation/factory building game, so music should:
- Have an industrial/mechanical feel
- Include synthesizers and electronic elements
- Be suitable for long listening sessions (not too repetitive)
- Match the sci-fi/tech aesthetic
- Support concentration during gameplay

## Notes

- All tracks should loop seamlessly
- Keep file sizes reasonable (< 5MB per track)
- Normalize volume levels across all tracks
- Consider dynamic music that changes with game state
- Provide crossfade-friendly intro/outro sections

## Integration

The AudioSystem automatically:
- Loops music tracks
- Fades between tracks (2s fade-in, 1s fade-out)
- Respects volume settings
- Handles browser autoplay restrictions
