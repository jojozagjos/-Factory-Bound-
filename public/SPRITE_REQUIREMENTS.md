# Factory Bound - Sprite Requirements

Complete list of all sprites needed for Factory Bound based on Builderment v5.0 exact progression.

## Directory Structure
```
public/sprites/
├── machines/
├── items/
├── resources/
├── belts/
├── transport/
└── decorative/
```

---

## TIER 1: Basic Extraction & Crafting

### Extractors & Raw Processing
- `extractor_1.png` - Basic extractor machine (1x1)
- `gem_tree.png` - Gem tree (produces gold ore) (1x1)

### Crafting Buildings
- `workshop.png` - Workshop crafting machine (2x2)
- `furnace.png` - Furnace for smelting (2x2)

### Storage
- `gold_vault.png` - Gold storage vault (3x3)
- `storage_silo.png` - Generic item storage silo (2x2)

### Transport & Movement
- `belt_1.png` - Basic conveyor belt T1 (60 items/min) (1x1)
- `robotic_arm_1.png` - Basic robotic arm (1x1)
- `splitter.png` - Belt splitter/merger (1x1)

### Special
- `research_lab.png` - Research lab for item absorption (3x3)

---

## TIER 2: Mid-Game Production

### Crafting & Processing
- `machine_shop.png` - Advanced crafting (3x3)
- `forge.png` - High-tier furnace for steel/tungsten (3x3)

### Transport Belts & Arms
- `belt_2.png` - Fast conveyor belt T2 (120 items/min) (1x1)
- `robotic_arm_fast.png` - Fast robotic arm (1x1)
- `robotic_arm_long.png` - Extended reach robotic arm (1x1)

### NEW: Boats & Water Transport
- `boat_1.png` - Cargo boat T1 (1x1, capacity 50 items)
- `boat_1_left.png` - Boat facing left variant
- `boat_1_right.png` - Boat facing right variant
- `boat_1_up.png` - Boat facing up variant
- `boat_1_down.png` - Boat facing down variant
- `boat_1_moving.png` or `boat_1_animation_*.png` (4-8 frames) - Water movement animation

### NEW: Dock Stations
- `dock_station.png` - Boat loading/unloading dock (3x3)
- `dock_station_working.png` - Dock animation when transferring items

### Logic & Power
- `logic_gate.png` - Configurable logic gate (AND/OR/NOT/XOR) (1x1)
- `coal_power_plant.png` - Coal-powered power plant (3x3)

### Extractors (Tier 2)
- `extractor_2.png` - Upgraded extractor T2 (1x1)

---

## TIER 3: High-Tier Production

### Crafting
- `industrial_factory.png` - Large factory for computing (4x4)

### Transport
- `belt_3.png` - Express conveyor belt T3 (240 items/min) (1x1)

### NEW: Trains & Rail
- `rail.png` - Rail track segment (1x1, can be rotated)
- `rail_corner.png` - Rail corner piece (1x1)
- `rail_junction.png` - Rail junction (1x1)
- `rail_station.png` - Train loading/unloading station (3x3)
- `rail_station_working.png` - Station animation when transferring

- `train_1.png` - Cargo train T1 (2x1, capacity 100 items)
- `train_1_left.png` - Train facing left
- `train_1_right.png` - Train facing right
- `train_1_up.png` - Train facing up
- `train_1_down.png` - Train facing down
- `train_1_moving.png` or `train_1_animation_*.png` (4-8 frames) - Rail movement animation
- `train_1_smoke.png` - Smoke particle effect for moving train

### Boats (Tier 2+)
- `boat_2.png` - Cargo boat T2 (1x1, capacity 100 items, speed 8)
- `boat_2_left.png`, `boat_2_right.png`, `boat_2_up.png`, `boat_2_down.png`
- `boat_2_moving.png` or `boat_2_animation_*.png` (4-8 frames)

### Extractors & Special
- `extractor_3.png` - Extractor T3 (1x1)

---

## TIER 4: Ultra-High-Tier

### Crafting
- `manufacturer.png` - Ultimate manufacturing facility (5x5)

### Transport
- `belt_4.png` - Ultra-fast belt T4 (480 items/min) (1x1)

### Power
- `nuclear_power_plant.png` - Nuclear reactor (4x4)
- `nuclear_power_plant_active.png` - Nuclear plant animation (glow effect)
- `nuclear_cooling_tower_animation.png` (8+ frames) - Cooling steam

