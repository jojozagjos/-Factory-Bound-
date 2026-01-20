# Game Design Document

## Factory Bound

**Genre**: Automation Strategy, Sandbox, Multiplayer  
**Platform**: Web (Desktop and Mobile)  
**Target Audience**: Strategy gamers, programmers, automation enthusiasts  

## High-Level Concept

Factory Bound is a professional automation game inspired by Factorio, featuring visual node-based programming, deep progression systems, and competitive multiplayer modes. Players build and optimize production chains while defending against enemies and competing with or collaborating with other players.

## Core Pillars

1. **Automation Through Programming**: Visual node-based logic gives players unprecedented control
2. **Deep Progression**: Tech trees, prestige, and meta progression ensure long-term engagement
3. **Competitive & Cooperative**: PvP, ranked matches, and co-op modes for all playstyles
4. **Deterministic Simulation**: Fair, predictable gameplay that rewards skill
5. **Accessibility**: Designed for all players with comprehensive accessibility features

## Game Modes

### Single Player

#### Campaign Mode
- Story-driven progression
- Increasing difficulty challenges
- Unlock new mechanics gradually
- Tutorial integration

#### Sandbox Mode
- Unlimited resources
- All technologies unlocked
- Creative building focus
- Testing ground for strategies

#### Challenge Mode
- Time-limited scenarios
- Specific objectives
- Leaderboards for best times
- Daily/weekly challenges

### Multiplayer

#### Co-op (2-8 players)
- Shared factory building
- Collaborative defense
- Combined tech tree progression
- Shared resources and objectives

#### PvP (2-4 players)
- Competitive factory building
- Offensive capabilities
- Resource competition
- Victory conditions:
  - Economic: Reach production threshold
  - Military: Destroy opponent bases
  - Technology: Complete all research first

#### Ranked PvP
- Skill-based matchmaking
- Seasonal rankings
- Exclusive rewards
- Competitive ladder

## Core Gameplay Loop

```
Gather Resources → Process Materials → Build Machines → 
Automate Production → Program Behaviors → Research Tech → 
Defend Base → Expand → Optimize → Prestige → Repeat
```

## Machines & Buildings

### Production
- **Miner**: Extracts raw resources from deposits
- **Smelter**: Processes ores into refined materials
- **Assembler**: Crafts items from components
- **Chemical Plant**: Advanced material processing
- **Refinery**: Oil processing and derivatives

### Logistics
- **Belt**: Transports items continuously
- **Inserter**: Picks up and places items between machines
- **Storage Chest**: Holds items
- **Logistics Robot**: Automated item delivery
- **Train System**: Long-distance bulk transport

### Power
- **Steam Engine**: Basic power generation
- **Solar Panel**: Clean renewable energy
- **Nuclear Reactor**: High-output power
- **Accumulator**: Energy storage
- **Power Pole**: Electricity distribution

### Combat
- **Gun Turret**: Basic defense
- **Laser Turret**: Advanced automated defense
- **Flamethrower Turret**: Area denial
- **Artillery**: Long-range offense
- **Wall**: Protection barrier

### Special
- **Lab**: Research technologies
- **Beacon**: Boost nearby machines
- **Radar**: Reveal map areas
- **Logic Controller**: Central node programming hub

## Visual Node Programming System

### Node Types

#### Input Nodes
- **Sensor**: Detect items, enemies, machine status
- **Counter**: Track production quantities
- **Timer**: Time-based triggers
- **Signal**: Receive network signals

#### Logic Nodes
- **Comparator**: Compare values
- **Math**: Add, subtract, multiply, divide
- **Boolean**: AND, OR, NOT operations
- **Condition**: If-then-else logic
- **Loop**: Repeated operations
- **Function**: Reusable logic blocks

#### Output Nodes
- **Activate**: Turn machines on/off
- **Set Recipe**: Change production recipes
- **Send Signal**: Broadcast to network
- **Priority**: Set insertion/extraction priority

### Example Programs

#### Smart Smelting
```
[Iron Ore Counter] → [If > 100] → [Activate Smelter A]
                                 → [Else] → [Activate Smelter B]
```

#### Defensive Automation
```
[Enemy Sensor] → [Distance < 20] → [Activate All Turrets]
               → [Distance < 10] → [Send Alarm Signal]
```

## Tech Tree

### Paradigms

#### 1. Logistics
- Basic Belts → Fast Belts → Express Belts
- Inserters → Fast Inserters → Stack Inserters
- Basic Logistics → Logistics Robots → Advanced Routing

