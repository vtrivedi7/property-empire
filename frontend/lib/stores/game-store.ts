"use client"

import { create } from "zustand"
import { useLevelStore } from "@/lib/stores/level-store"
import { usePlayerStore } from "@/lib/stores/player-store"
import type { TileType, TileTypeValue, SelectedTile, SpecialTileType, Resources, GameSettings } from "@/lib/types"

// 8x8 grid
const GRID_SIZE = 8
const TILE_TYPES: TileTypeValue[] = ["house", "apartment", "condo", "townhouse", "villa", "commercial"]
const RESOURCE_MAPPING = {
  house: "lumber",
  apartment: "steel",
  condo: "cash",
  townhouse: "brick",
  villa: "glass",
  commercial: "concrete",
}

// Update the GameState interface to remove tutorial-related properties
interface GameState {
  grid: TileType[][]
  selectedTile: SelectedTile | null
  score: number
  movesRemaining: number
  isAnimating: boolean
  invalidSwap: boolean
  gameOver: boolean
  levelComplete: boolean
  gravityDirection: "vertical" | "horizontal"
  settings: GameSettings

  initializeGame: () => void
  selectTile: (row: number, col: number) => void
  swapTiles: (row1: number, col1: number, row2: number, col2: number) => void
  resetGame: () => void
  updateSettings: (settings: Partial<GameSettings>) => void
}

