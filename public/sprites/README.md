# Sprite/Texture Placeholders

This directory contains placeholder sprite and texture files for the game.

## Required Sprites

Replace these placeholder image files with actual game sprites:

### Machine Sprites
- `miner.png` - Mining drill sprite (64x64px)
- `assembler.png` - Assembling machine sprite (64x64px)
- `smelter.png` - Smelting furnace sprite (64x64px)
- `belt.png` - Conveyor belt sprite (64x64px, 4 frames for animation)
- `inserter.png` - Inserter arm sprite (64x64px, multiple rotations)
- `turret.png` - Defense turret sprite (64x64px)
- `power_plant.png` - Power generator sprite (64x64px)
- `storage.png` - Storage container sprite (64x64px)

### Enemy Sprites
- `biter_small.png` - Small enemy sprite (32x32px)
- `biter_medium.png` - Medium enemy sprite (48x48px)
- `biter_large.png` - Large enemy sprite (64x64px)
- `spitter.png` - Ranged enemy sprite (48x48px)

### Item Icons
- `iron_ore.png` - Iron ore icon (32x32px)
- `copper_ore.png` - Copper ore icon (32x32px)
- `iron_plate.png` - Iron plate icon (32x32px)
- `copper_plate.png` - Copper plate icon (32x32px)
- `iron_gear.png` - Iron gear icon (32x32px)
- `electronic_circuit.png` - Circuit icon (32x32px)
- `stone.png` - Stone icon (32x32px)

### Terrain Tiles
- `grass.png` - Grass terrain tile (50x50px)
- `water.png` - Water terrain tile (50x50px, animated)
- `stone_tile.png` - Stone terrain tile (50x50px)
- `sand.png` - Sand terrain tile (50x50px)

### Effects
- `explosion.png` - Explosion sprite sheet (128x128px, 8 frames)
- `laser.png` - Laser beam sprite (variable length)
- `projectile.png` - Bullet/projectile sprite (16x16px)
- `smoke.png` - Smoke particle sprite (32x32px, 4 frames)
- `spark.png` - Spark effect sprite (16x16px)

### UI Elements
- `button_normal.png` - Button background (variable)
- `button_hover.png` - Button hover state (variable)
- `button_pressed.png` - Button pressed state (variable)
- `panel.png` - UI panel background (9-slice, 32x32px min)
- `health_bar.png` - Health bar sprite (100x10px)
- `minimap_bg.png` - Minimap background (200x200px)

## Image Specifications

**Format:** PNG with transparency
**Color Depth:** 32-bit RGBA
**Compression:** Optimized (use tools like TinyPNG)
**Sprite Sheets:** Use standard grid layout
**Naming:** lowercase with underscores

### Size Guidelines
- **Machines:** 64x64px
- **Items:** 32x32px
- **Enemies:** 32-64px depending on size
- **Terrain:** 50x50px (matches grid size)
- **Effects:** Variable, typically 32-128px

## Animation Sprites

For animated sprites, use sprite sheets:
- **Format:** Horizontal strip or grid
- **Frame Size:** Consistent across all frames
- **Frame Count:** Power of 2 if possible (2, 4, 8, 16)
- **Timing:** 60 FPS standard

Example for belt animation:
```
belt.png: [frame1][frame2][frame3][frame4]
Total width: 256px (64x4)
Height: 64px
```

## Art Style

Factory Bound uses a:
- **Top-down** perspective
- **Pixel art** or **low-poly 2D rendered** style
- **Industrial/sci-fi** aesthetic
- **Consistent lighting** (top-down light source)
- **Clear silhouettes** for gameplay clarity

## Notes

- All sprites should have consistent lighting and perspective
- Use consistent color palette across all assets
- Provide multiple rotation angles for directional machines
- Consider providing different states (working/idle/damaged)
- Optimize file sizes while maintaining visual quality
- Use sprite atlases for better performance (TODO: implement)