#### 2. Production
- Manual Crafting → Basic Assembly → Advanced Assembly
- Smelting → Advanced Smelting → Instant Smelting
- Modules → Speed Modules → Productivity Modules

#### 3. Power
- Burner → Steam → Solar → Nuclear
- Basic Grid → Smart Grid → Wireless Power
- Energy Storage → Advanced Storage → Fusion Batteries

#### 4. Combat
- Walls → Gun Turrets → Laser Turrets → Artillery
- Armor → Power Armor → Shield Technology
- Weapons → Advanced Weapons → Experimental Weapons

#### 5. Research
- Basic Science → Advanced Science → Military Science
- Research Speed → Lab Networking → Instant Research
- Blueprint System → Copy-Paste → Templates

## Progression Systems

### Experience & Leveling
- XP gained from: crafting, building, research, combat
- Levels unlock: inventory slots, build speed, bonus stats
- Max level: 100 (soft cap, prestige available)

### Prestige System
- Reset progress for permanent bonuses
- Prestige levels unlock:
  - Starting resource bonuses
  - Faster research speeds
  - Unique building colors/skins
  - Special challenges
  - Meta currency for cosmetics

### Meta Progression
- Persistent across all games
- Career achievements
- Unlock alternative starting scenarios
- Special game modifiers
- Blueprint library

## World Generation

### Biomes
- **Grassland**: Balanced resources, easy terrain
- **Desert**: Sparse resources, challenging survival
- **Forest**: Dense vegetation, hidden resources
- **Mountain**: Rich ores, difficult navigation
- **Arctic**: Extreme conditions, unique resources

### Resources
- **Iron Ore**: Basic construction material
- **Copper Ore**: Electronics and power
- **Coal**: Fuel and processing
- **Stone**: Construction and concrete
- **Oil**: Advanced materials and fuel
- **Uranium**: Nuclear power

### World Modifiers
- Resource Richness: Scarce / Normal / Abundant
- Enemy Difficulty: Peaceful / Normal / Hard / Nightmare
- Starting Area: Small / Medium / Large
- Technology Cost: Cheap / Normal / Expensive
- Production Speed: Slow / Normal / Fast
- Death Penalty: None / Soft / Harsh

## Enemy System

### Enemy Types
- **Biter**: Fast melee unit
- **Spitter**: Ranged acid attack
- **Behemoth**: Large tanky enemy
- **Worm**: Stationary turret enemy

### Evolution
- Evolution factor increases over time
- Triggered by: pollution, player expansion, nest destruction
- Higher evolution = stronger enemies
- Creates escalating challenge

### Pollution
- Machines generate pollution
- Attracts enemies
- Spreads across map
- Trees absorb pollution
- Strategic pollution management required

## Multiplayer Features

### Session Management
- Public/private lobbies
- Player kick/ban
- Admin controls
- Session pause
- Save/load mid-session

### Communication
- Text chat
- Quick chat commands
- Ping system
- Blueprint sharing
- Statistics sharing

### Competition
- Production charts
- Kill statistics
- Research progress
- Resource graphs
- Efficiency ratings

## Quality of Life Features

### Building
- Copy-paste buildings
- Blueprint system
- Undo/redo
- Grid snapping
- Rotation shortcuts
- Quick build menu

### Interface
- Minimap
- Alert system
- Quick access toolbar
- Customizable hotkeys
- Search functionality
- Tooltips

### Automation
- Auto-crafting
- Auto-trash
- Logistic requests
- Construction robots
- Deconstruction planner

## Accessibility Features

### Visual
- Colorblind modes (Protanopia, Deuteranopia, Tritanopia)
- High contrast mode
- Adjustable UI scale
- Customizable colors
- Text size options

### Audio
- Subtitles for all sounds
- Visual alerts
- Volume controls per category
- Mono audio option

### Controls
- Fully rebindable keys
- Gamepad support
- Mouse-only play
- Keyboard-only play
- Adjustable sensitivity

### Cognitive
- Pause in single player
- Save anywhere
- Tutorial tooltips
- Difficulty settings
- Time speed controls

## Technical Requirements

### Minimum Specs
- Browser: Chrome 90+, Firefox 88+, Safari 14+
- RAM: 4GB
- Storage: 500MB
- Network: 1Mbps for multiplayer

### Recommended Specs
- Browser: Latest Chrome/Firefox
- RAM: 8GB
- Storage: 2GB
- Network: 5Mbps for multiplayer
- Display: 1920x1080
