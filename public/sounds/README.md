# Sound Effects Placeholders

This directory contains placeholder audio files for game sound effects.

## Required Sound Effects

Replace these placeholder `.mp3` files with actual sound effects:

### Building Sounds
- `place_building.mp3` - Sound when placing a machine
- `destroy_building.mp3` - Sound when destroying a machine
- `machine_working.mp3` - Ambient sound of machines operating

### Item Sounds
- `item_pickup.mp3` - Sound when collecting items
- `item_craft.mp3` - Sound when crafting completes
- `conveyor_move.mp3` - Sound of items moving on conveyors
- `inserter_grab.mp3` - Sound when inserter grabs item

### UI Sounds
- `button_click.mp3` - Generic button click sound

### Combat Sounds
- `enemy_hurt.mp3` - Sound when enemy takes damage
- `enemy_death.mp3` - Sound when enemy dies
- `turret_shoot.mp3` - Sound of turret firing
- `explosion.mp3` - Explosion sound effect

### Progression Sounds
- `victory.mp3` - Victory fanfare
- `defeat.mp3` - Defeat sound
- `level_up.mp3` - Level up sound
- `research_complete.mp3` - Technology research completed

### System Sounds
- `power_on.mp3` - Power connected sound
- `power_off.mp3` - Power disconnected sound

### Production Sounds
- `mining.mp3` - Mining drill sound
- `smelting.mp3` - Furnace/smelter sound

## Audio Specifications

**Recommended Format:** MP3 (128-320 kbps)
**Alternative Formats:** OGG, WAV (will need code changes)
**Duration:** 0.1s - 2s for effects
**Sample Rate:** 44.1 kHz or 48 kHz
**Channels:** Mono or Stereo

## Notes

- Keep file sizes small (< 100KB per effect)
- Normalize volume levels for consistency
- Consider looping for ambient sounds (machine_working, conveyor_move)
- Add variations if needed (e.g., explosion1.mp3, explosion2.mp3)