const createEmptyGrid = (level: number): TileType[][] => {
  const grid: TileType[][] = []
  const { currentLevel } = useLevelStore.getState()
  const lockedGates = currentLevel.obstacles?.lockedGates || 0
  const foundationBlocks = currentLevel.obstacles?.foundationBlocks || 0
  const lockedCards = currentLevel.obstacles?.lockedCards || 0

  // Create grid with random tiles
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = []
    for (let j = 0; j < GRID_SIZE; j++) {
      const tileType = getRandomTileType()
      grid[i][j] = {
        id: `${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
        type: tileType,
        isMatched: false,
        special: null,
        resourceType: RESOURCE_MAPPING[tileType as keyof typeof RESOURCE_MAPPING],
      }
    }
  }

  // Ensure no matches exist at the start
  const noMatchesGrid = ensureNoInitialMatches(grid)

  // Add obstacles based on level
  if (level > 1) {
    // Add locked gates
    for (let i = 0; i < lockedGates; i++) {
      let row, col
      do {
        row = Math.floor(Math.random() * GRID_SIZE)
        col = Math.floor(Math.random() * GRID_SIZE)
      } while (
        noMatchesGrid[row][col].type === "locked-gate" ||
        noMatchesGrid[row][col].type === "foundation-block" ||
        noMatchesGrid[row][col].type === "locked-card"
      )

      noMatchesGrid[row][col] = {
        id: `locked-gate-${i}-${Math.random().toString(36).substring(2, 9)}`,
        type: "locked-gate",
        isMatched: false,
        special: null,
      }
    }

    // Add foundation blocks
    for (let i = 0; i < foundationBlocks; i++) {
      let row, col
      do {
        row = Math.floor(Math.random() * GRID_SIZE)
        col = Math.floor(Math.random() * GRID_SIZE)
      } while (
        noMatchesGrid[row][col].type === "locked-gate" ||
        noMatchesGrid[row][col].type === "foundation-block" ||
        noMatchesGrid[row][col].type === "locked-card"
      )

      noMatchesGrid[row][col] = {
        id: `foundation-block-${i}-${Math.random().toString(36).substring(2, 9)}`,
        type: "foundation-block",
        isMatched: false,
        special: null,
        hitPoints: 2,
      }
    }

    // Add locked cards
    for (let i = 0; i < lockedCards; i++) {
      let row, col
      do {
        row = Math.floor(Math.random() * GRID_SIZE)
        col = Math.floor(Math.random() * GRID_SIZE)
      } while (
        noMatchesGrid[row][col].type === "locked-gate" ||
        noMatchesGrid[row][col].type === "foundation-block" ||
        noMatchesGrid[row][col].type === "locked-card"
      )

      // Random number of moves to unlock (2-4)
      const movesToUnlock = Math.floor(Math.random() * 3) + 2

      noMatchesGrid[row][col] = {
        id: `locked-card-${i}-${Math.random().toString(36).substring(2, 9)}`,
        type: "locked-card",
        isMatched: false,
        special: null,
        movesToUnlock: movesToUnlock,
      }
    }
  }

  return noMatchesGrid
}

const getRandomTileType = (): TileTypeValue => {
  return TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]
}

const ensureNoInitialMatches = (grid: TileType[][]): TileType[][] => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      // Skip obstacle tiles
      if (
        grid[i][j].type === "locked-gate" ||
        grid[i][j].type === "foundation-block" ||
        grid[i][j].type === "locked-card"
      ) {
        continue
      }

      // Check horizontal matches
      if (j > 1) {
        if (grid[i][j].type === grid[i][j - 1].type && grid[i][j].type === grid[i][j - 2].type) {
          // Avoid match by changing the current tile
          let newType = getRandomTileType()
          while (newType === grid[i][j].type) {
            newType = getRandomTileType()
          }
          grid[i][j].type = newType
          grid[i][j].resourceType = RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING]
        }
      }

      // Check vertical matches
      if (i > 1) {
        if (grid[i][j].type === grid[i - 1][j].type && grid[i][j].type === grid[i - 2][j].type) {
          // Avoid match by changing the current tile
          let newType = getRandomTileType()
          while (newType === grid[i][j].type) {
            newType = getRandomTileType()
          }
          grid[i][j].type = newType
          grid[i][j].resourceType = RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING]
        }
      }
    }
  }

  return grid
}

const findMatches = (
  grid: TileType[][],
): { matches: boolean; matchedTiles: [number, number][]; matchGroups: [number, number][][] } => {
  const matchedTiles: [number, number][] = []
  const matchGroups: [number, number][][] = []
  let matches = false

  // Helper to avoid duplicate entries in matchedTiles
  const addMatchedTile = (row: number, col: number, currentGroup: [number, number][]) => {
    const alreadyMatched = matchedTiles.some(([r, c]) => r === row && c === col)
    if (!alreadyMatched) {
      matchedTiles.push([row, col])
      currentGroup.push([row, col])
    }
  }

  // Check horizontal matches
  for (let i = 0; i < GRID_SIZE; i++) {
    let matchCount = 1
    let currentType = ""
    let currentGroup: [number, number][] = []

    for (let j = 0; j < GRID_SIZE; j++) {
      const tile = grid[i][j]

      // Skip obstacle tiles
      if (tile.type === "locked-gate" || tile.type === "foundation-block" || tile.type === "locked-card") {
        if (matchCount >= 3) {
          matches = true
          matchGroups.push([...currentGroup])
        }
        matchCount = 1
        currentType = ""
        currentGroup = []
        continue
      }

      if (j === 0) {
        currentType = tile.type
        currentGroup = [[i, j]]
      } else if (tile.type === currentType) {
        matchCount++
        currentGroup.push([i, j])
      } else {
        if (matchCount >= 3) {
          matches = true
          for (let k = j - matchCount; k < j; k++) {
            addMatchedTile(i, k, currentGroup)
          }
          matchGroups.push([...currentGroup])
        }
        matchCount = 1
        currentType = tile.type
        currentGroup = [[i, j]]
      }
    }

    // Check for match at the end of row
    if (matchCount >= 3) {
      matches = true
      for (let k = GRID_SIZE - matchCount; k < GRID_SIZE; k++) {
        addMatchedTile(i, k, currentGroup)
      }
      matchGroups.push([...currentGroup])
    }
  }

  // Check vertical matches
  for (let j = 0; j < GRID_SIZE; j++) {
    let matchCount = 1
    let currentType = ""
    let currentGroup: [number, number][] = []

    for (let i = 0; i < GRID_SIZE; i++) {
      const tile = grid[i][j]

      // Skip obstacle tiles
      if (tile.type === "locked-gate" || tile.type === "foundation-block" || tile.type === "locked-card") {
        if (matchCount >= 3) {
          matches = true
          matchGroups.push([...currentGroup])
        }
        matchCount = 1
        currentType = ""
        currentGroup = []
        continue
      }

      if (i === 0) {
        currentType = tile.type
        currentGroup = [[i, j]]
      } else if (tile.type === currentType) {
        matchCount++
        currentGroup.push([i, j])
      } else {
        if (matchCount >= 3) {
          matches = true
          for (let k = i - matchCount; k < i; k++) {
            addMatchedTile(k, j, currentGroup)
          }
          matchGroups.push([...currentGroup])
        }
        matchCount = 1
        currentType = tile.type
        currentGroup = [[i, j]]
      }
    }

    // Check for match at the end of column
    if (matchCount >= 3) {
      matches = true
      for (let k = GRID_SIZE - matchCount; k < GRID_SIZE; k++) {
        addMatchedTile(k, j, currentGroup)
      }
      matchGroups.push([...currentGroup])
    }
  }

  return { matches, matchedTiles, matchGroups }
}

// Check for matches around obstacles and update them
const updateObstacles = (grid: TileType[][], matchedTiles: [number, number][]): TileType[][] => {
  const newGrid = [...grid.map((row) => [...row])]

  // Track which obstacles have already been affected by this match
  const affectedObstacles = new Set<string>()

  // For each matched tile, check if there are obstacles adjacent to it
  matchedTiles.forEach(([row, col]) => {
    // Check all 4 adjacent positions (up, down, left, right)
    const adjacentPositions = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ]

    adjacentPositions.forEach(([r, c]) => {
      // Check if position is valid and contains an obstacle
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        const obstacleKey = `${r}-${c}`

        // Locked Gate
        if (newGrid[r][c].type === "locked-gate" && !affectedObstacles.has(obstacleKey)) {
          affectedObstacles.add(obstacleKey)

          // Convert to a random basic tile
          const newType = getRandomTileType()
          newGrid[r][c] = {
            id: `unlocked-${Math.random().toString(36).substring(2, 9)}`,
            type: newType,
            isMatched: false,
            special: null,
            resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
            isNew: true,
          }
        }

        // Foundation Block
        if (newGrid[r][c].type === "foundation-block" && !affectedObstacles.has(obstacleKey)) {
          affectedObstacles.add(obstacleKey)

          // Decrement hit points
          if (newGrid[r][c].hitPoints !== undefined) {
            newGrid[r][c].hitPoints -= 1

            // If hit points reach 0, remove the block
            if (newGrid[r][c].hitPoints <= 0) {
              const newType = getRandomTileType()
              newGrid[r][c] = {
                id: `cleared-${Math.random().toString(36).substring(2, 9)}`,
                type: newType,
                isMatched: false,
                special: null,
                resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
                isNew: true,
              }
            }
          }
        }

        // Locked Card
        if (newGrid[r][c].type === "locked-card" && !affectedObstacles.has(obstacleKey)) {
          affectedObstacles.add(obstacleKey)

          // Decrement moves to unlock
          if (newGrid[r][c].movesToUnlock !== undefined) {
            newGrid[r][c].movesToUnlock -= 1

            // If moves to unlock reach 0, convert to a special tile
            if (newGrid[r][c].movesToUnlock <= 0) {
              // Randomly choose a special tile type
              const specialTypes: SpecialTileType[] = [
                "renovation-bomb",
                "market-mixer",
                "skyscraper-leveller",
                "urban-redevelopment",
              ]
              const randomSpecial = specialTypes[Math.floor(Math.random() * specialTypes.length)]

              const newType = getRandomTileType()
              newGrid[r][c] = {
                id: `unlocked-special-${Math.random().toString(36).substring(2, 9)}`,
                type: newType,
                isMatched: false,
                special: randomSpecial,
                resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
                isNew: true,
              }
            }
          }
        }
      }
    })
  })

  return newGrid
}

// Gravity fill algorithm
const clearMatchedTiles = (grid: TileType[][], direction: "vertical" | "horizontal"): TileType[][] => {
  const newGrid = [...grid.map((row) => [...row])]

  if (direction === "vertical") {
    // Traditional vertical gravity (columns collapse)
    for (let j = 0; j < GRID_SIZE; j++) {
      // Count matched tiles in this column
      let matchedCount = 0
      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        if (newGrid[i][j].isMatched) {
          matchedCount++
        } else if (matchedCount > 0) {
          // Move tile down by matchedCount
          newGrid[i + matchedCount][j] = { ...newGrid[i][j] }
          newGrid[i][j].isMatched = true
        }
      }

      // Fill the top with new tiles
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i][j].isMatched) {
          const newType = getRandomTileType()
          newGrid[i][j] = {
            id: `new-${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
            type: newType,
            isMatched: false,
            special: null,
            resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
            isNew: true,
          }
        }
      }
    }
  } else {
    // Horizontal gravity (rows collapse from right to left)
    for (let i = 0; i < GRID_SIZE; i++) {
      // Count matched tiles in this row
      let matchedCount = 0
      for (let j = GRID_SIZE - 1; j >= 0; j--) {
        if (newGrid[i][j].isMatched) {
          matchedCount++
        } else if (matchedCount > 0) {
          // Move tile right by matchedCount
          newGrid[i][j + matchedCount] = { ...newGrid[i][j] }
          newGrid[i][j].isMatched = true
        }
      }

      // Fill the left with new tiles
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j].isMatched) {
          const newType = getRandomTileType()
          newGrid[i][j] = {
            id: `new-${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
            type: newType,
            isMatched: false,
            special: null,
            resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
            isNew: true,
          }
        }
      }
    }
  }

  return newGrid
}

// Determine special tile type based on match pattern
const determineSpecialTileType = (matchGroup: [number, number][], lastSwapped: [number, number]): SpecialTileType => {
  const { upgradesOwned } = usePlayerStore.getState()
  const specialThresholdReduced = upgradesOwned.includes("special_threshold") ? 1 : 0

  // Check if special tile chance upgrade is owned
  const hasSpecialChanceUpgrade = upgradesOwned.includes("special_chance")

  // Random chance to create a special tile if the upgrade is owned
  if (hasSpecialChanceUpgrade && matchGroup.length === 3 && Math.random() < 0.15) {
    // 15% chance to create a renovation bomb from a 3-match if upgrade is owned
    return "renovation-bomb"
  }

  // Check if the last swapped tile is in the match group
  const isLastSwappedInMatch = matchGroup.some(([r, c]) => r === lastSwapped[0] && c === lastSwapped[1])
  if (!isLastSwappedInMatch) return null

  // Length = 4 (straight) -> Renovation Bomb
  if (matchGroup.length === 4 - specialThresholdReduced) {
    // Check if it's a straight line
    const rows = new Set(matchGroup.map(([r, _]) => r))
    const cols = new Set(matchGroup.map(([_, c]) => c))

    if (rows.size === 1 || cols.size === 1) {
      return "renovation-bomb"
    }
  }

  // Length = 5 (straight) -> Skyscraper Leveller
  if (matchGroup.length === 5 - specialThresholdReduced) {
    const rows = new Set(matchGroup.map(([r, _]) => r))
    const cols = new Set(matchGroup.map(([_, c]) => c))

    if (rows.size === 1 || cols.size === 1) {
      return "skyscraper-leveller"
    }

    // Length = 5 (T/L shape) -> Market Mixer
    // Check for T or L shape
    const isT_or_L_Shape = (tiles: [number, number][]): boolean => {
      // Create a set of positions for quick lookup
      const positions = new Set(tiles.map(([r, c]) => `${r},${c}`))

      // Check for each possible T or L shape centered at the pivot
      for (const [pivotRow, pivotCol] of tiles) {
        // T shapes
        if (
          positions.has(`${pivotRow},${pivotCol - 1}`) &&
          positions.has(`${pivotRow},${pivotCol + 1}`) &&
          positions.has(`${pivotRow + 1},${pivotCol}`)
        ) {
          return true
        }

        if (
          positions.has(`${pivotRow},${pivotCol - 1}`) &&
          positions.has(`${pivotRow},${pivotCol + 1}`) &&
          positions.has(`${pivotRow - 1},${pivotCol}`)
        ) {
          return true
        }

        if (
          positions.has(`${pivotRow - 1},${pivotCol}`) &&
          positions.has(`${pivotRow + 1},${pivotCol}`) &&
          positions.has(`${pivotRow},${pivotCol + 1}`)
        ) {
          return true
        }

        if (
          positions.has(`${pivotRow - 1},${pivotCol}`) &&
          positions.has(`${pivotRow + 1},${pivotCol}`) &&
          positions.has(`${pivotRow},${pivotCol - 1}`)
        ) {
          return true
        }

        // L shapes
        if (
          positions.has(`${pivotRow},${pivotCol + 1}`) &&
          positions.has(`${pivotRow},${pivotCol + 2}`) &&
          positions.has(`${pivotRow + 1},${pivotCol}`) &&
          positions.has(`${pivotRow + 2},${pivotCol}`)
        ) {
          return true
        }

        if (
          positions.has(`${pivotRow},${pivotCol - 1}`) &&
          positions.has(`${pivotRow},${pivotCol - 2}`) &&
          positions.has(`${pivotRow + 1},${pivotCol}`) &&
          positions.has(`${pivotRow + 2},${pivotCol}`)
        ) {
          return true
        }

        if (
          positions.has(`${pivotRow},${pivotCol + 1}`) &&
          positions.has(`${pivotRow},${pivotCol + 2}`) &&
          positions.has(`${pivotRow - 1},${pivotCol}`) &&
          positions.has(`${pivotRow - 2},${pivotCol}`)
        ) {
          return true
        }

        if (
          positions.has(`${pivotRow},${pivotCol - 1}`) &&
          positions.has(`${pivotRow},${pivotCol - 2}`) &&
          positions.has(`${pivotRow - 1},${pivotCol}`) &&
          positions.has(`${pivotRow - 2},${pivotCol}`)
        ) {
          return true
        }
      }

      return false
    }

    if (isT_or_L_Shape(matchGroup)) {
      return "market-mixer"
    }
  }

  // Length >= 6 (cross shape) -> Urban Redevelopment
  if (matchGroup.length >= 6 - specialThresholdReduced) {
    // Check for cross shape
    const isCrossShape = (tiles: [number, number][]): boolean => {
      const positions = new Set(tiles.map(([r, c]) => `${r},${c}`))

      for (const [pivotRow, pivotCol] of tiles) {
        if (
          positions.has(`${pivotRow - 1},${pivotCol}`) &&
          positions.has(`${pivotRow + 1},${pivotCol}`) &&
          positions.has(`${pivotRow},${pivotCol - 1}`) &&
          positions.has(`${pivotRow},${pivotCol + 1}`)
        ) {
          return true
        }
      }

      return false
    }

    if (isCrossShape(matchGroup)) {
      return "urban-redevelopment"
    }
  }

  return null
}

// Create special tile at the last swapped position
const createSpecialTile = (
  grid: TileType[][],
  matchGroups: [number, number][][],
  lastSwapped: [number, number],
): TileType[][] => {
  const newGrid = [...grid.map((row) => [...row])]

  for (const matchGroup of matchGroups) {
    const specialType = determineSpecialTileType(matchGroup, lastSwapped)

    if (specialType) {
      const [row, col] = lastSwapped

      // Only create special tile if the last swapped position is not an obstacle
      if (
        newGrid[row][col].type !== "locked-gate" &&
        newGrid[row][col].type !== "foundation-block" &&
        newGrid[row][col].type !== "locked-card"
      ) {
        newGrid[row][col].special = specialType
      }

      break // Only create one special tile per swap
    }
  }

  return newGrid
}

// Calculate resources gained from matches
const calculateResourceGain = (matchedTiles: [number, number][], grid: TileType[][]): Resources => {
  const { upgradesOwned } = usePlayerStore.getState()
  const resourceYieldBonus = upgradesOwned.includes("resource_yield") ? 1 : 0

  const resources: Resources = {
    lumber: 0,
    brick: 0,
    steel: 0,
    cash: 0,
    glass: 0,
    concrete: 0,
    marble: 0,
    copper: 0,
    gold: 0,
  }

  matchedTiles.forEach(([row, col]) => {
    const resourceType = grid[row][col].resourceType
    if (resourceType) {
      resources[resourceType as keyof Resources] += 1 + resourceYieldBonus
    }
  })

  return resources
}

// Activate special tile effects
const activateSpecialTile = (
  grid: TileType[][],
  row: number,
  col: number,
): {
  grid: TileType[][]
  affectedTiles: [number, number][]
} => {
  const newGrid = [...grid.map((r) => [...r])]
  const affectedTiles: [number, number][] = []
  const special = newGrid[row][col].special

  if (!special) return { grid: newGrid, affectedTiles }

  // Mark the special tile itself as clearing
  newGrid[row][col].isClearing = true

  switch (special) {
    case "renovation-bomb":
      // Clear entire row
      for (let j = 0; j < GRID_SIZE; j++) {
        if (
          newGrid[row][j].type !== "locked-gate" &&
          newGrid[row][j].type !== "foundation-block" &&
          newGrid[row][j].type !== "locked-card"
        ) {
          newGrid[row][j].isMatched = true
          affectedTiles.push([row, j])
        }
      }
      break

    case "market-mixer":
      // Clear 3x3 block
      for (let i = Math.max(0, row - 1); i <= Math.min(GRID_SIZE - 1, row + 1); i++) {
        for (let j = Math.max(0, col - 1); j <= Math.min(GRID_SIZE - 1, col + 1); j++) {
          if (
            newGrid[i][j].type !== "locked-gate" &&
            newGrid[i][j].type !== "foundation-block" &&
            newGrid[i][j].type !== "locked-card"
          ) {
            newGrid[i][j].isMatched = true
            affectedTiles.push([i, j])
          }
        }
      }
      break

    case "skyscraper-leveller":
      // Clear entire column
      for (let i = 0; i < GRID_SIZE; i++) {
        if (
          newGrid[i][col].type !== "locked-gate" &&
          newGrid[i][col].type !== "foundation-block" &&
          newGrid[i][col].type !== "locked-card"
        ) {
          newGrid[i][col].isMatched = true
          affectedTiles.push([i, col])
        }
      }
      break

    case "urban-redevelopment":
      // Clear entire row and column
      for (let i = 0; i < GRID_SIZE; i++) {
        if (
          newGrid[i][col].type !== "locked-gate" &&
          newGrid[i][col].type !== "foundation-block" &&
          newGrid[i][col].type !== "locked-card"
        ) {
          newGrid[i][col].isMatched = true
          affectedTiles.push([i, col])
        }
      }
      for (let j = 0; j < GRID_SIZE; j++) {
        if (
          j !== col &&
          newGrid[row][j].type !== "locked-gate" &&
          newGrid[row][j].type !== "foundation-block" &&
          newGrid[row][j].type !== "locked-card"
        ) {
          newGrid[row][j].isMatched = true
          affectedTiles.push([row, j])
        }
      }
      break
  }

  // Remove the special property after activation
  newGrid[row][col].special = null

  return { grid: newGrid, affectedTiles }
}

// Check if game is over or level is complete
const checkGameState = () => {
  const { movesRemaining, score } = useGameStore.getState()
  const { currentLevel } = useLevelStore.getState()

  if (movesRemaining <= 0) {
    if (score >= currentLevel.targetScore) {
      useGameStore.setState({ levelComplete: true })
    } else {
      useGameStore.setState({ gameOver: true })
    }
  } else if (score >= currentLevel.targetScore) {
    // Level is complete even if moves remain
    useGameStore.setState({ levelComplete: true })
  }
}

// Process cascading matches
const processCascadingMatches = (grid: TileType[][]) => {
  const { matches, matchedTiles, matchGroups } = findMatches(grid)

  if (matches) {
    // Mark matched tiles
    const newGrid = [...grid.map((row) => [...row])]
    matchedTiles.forEach(([r, c]) => {
      newGrid[r][c].isMatched = true
    })

    // Update obstacles
    const updatedGrid = updateObstacles(newGrid, matchedTiles)

    // Calculate score and resources
    const { upgradesOwned } = usePlayerStore.getState()
    const scoreBoost = upgradesOwned.includes("score_boost") ? 1.1 : 1
    const matchScore = Math.round((10 + (matchedTiles.length - 3) * 5) * scoreBoost)
    const resourceGain = calculateResourceGain(matchedTiles, grid)

    // Update state
    useGameStore.setState({
      grid: updatedGrid,
      score: useGameStore.getState().score + matchScore,
      isAnimating: true,
    })

    // Update resources
    usePlayerStore.getState().addResources(resourceGain)

    // After animation, clear matched tiles and apply gravity
    setTimeout(() => {
      // Randomly choose gravity direction
      const newDirection = Math.random() < 0.5 ? "vertical" : "horizontal"

      const clearedGrid = clearMatchedTiles(updatedGrid, newDirection)
      useGameStore.setState({
        grid: clearedGrid,
        isAnimating: false,
        gravityDirection: newDirection,
      })

      // Check for more cascading matches
      setTimeout(() => {
        const { matches } = findMatches(clearedGrid)
        if (matches) {
          processCascadingMatches(clearedGrid)
        } else {
          // Check if game over or level complete
          checkGameState()
        }
      }, 300)
    }, 250)
  }
}

// Update the useGameStore to remove tutorial-related state and functions
export const useGameStore = create<GameState>((set, get) => ({
  grid: [],
  selectedTile: null,
  score: 0,
  movesRemaining: 0,
  isAnimating: false,
  invalidSwap: false,
  gameOver: false,
  levelComplete: false,
  gravityDirection: "vertical",
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    animationSpeed: 1,
    vibrationEnabled: true,
  },

  initializeGame: () => {
    const { currentLevel } = useLevelStore.getState()
    const { upgradesOwned } = usePlayerStore.getState()

    // Apply extra moves upgrade if owned
    const extraMoves = upgradesOwned.includes("extra_moves") ? 2 : 0

    // Randomly choose gravity direction
    const gravityDirection = Math.random() < 0.5 ? "vertical" : "horizontal"

    set({
      grid: createEmptyGrid(currentLevel.id),
      selectedTile: null,
      score: 0,
      movesRemaining: currentLevel.moveLimit + extraMoves,
      isAnimating: false,
      invalidSwap: false,
      gameOver: false,
      levelComplete: false,
      gravityDirection,
    })
  },

  // Remove tutorial-related code from selectTile
  selectTile: (row: number, col: number) => {
    const { grid, isAnimating } = get()

    // Don't allow selection during animations
    if (isAnimating) return

    const tile = grid[row][col]

    // Don't allow selection of locked gates, foundation blocks, or locked cards
    if (tile.type === "locked-gate" || tile.type === "foundation-block" || tile.type === "locked-card") {
      return
    }

    // If selecting a special tile, activate it
    if (tile.special) {
      const { grid: updatedGrid, affectedTiles } = activateSpecialTile(grid, row, col)

      // Calculate score and resources
      const { upgradesOwned } = usePlayerStore.getState()
      const scoreBoost = upgradesOwned.includes("score_boost") ? 1.1 : 1
      const matchScore = Math.round((10 + affectedTiles.length * 2) * scoreBoost)
      const resourceGain = calculateResourceGain(affectedTiles, grid)

      // Update state
      set({
        grid: updatedGrid,
        selectedTile: null,
        score: get().score + matchScore,
        isAnimating: true,
      })

      // Update resources
      usePlayerStore.getState().addResources(resourceGain)

      // After animation, clear matched tiles and apply gravity
      setTimeout(() => {
        // Randomly choose gravity direction
        const newDirection = Math.random() < 0.5 ? "vertical" : "horizontal"

        const clearedGrid = clearMatchedTiles(updatedGrid, newDirection)
        set({
          grid: clearedGrid,
          isAnimating: false,
          gravityDirection: newDirection,
          movesRemaining: get().movesRemaining - 1,
        })

        // Check for cascading matches
        setTimeout(() => {
          const { matches } = findMatches(clearedGrid)
          if (matches) {
            processCascadingMatches(clearedGrid)
          } else {
            // Check if game over or level complete
            checkGameState()
          }
        }, 300)
      }, 300)

      return
    }

    // Regular tile selection
    set({ selectedTile: { row, col } })
  },

  // Remove tutorial-related code from swapTiles
  swapTiles: (row1: number, col1: number, row2: number, col2: number) => {
    const { grid, isAnimating } = get()

    // Don't allow swaps during animations
    if (isAnimating) return

    // Don't allow swapping with locked gates, foundation blocks, or locked cards
    if (
      grid[row1][col1].type === "locked-gate" ||
      grid[row1][col1].type === "foundation-block" ||
      grid[row1][col1].type === "locked-card" ||
      grid[row2][col2].type === "locked-gate" ||
      grid[row2][col2].type === "foundation-block" ||
      grid[row2][col2].type === "locked-card"
    ) {
      set({ invalidSwap: true })

      setTimeout(() => {
        set({
          invalidSwap: false,
          selectedTile: null,
        })
      }, 150)

      return
    }

    // Create a copy of the grid
    const newGrid = [...grid.map((row) => [...row])]

    // Swap the tiles
    const temp = { ...newGrid[row1][col1] }
    newGrid[row1][col1] = { ...newGrid[row2][col2] }
    newGrid[row2][col2] = temp

    // Check for matches after the swap
    const { matches, matchedTiles, matchGroups } = findMatches(newGrid)

    // If no matches, swap back and show animation
    if (!matches) {
      set({ invalidSwap: true })

      // Animate the swap back
      setTimeout(() => {
        set({
          invalidSwap: false,
          selectedTile: null,
          movesRemaining: get().movesRemaining - 1,
        })

        // Check if game over
        checkGameState()
      }, 150)

      return
    }

    // Valid swap - animate the slide
    set({ isAnimating: true })

    setTimeout(() => {
      // Mark matched tiles
      matchedTiles.forEach(([r, c]) => {
        newGrid[r][c].isMatched = true
      })

      // Create special tiles if applicable
      const gridWithSpecials = createSpecialTile(newGrid, matchGroups, [row2, col2])

      // Update obstacles
      const updatedGrid = updateObstacles(gridWithSpecials, matchedTiles)

      // Calculate score and resources
      const { upgradesOwned } = usePlayerStore.getState()
      const scoreBoost = upgradesOwned.includes("score_boost") ? 1.1 : 1
      const matchScore = Math.round((10 + (matchedTiles.length - 3) * 5) * scoreBoost)
      const resourceGain = calculateResourceGain(matchedTiles, grid)

      // Update state
      set({
        grid: updatedGrid,
        selectedTile: null,
        score: get().score + matchScore,
        isAnimating: true,
      })

      // Update resources
      usePlayerStore.getState().addResources(resourceGain)

      // After animation, clear matched tiles and apply gravity
      setTimeout(() => {
        // Randomly choose gravity direction
        const newDirection = Math.random() < 0.5 ? "vertical" : "horizontal"

        const clearedGrid = clearMatchedTiles(updatedGrid, newDirection)
        set({
          grid: clearedGrid,
          isAnimating: false,
          gravityDirection: newDirection,
          movesRemaining: get().movesRemaining - 1,
        })

        // Check for cascading matches
        setTimeout(() => {
          const { matches } = findMatches(clearedGrid)
          if (matches) {
            processCascadingMatches(clearedGrid)
          } else {
            // Check if game over or level complete
            checkGameState()
          }
        }, 300)
      }, 250)
    }, 200)
  },

  resetGame: () => {
    const { currentLevel } = useLevelStore.getState()
    const { upgradesOwned } = usePlayerStore.getState()

    // Apply extra moves upgrade if owned
    const extraMoves = upgradesOwned.includes("extra_moves") ? 2 : 0

    // Randomly choose gravity direction
    const gravityDirection = Math.random() < 0.5 ? "vertical" : "horizontal"

    set({
      grid: createEmptyGrid(currentLevel.id),
      selectedTile: null,
      score: 0,
      movesRemaining: currentLevel.moveLimit + extraMoves,
      isAnimating: false,
      invalidSwap: false,
      gameOver: false,
      levelComplete: false,
      gravityDirection,
    })
  },

  updateSettings: (settings: Partial<GameSettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
      },
    }))
  },
}))