### Boats (Tier 3)
- `boat_3.png` - Cargo boat T3 (1x1, capacity 200 items, speed 12)
- `boat_3_left.png`, `boat_3_right.png`, `boat_3_up.png`, `boat_3_down.png`
- `boat_3_moving.png` or `boat_3_animation_*.png` (4-8 frames)

### Trains (Tier 3)
- `train_2.png` - Cargo train T2 (2x1, capacity 200 items, speed 15)
- `train_2_left.png`, `train_2_right.png`, `train_2_up.png`, `train_2_down.png`
- `train_2_moving.png` or `train_2_animation_*.png` (4-8 frames)
- `train_2_smoke.png` (multiple frames for continuous smoke)

### Extractors
- `extractor_4.png` - Extractor T4 (1x1)

---

## TIER 5: End-Game

### Legendary Machines
- `earth_transporter.png` - The end-game objective building (6x6)
- `earth_transporter_active.png` - Animation when producing tokens
- `earth_transporter_beam.png` (8+ frames) - Energy beam animation

- `matter_duplicator.png` - Infinite resource duplication (5x5)
- `matter_duplicator_active.png` - Animation when duplicating
- `matter_duplicator_glow.png` (8+ frames) - Glowing animation

### Extractors
- `extractor_5.png` - Extractor T5 (1x1)

### Boats (Tier 4)
- `boat_4.png` - Cargo boat T4 (1x1, capacity 300 items, speed 15)
- `boat_4_left.png`, `boat_4_right.png`, `boat_4_up.png`, `boat_4_down.png`
- `boat_4_moving.png` or `boat_4_animation_*.png` (4-8 frames)

### Trains (Tier 4)
- `train_3.png` - Cargo train T3 (2x1, capacity 300 items, speed 20)
- `train_3_left.png`, `train_3_right.png`, `train_3_up.png`, `train_3_down.png`
- `train_3_moving.png` or `train_3_animation_*.png` (4-8 frames)
- `train_3_smoke.png` (multiple frames)

- `train_4.png` - Cargo train T4 (2x1, capacity 500 items, speed 25)
- `train_4_left.png`, `train_4_right.png`, `train_4_up.png`, `train_4_down.png`
- `train_4_moving.png` or `train_4_animation_*.png` (4-8 frames)
- `train_4_smoke.png` (multiple frames)

---

## ITEMS & COMPONENTS

### Raw Resources
- `wood_log.png` - Stacked wood
- `stone.png` - Stone chunk
- `iron_ore.png` - Iron ore cluster
- `copper_ore.png` - Copper ore cluster
- `coal.png` - Coal lump
- `wolframite.png` - Tungsten ore
- `uranium_ore.png` - Radioactive uranium
- `gold_ore.png` - Gold nugget

### Processed Materials (T1)
- `wood_plank.png` - Cut wood board
- `sand.png` - Sand pile
- `iron_ingot.png` - Smelted iron bar
- `copper_wire.png` - Spooled copper wire

### Crafted Components (T2)
- `wood_frame.png` - Wooden frame structure
- `iron_plating.png` - Metal plating sheet
- `iron_gear.png` - Gear wheel
- `glass.png` - Glass pane
- `silicon.png` - Silicon wafer
- `steel.png` - Steel ingot
- `steel_rod.png` - Steel rod bar
- `graphite.png` - Graphite block
- `concrete.png` - Concrete block

### Advanced Components (T3)
- `metal_frame.png` - Metal frame assembly
- `electromagnet.png` - Magnet coil
- `battery.png` - Energy battery
- `rotor.png` - Rotating rotor
- `electric_motor.png` - Electric motor
- `heat_sink.png` - Cooling heat sink
- `plastic.png` - Plastic sheet
- `condenser_lens.png` - Optical lens

### High-Tier Components (T4)
- `logic_circuit.png` - Circuit board
- `nano_wire.png` - Nano-scale wire
- `computer.png` - Computer unit
- `gyroscope.png` - Spinning gyroscope
- `tungsten_ore.png` - Tungsten ingot
- `tungsten_carbide.png` - Hardened tungsten carbide
- `coupler.png` - Connection coupler
- `turbocharger.png` - Turbine charger
- `stabilizer.png` - Stabilization module

