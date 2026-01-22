# 3D Model Placeholders

This directory contains placeholder 3D model files for potential future 3D rendering.

## Note

Currently, Factory Bound uses 2D canvas rendering. These placeholders are for future 3D mode implementation.

## Required Models (for future use)

If 3D rendering is implemented, replace these placeholders:

### Machine Models
- `miner.glb` - Mining drill 3D model
- `assembler.glb` - Assembling machine 3D model
- `smelter.glb` - Smelting furnace 3D model
- `belt.glb` - Conveyor belt 3D model
- `inserter.glb` - Inserter arm 3D model (with animation)
- `turret.glb` - Defense turret 3D model (with rotation)
- `power_plant.glb` - Power generator 3D model
- `storage.glb` - Storage container 3D model

### Enemy Models
- `biter.glb` - Enemy creature model (with walk animation)
- `spitter.glb` - Ranged enemy model (with attack animation)

### Environment Models
- `rock.glb` - Resource rock model
- `tree.glb` - Decorative tree model
- `ore_patch.glb` - Ore deposit model

## Model Specifications

**Format:** GLB (GL Transmission Format Binary)
**Alternative:** GLTF + separate textures
**Polygon Count:** Low-poly (< 5000 triangles per model)
**Textures:** 512x512px or 1024x1024px
**Animations:** Embedded in GLB file
**Scale:** Consistent across all models (1 unit = 1 meter)

### Texture Guidelines
- **Albedo/Diffuse:** Base color
- **Normal Map:** Surface details
- **Metallic/Roughness:** PBR materials
- **Emission:** For glowing elements

## Animation Requirements

Models with animations should include:
- **Idle:** Looping idle animation
- **Working:** Active state animation
- **Damaged:** Optional damaged state

Example for inserter:
- idle.anim
- grab.anim
- place.anim

## Integration Notes

To enable 3D rendering:
1. Install Three.js: `npm install three`
2. Create 3D renderer component
3. Load GLB models with GLTFLoader
4. Replace canvas rendering with 3D scene
5. Implement camera controls

## Current Status

🚧 **Not Implemented** - Game currently uses 2D canvas rendering
These are placeholder files for future enhancement

## Tools for Creating Models

Recommended tools:
- **Blender** (free, open-source) - Modeling and animation
- **Maya** - Professional modeling
- **3ds Max** - Professional modeling
- **Substance Painter** - Texturing

Export to GLB format for web compatibility.
