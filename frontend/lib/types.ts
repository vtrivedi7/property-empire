export type TileTypeValue =
  | "house"
  | "apartment"
  | "condo"
  | "townhouse"
  | "villa"
  | "commercial"
  | "locked-gate"
  | "foundation-block"
  | "locked-card"

export type SpecialTileType = "renovation-bomb" | "market-mixer" | "skyscraper-leveller" | "urban-redevelopment" | null

export interface TileType {
  id: string
  type: TileTypeValue
  isMatched: boolean
  isNew?: boolean
  isClearing?: boolean
  special: SpecialTileType
  hitPoints?: number
  resourceType?: ResourceType
  movesToUnlock?: number
}

export interface SelectedTile {
  row: number
  col: number
}

export type ResourceType = "lumber" | "brick" | "steel" | "cash" | "glass" | "concrete" | "marble" | "copper" | "gold"

export interface Resources {
  lumber: number      // Used for houses and townhouses
  brick: number       // Used for apartments and condos
  steel: number       // Used for villas and commercial buildings
  concrete: number    // Used for all property types
  glass: number       // Used for modern buildings (apartments, condos, commercial)
  
  // Luxury materials
  marble: number      // Used for villas and luxury properties
  copper: number      // Used for electrical and plumbing in all properties
  gold: number        // Used for luxury finishes and commercial properties
  
  // Financial resources
  cash: number        // Universal currency for all transactions
}

export interface LevelConfig {
  id: number
  regionId: number
  name: string
  targetScore: number
  moveLimit: number
  unlocked: boolean
  stars?: number
  obstacles?: {
    lockedGates: number
    foundationBlocks: number
    lockedCards: number
  }
}

export interface RegionConfig {
  id: number
  name: string
  description: string
  unlocked: boolean
}

export interface UpgradeCost {
  lumber?: number
  brick?: number
  steel?: number
  cash?: number
  glass?: number
  concrete?: number
  marble?: number
  copper?: number
  gold?: number
}

export interface PlayerProfile {
  energy: number
  maxEnergy: number
  playerXP: number
  playerLevel: number
  coins: number
  starsByLevel: Record<number, number>
  resources: Resources
  upgradesOwned: string[]
  tutorialCompleted: boolean
}

export interface GameSettings {
  soundEnabled: boolean
  musicEnabled: boolean
  animationSpeed: number
  vibrationEnabled: boolean
}