### Ultra-Advanced (T5)
- `super_computer.png` - Advanced supercomputer
- `industrial_frame.png` - Heavy industrial frame
- `tank.png` - Large storage tank
- `particle_glue.png` - Bonding glue
- `electron_microscope.png` - Microscope apparatus
- `atomic_locator.png` - Scanning device
- `matter_compressor.png` - Compression unit
- `magnetic_field_generator.png` - Magnetic generator
- `quantum_entangler.png` - Quantum device
- `energy_cube.png` - Energy storage cube
- `empty_fuel_cell.png` - Empty nuclear cell
- `nuclear_fuel_cell.png` - Filled nuclear fuel cell
- `earth_token.png` - Victory token (glowing!)

---

## PARTICLE & ANIMATION EFFECTS

### Movement & Transport
- `particle_belt_item.png` - Item traveling on belt (glow effect)
- `particle_arm_transfer.png` - Items being moved by arms
- `particle_boat_wake.png` (4-8 frames) - Water ripple from boats
- `particle_train_spark.png` (4-8 frames) - Track friction sparks
- `particle_train_steam.png` (6-10 frames) - Steam puff from trains

### Processing
- `particle_smelting.png` (4-6 frames) - Furnace heat glow
- `particle_crafting.png` (4-6 frames) - Workshop sparks
- `particle_machine_shop_glow.png` (4-8 frames) - Work animation

### Power & Energy
- `particle_power_flow.png` (6-10 frames) - Energy transmission
- `particle_coal_burn.png` (4-6 frames) - Coal flame
- `particle_nuclear_glow.png` (8-12 frames) - Radiation glow
- `particle_energy_surge.png` (4-8 frames) - Power spike effect

### Transport Stations
- `particle_dock_loading.png` (4-6 frames) - Items being loaded to boats
- `particle_dock_unloading.png` (4-6 frames) - Items being unloaded
- `particle_station_loading.png` (4-6 frames) - Items to trains
- `particle_station_unloading.png` (4-6 frames) - Items from trains

### End-Game Effects
- `particle_earth_token_spawn.png` (8-12 frames) - Token appearance burst
- `particle_matter_duplication.png` (8-12 frames) - Duplication flash
- `particle_quantum_entangle.png` (8-12 frames) - Quantum effect

---

## DECORATIVE & UI ELEMENTS

### Terrain Overlays
- `grid_overlay.png` (optional) - Subtle grid pattern
- `water_tile.png` (optional) - Water surface pattern
- `grass_tile.png` (optional) - Grass surface pattern
- `stone_tile.png` (optional) - Stone surface pattern
- `sand_tile.png` (optional) - Sand surface pattern

### Selection & Building Preview
- `ghost_valid.png` - Ghost building (green transparent)
- `ghost_invalid.png` - Ghost building (red transparent for invalid placement)
- `selection_ring.png` - Selected machine highlight

### HUD & Overlays
- `cursor_default.png` - Default cursor
- `cursor_build.png` - Building/placement cursor (crosshair)
- `cursor_select.png` - Selection cursor

### Directional Indicators (for belts, arms, trains)
- `arrow_up.png` - Direction indicator (up)
- `arrow_down.png` - Direction indicator (down)
- `arrow_left.png` - Direction indicator (left)
- `arrow_right.png` - Direction indicator (right)

---

## SUMMARY

**Total Sprites Needed:**
- Machines: ~65 (including directional variants for transport)
- Items/Components: ~45
- Animations & Particles: ~40 (animated sequences)
- UI & Decorative: ~15

**Total: ~165 sprite files** (including animation frames)

**Animation Frame Guidelines:**
- Belt movement: 4-8 frames looping
- Crafting/Processing: 4-6 frames looping
- Train/Boat movement: 4-8 frames looping (per direction)
- Smoke/steam: 6-10 frames
- Special effects (quantum, matter): 8-12 frames
- Particle effects: 4-8 frames each

**Recommended Sizes:**
- Machine sprites: 64x64 px (will be rendered at 50x50 world units)
- Item sprites: 32x32 px
- Particle effects: 16x16 to 64x64 px depending on effect
- Animation frames: Same size as base sprite, arranged vertically or horizontally

---

## Notes for Artist

1. **Directional Variants:** Boats and trains have 4 directional variants (left, right, up, down)
2. **Animations:** Use sprite sheets or separate files per frame
3. **Color Coding:** Consider using colors to distinguish tiers (T1=brown, T2=blue, T3=green, T4=red, T5=gold)
4. **Glow Effects:** End-game machines (Earth Transporter, Matter Duplicator) should have glowing/pulsing effects
5. **Particle Effects:** Keep these smaller and use opacity/blending for visual polish
6. **UI Clarity:** Ensure all sprites are clearly distinguishable at both small and large scales

