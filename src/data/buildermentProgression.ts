/**
 * Exact Builderment Progression v5.0 - Complete Data
 * Source: User-provided dataset
 * Modifications: Removed underground_belt, added boats/trains/stations
 */

export const buildermentProgression = {
  resources: [
    { id: "wood_log", display_name: "Wood Log" },
    { id: "stone", display_name: "Stone" },
    { id: "iron_ore", display_name: "Iron Ore" },
    { id: "copper_ore", display_name: "Copper Ore" },
    { id: "coal", display_name: "Coal" },
    { id: "wolframite", display_name: "Wolframite" },
    { id: "uranium_ore", display_name: "Uranium Ore" },
    { id: "gold_ore", display_name: "Gold" }
  ],

  items: [
    { id: "wood_plank", display_name: "Wood Plank" },
    { id: "wood_frame", display_name: "Wood Frame" },
    { id: "copper_wire", display_name: "Copper Wire" },
    { id: "iron_ingot", display_name: "Iron Ingot" },
    { id: "iron_plating", display_name: "Iron Plating" },
    { id: "iron_gear", display_name: "Iron Gear" },
    { id: "metal_frame", display_name: "Metal Frame" },
    { id: "sand", display_name: "Sand" },
    { id: "silicon", display_name: "Silicon" },
    { id: "glass", display_name: "Glass" },
    { id: "condenser_lens", display_name: "Condenser Lens" },
    { id: "electromagnet", display_name: "Electromagnet" },
    { id: "logic_circuit", display_name: "Logic Circuit" },
    { id: "graphite", display_name: "Graphite" },
    { id: "steel", display_name: "Steel" },
    { id: "steel_rod", display_name: "Steel Rod" },
    { id: "concrete", display_name: "Concrete" },
    { id: "battery", display_name: "Battery" },
    { id: "rotor", display_name: "Rotor" },
    { id: "motor", display_name: "Electric Motor" },
    { id: "heat_sink", display_name: "Heat Sink" },
    { id: "plastic", display_name: "Plastic" },
    { id: "nano_wire", display_name: "Nano Wire" },
    { id: "computer", display_name: "Computer" },
    { id: "tungsten_ore", display_name: "Tungsten Ore" },
    { id: "tungsten_carbide", display_name: "Tungsten Carbide" },
    { id: "coupler", display_name: "Coupler" },
    { id: "turbocharger", display_name: "Turbocharger" },
    { id: "super_computer", display_name: "Super Computer" },
    { id: "industrial_frame", display_name: "Industrial Frame" },
    { id: "gyroscope", display_name: "Gyroscope" },
    { id: "stabilizer", display_name: "Stabilizer" },
    { id: "tank", display_name: "Storage Tank" },
    { id: "particle_glue", display_name: "Particle Glue" },
    { id: "electron_microscope", display_name: "Electron Microscope" },
    { id: "atomic_locator", display_name: "Atomic Locator" },
    { id: "matter_compressor", display_name: "Matter Compressor" },
    { id: "magnetic_field_generator", display_name: "Magnetic Field Generator" },
    { id: "quantum_entangler", display_name: "Quantum Entangler" },
    { id: "energy_cube", display_name: "Energy Cube" },
    { id: "empty_fuel_cell", display_name: "Empty Fuel Cell" },
    { id: "nuclear_fuel_cell", display_name: "Nuclear Fuel Cell" },
    { id: "earth_token", display_name: "Earth Token" }
  ],

  // Machines grouped by tier, with transport layer (boats/trains)
  machines: [
    // Tier 1: Basic Extraction & Crafting
    { id: "extractor_1", display_name: "Extractor T1", footprint: [1,1], tier: 1, category: "extraction" },
    { id: "workshop", display_name: "Workshop", footprint: [2,2], tier: 1, category: "crafting" },
    { id: "furnace", display_name: "Furnace", footprint: [2,2], tier: 1, category: "crafting" },
    { id: "gold_vault", display_name: "Gold Vault", footprint: [3,3], tier: 1, category: "storage" },
    { id: "gem_tree", display_name: "Gem Tree", footprint: [1,1], tier: 1, category: "extraction" },
    { id: "storage_silo", display_name: "Storage Silo", footprint: [2,2], tier: 1, category: "storage" },
    { id: "belt_1", display_name: "Belt T1", footprint: [1,1], tier: 1, category: "transport", speed: 60 },
    { id: "robotic_arm_1", display_name: "Robotic Arm", footprint: [1,1], tier: 1, category: "transport" },
    { id: "splitter", display_name: "Splitter", footprint: [1,1], tier: 1, category: "transport" },
    { id: "research_lab", display_name: "Research Lab", footprint: [3,3], tier: 1, category: "special" },
    
    // Tier 2: Mid-Game Production
    { id: "machine_shop", display_name: "Machine Shop", footprint: [3,3], tier: 2, category: "crafting" },
    { id: "forge", display_name: "Forge", footprint: [3,3], tier: 2, category: "crafting" },
    { id: "belt_2", display_name: "Belt T2", footprint: [1,1], tier: 2, category: "transport", speed: 120 },
    { id: "robotic_arm_fast", display_name: "Fast Robotic Arm", footprint: [1,1], tier: 2, category: "transport" },
    { id: "robotic_arm_long", display_name: "Long Robotic Arm", footprint: [1,1], tier: 2, category: "transport" },
    { id: "logic_gate", display_name: "Logic Gate", footprint: [1,1], tier: 2, category: "logic" },
    { id: "coal_power_plant", display_name: "Coal Power Plant", footprint: [3,3], tier: 2, category: "power" },
    { id: "extractor_2", display_name: "Extractor T2", footprint: [1,1], tier: 2, category: "extraction" },
    
    // NEW: Transport Layer (Boats & Trains)
    { id: "boat_1", display_name: "Boat T1", footprint: [1,1], tier: 2, category: "transport_vehicle", speed: 5, capacity: 50 },
    { id: "rail", display_name: "Rail Track", footprint: [1,1], tier: 2, category: "transport_infrastructure" },
    { id: "dock_station", display_name: "Dock Station", footprint: [3,3], tier: 2, category: "transport_station" },
    { id: "train_1", display_name: "Train T1", footprint: [2,1], tier: 3, category: "transport_vehicle", speed: 10, capacity: 100 },
    { id: "rail_station", display_name: "Rail Station", footprint: [3,3], tier: 3, category: "transport_station" },
    
    // Tier 3: High-Tier Production
    { id: "industrial_factory", display_name: "Industrial Factory", footprint: [4,4], tier: 3, category: "crafting" },
    { id: "belt_3", display_name: "Belt T3", footprint: [1,1], tier: 3, category: "transport", speed: 240 },
    { id: "extractor_3", display_name: "Extractor T3", footprint: [1,1], tier: 3, category: "extraction" },
    { id: "boat_2", display_name: "Boat T2", footprint: [1,1], tier: 3, category: "transport_vehicle", speed: 8, capacity: 100 },
    { id: "train_2", display_name: "Train T2", footprint: [2,1], tier: 3, category: "transport_vehicle", speed: 15, capacity: 200 },
    
    // Tier 4: Ultra-High-Tier
    { id: "manufacturer", display_name: "Manufacturer", footprint: [5,5], tier: 4, category: "crafting" },
    { id: "belt_4", display_name: "Belt T4", footprint: [1,1], tier: 4, category: "transport", speed: 480 },
    { id: "extractor_4", display_name: "Extractor T4", footprint: [1,1], tier: 4, category: "extraction" },
    { id: "nuclear_power_plant", display_name: "Nuclear Power Plant", footprint: [4,4], tier: 4, category: "power" },
    { id: "boat_3", display_name: "Boat T3", footprint: [1,1], tier: 4, category: "transport_vehicle", speed: 12, capacity: 200 },
    { id: "train_3", display_name: "Train T3", footprint: [2,1], tier: 4, category: "transport_vehicle", speed: 20, capacity: 300 },
    
    // Tier 5: End-Game
    { id: "earth_transporter", display_name: "Earth Transporter", footprint: [6,6], tier: 5, category: "special" },
    { id: "matter_duplicator", display_name: "Matter Duplicator", footprint: [5,5], tier: 5, category: "special" },
    { id: "extractor_5", display_name: "Extractor T5", footprint: [1,1], tier: 5, category: "extraction" },
    { id: "boat_4", display_name: "Boat T4", footprint: [1,1], tier: 5, category: "transport_vehicle", speed: 15, capacity: 300 },
    { id: "train_4", display_name: "Train T4", footprint: [2,1], tier: 5, category: "transport_vehicle", speed: 25, capacity: 500 }
  ],

  // Exact unlock progression from Builderment
  unlocks: [
    { machine_id: "extractor_1", order: 0, starting_unlocked: true, required_deliveries: [] },
    { machine_id: "belt_1", order: 0, starting_unlocked: true, required_deliveries: [] },
    { machine_id: "workshop", order: 0, starting_unlocked: true, required_deliveries: [] },
    { machine_id: "gold_vault", order: 0, starting_unlocked: true, required_deliveries: [] },
    { machine_id: "gem_tree", order: 0, starting_unlocked: true, required_deliveries: [] },
    
    { machine_id: "furnace", order: 1, starting_unlocked: false, required_deliveries: [{"item":"wood_plank","qty":20}] },
    { machine_id: "robotic_arm_1", order: 2, starting_unlocked: false, required_deliveries: [{"item":"wood_frame","qty":50}] },
    { machine_id: "splitter", order: 3, starting_unlocked: false, required_deliveries: [{"item":"wood_frame","qty":100},{"item":"copper_wire","qty":100}] },
    
    { machine_id: "machine_shop", order: 4, starting_unlocked: false, required_deliveries: [{"item":"iron_gear","qty":200},{"item":"copper_wire","qty":400}] },
    { machine_id: "dock_station", order: 4, starting_unlocked: false, required_deliveries: [{"item":"wood_frame","qty":300}] },
    
    { machine_id: "forge", order: 5, starting_unlocked: false, required_deliveries: [{"item":"electromagnet","qty":200},{"item":"iron_ingot","qty":500}] },
    { machine_id: "boat_1", order: 5, starting_unlocked: false, required_deliveries: [{"item":"wood_frame","qty":200},{"item":"iron_gear","qty":100}] },
    
    { machine_id: "belt_2", order: 6, starting_unlocked: false, required_deliveries: [{"item":"iron_gear","qty":500}] },
    { machine_id: "robotic_arm_fast", order: 6, starting_unlocked: false, required_deliveries: [{"item":"steel_rod","qty":200}] },
    { machine_id: "robotic_arm_long", order: 6, starting_unlocked: false, required_deliveries: [{"item":"steel_rod","qty":200}] },
    
    { machine_id: "extractor_2", order: 7, starting_unlocked: false, required_deliveries: [{"item":"steel","qty":200}] },
    { machine_id: "logic_gate", order: 7, starting_unlocked: false, required_deliveries: [{"item":"logic_circuit","qty":500}] },
    
    { machine_id: "coal_power_plant", order: 8, starting_unlocked: false, required_deliveries: [{"item":"graphite","qty":500},{"item":"copper_wire","qty":1000}] },
    { machine_id: "rail", order: 8, starting_unlocked: false, required_deliveries: [{"item":"steel_rod","qty":500}] },
    
    { machine_id: "industrial_factory", order: 9, starting_unlocked: false, required_deliveries: [{"item":"concrete","qty":1000},{"item":"steel","qty":500}] },
    { machine_id: "rail_station", order: 9, starting_unlocked: false, required_deliveries: [{"item":"concrete","qty":500},{"item":"iron_plating","qty":300}] },
    { machine_id: "train_1", order: 9, starting_unlocked: false, required_deliveries: [{"item":"steel","qty":300},{"item":"motor","qty":50}] },
    
    { machine_id: "belt_3", order: 10, starting_unlocked: false, required_deliveries: [{"item":"motor","qty":1000}] },
    { machine_id: "extractor_3", order: 11, starting_unlocked: false, required_deliveries: [{"item":"nano_wire","qty":500},{"item":"computer","qty":200}] },
    { machine_id: "boat_2", order: 11, starting_unlocked: false, required_deliveries: [{"item":"steel","qty":200},{"item":"motor","qty":100}] },
    
    { machine_id: "manufacturer", order: 12, starting_unlocked: false, required_deliveries: [{"item":"computer","qty":500},{"item":"rotor","qty":500}] },
    { machine_id: "train_2", order: 12, starting_unlocked: false, required_deliveries: [{"item":"motor","qty":200},{"item":"logic_circuit","qty":150}] },
    
    { machine_id: "belt_4", order: 13, starting_unlocked: false, required_deliveries: [{"item":"turbocharger","qty":1000}] },
    { machine_id: "extractor_4", order: 14, starting_unlocked: false, required_deliveries: [{"item":"super_computer","qty":500}] },
    { machine_id: "boat_3", order: 14, starting_unlocked: false, required_deliveries: [{"item":"computer","qty":300},{"item":"turbocharger","qty":50}] },
    
    { machine_id: "nuclear_power_plant", order: 15, starting_unlocked: false, required_deliveries: [{"item":"concrete","qty":5000},{"item":"steel","qty":5000},{"item":"logic_circuit","qty":2000}] },
    { machine_id: "train_3", order: 15, starting_unlocked: false, required_deliveries: [{"item":"computer","qty":200},{"item":"turbocharger","qty":100}] },
    
    { machine_id: "earth_transporter", order: 16, starting_unlocked: false, required_deliveries: [{"item":"super_computer","qty":200},{"item":"matter_compressor","qty":50}] },
    { machine_id: "boat_4", order: 16, starting_unlocked: false, required_deliveries: [{"item":"super_computer","qty":100},{"item":"turbocharger","qty":200}] },
    
    { machine_id: "matter_duplicator", order: 17, starting_unlocked: false, required_deliveries: [{"item":"matter_compressor","qty":1000},{"item":"quantum_entangler","qty":1000},{"item":"energy_cube","qty":1000},{"item":"atomic_locator","qty":1000}] },
    { machine_id: "train_4", order: 17, starting_unlocked: false, required_deliveries: [{"item":"super_computer","qty":500},{"item":"quantum_entangler","qty":100}] }
  ]
};
