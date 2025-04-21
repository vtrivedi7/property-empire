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
  gravityDirection: "up" | "down" | "left" | "right"
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
const clearMatchedTiles = (grid: TileType[][], direction: "up" | "down" | "left" | "right"): TileType[][] => {
  const newGrid = [...grid.map((row) => [...row])]

  if (direction === "down") {
    // Process each column from bottom to top
    for (let j = 0; j < GRID_SIZE; j++) {
      let emptySpaces = 0
      
      // First pass: Count empty spaces and move tiles down
      for (let i = GRID_SIZE - 1; i >= 0; i--) {
        if (newGrid[i][j].isMatched) {
          emptySpaces++
        } else if (emptySpaces > 0 && !isObstacleTile(newGrid[i][j])) {
          // Move tile down by emptySpaces
          newGrid[i + emptySpaces][j] = { ...newGrid[i][j], isNew: true }
          newGrid[i][j] = { ...newGrid[i][j], isMatched: true }
        }
      }

      // Second pass: Fill empty spaces at top with new tiles
      for (let i = 0; i < emptySpaces; i++) {
        const newType = getRandomTileType()
        newGrid[i][j] = {
          id: `new-${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
          type: newType,
          isMatched: false,
          special: null,
          resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
          isNew: true,
          fallingFrom: -1, // Start above the grid
        }
      }
    }
  } else if (direction === "up") {
    // Process each column from top to bottom
    for (let j = 0; j < GRID_SIZE; j++) {
      let emptySpaces = 0
      
      // First pass: Count empty spaces and move tiles up
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i][j].isMatched) {
          emptySpaces++
        } else if (emptySpaces > 0 && !isObstacleTile(newGrid[i][j])) {
          // Move tile up by emptySpaces
          newGrid[i - emptySpaces][j] = { ...newGrid[i][j], isNew: true }
          newGrid[i][j] = { ...newGrid[i][j], isMatched: true }
        }
      }

      // Second pass: Fill empty spaces at bottom with new tiles
      for (let i = GRID_SIZE - 1; i >= GRID_SIZE - emptySpaces; i--) {
        const newType = getRandomTileType()
        newGrid[i][j] = {
          id: `new-${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
          type: newType,
          isMatched: false,
          special: null,
          resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
          isNew: true,
          fallingFrom: GRID_SIZE, // Start below the grid
        }
      }
    }
  } else if (direction === "right") {
    // Process each row from right to left
    for (let i = 0; i < GRID_SIZE; i++) {
      let emptySpaces = 0
      
      // First pass: Count empty spaces and move tiles right
      for (let j = GRID_SIZE - 1; j >= 0; j--) {
        if (newGrid[i][j].isMatched) {
          emptySpaces++
        } else if (emptySpaces > 0 && !isObstacleTile(newGrid[i][j])) {
          // Move tile right by emptySpaces
          newGrid[i][j + emptySpaces] = { ...newGrid[i][j], isNew: true }
          newGrid[i][j] = { ...newGrid[i][j], isMatched: true }
        }
      }

      // Second pass: Fill empty spaces at left with new tiles
      for (let j = 0; j < emptySpaces; j++) {
        const newType = getRandomTileType()
        newGrid[i][j] = {
          id: `new-${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
          type: newType,
          isMatched: false,
          special: null,
          resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
          isNew: true,
          fallingFrom: -1, // Start left of the grid
        }
      }
    }
  } else if (direction === "left") {
    // Process each row from left to right
    for (let i = 0; i < GRID_SIZE; i++) {
      let emptySpaces = 0
      
      // First pass: Count empty spaces and move tiles left
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j].isMatched) {
          emptySpaces++
        } else if (emptySpaces > 0 && !isObstacleTile(newGrid[i][j])) {
          // Move tile left by emptySpaces
          newGrid[i][j - emptySpaces] = { ...newGrid[i][j], isNew: true }
          newGrid[i][j] = { ...newGrid[i][j], isMatched: true }
        }
      }

      // Second pass: Fill empty spaces at right with new tiles
      for (let j = GRID_SIZE - 1; j >= GRID_SIZE - emptySpaces; j--) {
        const newType = getRandomTileType()
        newGrid[i][j] = {
          id: `new-${i}-${j}-${Math.random().toString(36).substring(2, 9)}`,
          type: newType,
          isMatched: false,
          special: null,
          resourceType: RESOURCE_MAPPING[newType as keyof typeof RESOURCE_MAPPING],
          isNew: true,
          fallingFrom: GRID_SIZE, // Start right of the grid
        }
      }
    }
  }

  return newGrid
}

const isObstacleTile = (tile: TileType): boolean => {
  return (
    tile.type === "locked-gate" ||
    tile.type === "foundation-block" ||
    tile.type === "locked-card"
  )
}

// Determine special tile type based on match pattern
const determineSpecialTileType = (matchGroup: [number, number][], lastSwapped: [number, number]): SpecialTileType => {
  const length = matchGroup.length
  const isStraight = isStraightLine(matchGroup)
  const isT_or_L = isT_or_L_Shape(matchGroup)
  const isCross = isCrossShape(matchGroup)

  if (length === 4 && isStraight) {
    return "renovation-bomb"
  } else if (length === 5 && isT_or_L) {
    return "market-mixer"
  } else if (length === 5 && isStraight) {
    return "skyscraper-leveller"
  } else if (length >= 6 && isCross) {
    return "urban-redevelopment"
  }

  return null
}

const isStraightLine = (tiles: [number, number][]): boolean => {
  if (tiles.length < 3) return false

  // Check if all tiles are in the same row
  const sameRow = tiles.every(([row]) => row === tiles[0][0])
  if (sameRow) return true

  // Check if all tiles are in the same column
  const sameCol = tiles.every(([, col]) => col === tiles[0][1])
  if (sameCol) return true

  return false
}

const isT_or_L_Shape = (tiles: [number, number][]): boolean => {
  if (tiles.length !== 5) return false

  // Sort tiles by row and column
  const sortedByRow = [...tiles].sort((a, b) => a[0] - b[0])
  const sortedByCol = [...tiles].sort((a, b) => a[1] - b[1])

  // Check for T shape
  const hasTShape = () => {
    // Find the middle row (should have 3 tiles)
    const middleRow = sortedByRow[2][0]
    const tilesInMiddleRow = tiles.filter(([row]) => row === middleRow)
    if (tilesInMiddleRow.length !== 3) return false

    // Find the middle column (should have 3 tiles)
    const middleCol = sortedByCol[2][1]
    const tilesInMiddleCol = tiles.filter(([, col]) => col === middleCol)
    if (tilesInMiddleCol.length !== 3) return false

    // Check if the intersection point exists
    return tiles.some(([row, col]) => row === middleRow && col === middleCol)
  }

  // Check for L shape
  const hasLShape = () => {
    // Find the corner (should have 3 tiles in one row and 3 tiles in one column)
    const rowCounts = new Map<number, number>()
    const colCounts = new Map<number, number>()
    
    tiles.forEach(([row, col]) => {
      rowCounts.set(row, (rowCounts.get(row) || 0) + 1)
      colCounts.set(col, (colCounts.get(col) || 0) + 1)
    })

    // Find rows and columns with 3 tiles
    const rowsWith3 = Array.from(rowCounts.entries()).filter(([_, count]) => count === 3)
    const colsWith3 = Array.from(colCounts.entries()).filter(([_, count]) => count === 3)

    if (rowsWith3.length !== 1 || colsWith3.length !== 1) return false

    const [rowWith3] = rowsWith3[0]
    const [colWith3] = colsWith3[0]

    // Check if the corner point exists
    return tiles.some(([row, col]) => row === rowWith3 && col === colWith3)
  }

  return hasTShape() || hasLShape()
}

const isCrossShape = (tiles: [number, number][]): boolean => {
  if (tiles.length < 6) return false

  // Find center tile (if any)
  const centerRow = Math.floor(tiles.reduce((sum, [row]) => sum + row, 0) / tiles.length)
  const centerCol = Math.floor(tiles.reduce((sum, [, col]) => sum + col, 0) / tiles.length)

  // Check if there's a center tile
  const hasCenter = tiles.some(([row, col]) => row === centerRow && col === centerCol)
  if (!hasCenter) return false

  // Count tiles in each direction from center
  const horizontal = tiles.filter(([row, col]) => row === centerRow).length
  const vertical = tiles.filter(([row, col]) => col === centerCol).length

  // Must have at least 3 tiles in each direction
  return horizontal >= 3 && vertical >= 3
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
    if (!specialType) continue

    // For market-mixer (T/L shape), place at pivot
    if (specialType === "market-mixer") {
      const pivot = findPivotTile(matchGroup)
      if (pivot) {
        newGrid[pivot[0]][pivot[1]].special = specialType
        break
      }
    }
    // For urban-redevelopment (cross), place at center
    else if (specialType === "urban-redevelopment") {
      const center = findCenterTile(matchGroup)
      if (center) {
        newGrid[center[0]][center[1]].special = specialType
        break
      }
    }
    // For skyscraper-leveller (5-tile straight), place at swapped-tile cell
    else if (specialType === "skyscraper-leveller") {
      const [row, col] = lastSwapped
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        newGrid[row][col].special = specialType
        break
      }
    }
    // For renovation-bomb (4-tile), place at last-moved cell
    else if (specialType === "renovation-bomb") {
      const [row, col] = lastSwapped
      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        newGrid[row][col].special = specialType
        break
      }
    }
  }

  return newGrid
}

// Helper function to find pivot tile in T/L shape
const findPivotTile = (tiles: [number, number][]): [number, number] | null => {
  // For T shape: the middle tile of the top/bottom row
  // For L shape: the corner tile
  if (tiles.length !== 5) return null

  // Sort tiles by row and column
  const byRow = [...tiles].sort((a, b) => a[0] - b[0])
  const byCol = [...tiles].sort((a, b) => a[1] - b[1])

  // Find tile that connects both segments
  for (const [row, col] of tiles) {
    let horizontalCount = tiles.filter(t => t[0] === row).length
    let verticalCount = tiles.filter(t => t[1] === col).length
    
    if (horizontalCount >= 2 && verticalCount >= 2) {
      return [row, col]
    }
  }

  return null
}

// Helper function to find center tile in cross shape
const findCenterTile = (tiles: [number, number][]): [number, number] | null => {
  if (tiles.length < 6) return null

  // Calculate average position (center)
  const centerRow = Math.round(tiles.reduce((sum, [row]) => sum + row, 0) / tiles.length)
  const centerCol = Math.round(tiles.reduce((sum, [, col]) => sum + col, 0) / tiles.length)

  // Find the tile closest to center that has both horizontal and vertical matches
  let centerTile: [number, number] | null = null
  let minDistance = Infinity

  for (const [row, col] of tiles) {
    const horizontalCount = tiles.filter(t => t[0] === row).length
    const verticalCount = tiles.filter(t => t[1] === col).length
    
    if (horizontalCount >= 3 && verticalCount >= 3) {
      const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol)
      if (distance < minDistance) {
        minDistance = distance
        centerTile = [row, col]
      }
    }
  }

  return centerTile
}

// Calculate resources gained from matches
const calculateResourceGain = (matchedTiles: [number, number][], grid: TileType[][]): Resources => {
  const resources: Resources = {
    lumber: 0,
    brick: 0,
    steel: 0,
    cash: 0,
    glass: 0,
    concrete: 0,
  }

  matchedTiles.forEach(([row, col]) => {
    const tile = grid[row][col]
    if (tile.resourceType) {
      resources[tile.resourceType]++
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
  const tile = grid[row][col]
  if (!tile.special) return { grid, affectedTiles: [] }

  const affectedTiles: [number, number][] = []
  const newGrid = [...grid.map(row => [...row])]

  switch (tile.special) {
    case "renovation-bomb":
      // Clear entire row (placed at last-moved cell)
      for (let j = 0; j < GRID_SIZE; j++) {
        affectedTiles.push([row, j])
        newGrid[row][j].isMatched = true
        newGrid[row][j].isSpecialCleared = true
        newGrid[row][j].isClearing = true
      }
      break

    case "market-mixer":
      // Clear 3x3 block (placed at pivot cell of T/L shape)
      for (let i = Math.max(0, row - 1); i <= Math.min(GRID_SIZE - 1, row + 1); i++) {
        for (let j = Math.max(0, col - 1); j <= Math.min(GRID_SIZE - 1, col + 1); j++) {
          affectedTiles.push([i, j])
          newGrid[i][j].isMatched = true
          newGrid[i][j].isSpecialCleared = true
          newGrid[i][j].isClearing = true
        }
      }
      break

    case "skyscraper-leveller":
      // Clear entire column (placed at swapped-tile cell)
      for (let i = 0; i < GRID_SIZE; i++) {
        affectedTiles.push([i, col])
        newGrid[i][col].isMatched = true
        newGrid[i][col].isSpecialCleared = true
        newGrid[i][col].isClearing = true
      }
      break

    case "urban-redevelopment":
      // Clear entire row and column (placed at center of cross)
      // Clear row
      for (let j = 0; j < GRID_SIZE; j++) {
        affectedTiles.push([row, j])
        newGrid[row][j].isMatched = true
        newGrid[row][j].isSpecialCleared = true
        newGrid[row][j].isClearing = true
      }
      // Clear column (excluding already cleared center)
      for (let i = 0; i < GRID_SIZE; i++) {
        if (i !== row) {
          affectedTiles.push([i, col])
          newGrid[i][col].isMatched = true
          newGrid[i][col].isSpecialCleared = true
          newGrid[i][col].isClearing = true
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
      // Get the current gravity direction (set during the initial swap)
      const { gravityDirection } = useGameStore.getState()
      
      // Apply gravity with the current direction
      const clearedGrid = clearMatchedTiles(updatedGrid, gravityDirection)
      
      useGameStore.setState({
        grid: clearedGrid,
        isAnimating: false,
      })

      // Check for more cascading matches after a longer delay
      setTimeout(() => {
        const { matches } = findMatches(clearedGrid)
        if (matches) {
          processCascadingMatches(clearedGrid)
        } else {
          // After all cascading matches are complete, set the new gravity direction for the next move
          const newDirection = getRandomDirection()
          useGameStore.setState({
            gravityDirection: newDirection,
          })
          // Check if game over or level complete
          checkGameState()
        }
      }, 600)
    }, 500)
  }
}

// Update the random direction selection
const getRandomDirection = (): "up" | "down" | "left" | "right" => {
  const directions: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"]
  return directions[Math.floor(Math.random() * directions.length)]
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
  gravityDirection: "down",
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
    const gravityDirection = getRandomDirection()

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

      // Special tile clear animation timing
      const clearDelay = tile.special === "urban-redevelopment" ? 400 : 300

      // After special clear animation, apply gravity
      setTimeout(() => {
        // Randomly choose gravity direction
        const newDirection = getRandomDirection()

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
        }, clearDelay + 100) // Add small buffer for smooth transition
      }, clearDelay)

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
        // Get the current gravity direction (set at the start of this move)
        const { gravityDirection } = get()
        
        // Apply gravity with the current direction
        const clearedGrid = clearMatchedTiles(updatedGrid, gravityDirection)
        
        set({
          grid: clearedGrid,
          isAnimating: false,
          movesRemaining: get().movesRemaining - 1,
        })

        // Check for cascading matches after a longer delay
        setTimeout(() => {
          const { matches } = findMatches(clearedGrid)
          if (matches) {
            processCascadingMatches(clearedGrid)
          } else {
            // After all cascading matches are complete, set the new gravity direction for the next move
            const newDirection = getRandomDirection()
            set({
              gravityDirection: newDirection,
            })
            // Check if game over or level complete
            checkGameState()
          }
        }, 600)
      }, 500)
    }, 400)
  },

  resetGame: () => {
    const { currentLevel } = useLevelStore.getState()
    const { upgradesOwned } = usePlayerStore.getState()

    // Apply extra moves upgrade if owned
    const extraMoves = upgradesOwned.includes("extra_moves") ? 2 : 0

    // Randomly choose gravity direction
    const gravityDirection = getRandomDirection()

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
