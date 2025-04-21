"use client"

import { create } from "zustand"
import type { LevelConfig } from "@/lib/types"
import { usePlayerStore } from "./player-store"
import { useRegionStore } from "./region-store"

interface LevelState {
  levels: LevelConfig[]
  currentLevelId: number
  currentLevel: LevelConfig

  initializeLevels: () => void
  setCurrentLevel: (levelId: number) => void
  completeLevel: (levelId: number, stars: number) => void
  nextLevel: () => void
  unlockLevel: (levelId: number) => void
}

export const useLevelStore = create<LevelState>((set, get) => ({
  levels: [],
  currentLevelId: 1,
  currentLevel: {
    id: 1,
    regionId: 1,
    name: "Level 1",
    targetScore: 100,
    moveLimit: 20,
    unlocked: true,
  },

  initializeLevels: () => {
    const levels: LevelConfig[] = [
      {
        id: 1,
        regionId: 1,
        name: "Level 1",
        targetScore: 100,
        moveLimit: 20,
        unlocked: true,
      },
      {
        id: 2,
        regionId: 1,
        name: "Level 2",
        targetScore: 150,
        moveLimit: 18,
        unlocked: false,
        obstacles: {
          lockedGates: 1,
          foundationBlocks: 0,
          lockedCards: 1,
        },
      },
      {
        id: 3,
        regionId: 1,
        name: "Level 3",
        targetScore: 200,
        moveLimit: 16,
        unlocked: false,
        obstacles: {
          lockedGates: 1,
          foundationBlocks: 1,
          lockedCards: 1,
        },
      },
      {
        id: 4,
        regionId: 2,
        name: "Level 4",
        targetScore: 250,
        moveLimit: 20,
        unlocked: false,
        obstacles: {
          lockedGates: 2,
          foundationBlocks: 1,
          lockedCards: 2,
        },
      },
      {
        id: 5,
        regionId: 2,
        name: "Level 5",
        targetScore: 300,
        moveLimit: 18,
        unlocked: false,
        obstacles: {
          lockedGates: 2,
          foundationBlocks: 2,
          lockedCards: 2,
        },
      },
      {
        id: 6,
        regionId: 2,
        name: "Level 6",
        targetScore: 350,
        moveLimit: 16,
        unlocked: false,
        obstacles: {
          lockedGates: 3,
          foundationBlocks: 2,
          lockedCards: 3,
        },
      },
      {
        id: 7,
        regionId: 3,
        name: "Level 7",
        targetScore: 400,
        moveLimit: 22,
        unlocked: false,
        obstacles: {
          lockedGates: 3,
          foundationBlocks: 3,
          lockedCards: 3,
        },
      },
      {
        id: 8,
        regionId: 3,
        name: "Level 8",
        targetScore: 450,
        moveLimit: 20,
        unlocked: false,
        obstacles: {
          lockedGates: 4,
          foundationBlocks: 3,
          lockedCards: 4,
        },
      },
      {
        id: 9,
        regionId: 3,
        name: "Level 9",
        targetScore: 500,
        moveLimit: 18,
        unlocked: false,
        obstacles: {
          lockedGates: 4,
          foundationBlocks: 4,
          lockedCards: 4,
        },
      },
    ]

    set({
      levels,
      currentLevelId: 1,
      currentLevel: levels[0],
    })
  },

  setCurrentLevel: (levelId: number) => {
    const { levels } = get()
    const level = levels.find((l) => l.id === levelId) || levels[0]

    set({
      currentLevelId: levelId,
      currentLevel: level,
    })
  },

  completeLevel: (levelId: number, stars: number) => {
    const { updateStarsByLevel } = usePlayerStore.getState()
    const { levels } = get()
    updateStarsByLevel(levelId, stars)

    // Update level stars
    set((state) => ({
      levels: state.levels.map((level) =>
        level.id === levelId ? { ...level, stars: Math.max(level.stars || 0, stars) } : level,
      ),
    }))

    // Unlock the next level
    const nextLevelId = levelId + 1
    get().unlockLevel(nextLevelId)

    // Check if all levels in the current region have at least 1 star
    const { unlockNextRegion } = useRegionStore.getState()
    const currentLevel = levels.find((l) => l.id === levelId)

    if (currentLevel) {
      const regionId = currentLevel.regionId
      const levelsInRegion = levels.filter((l) => l.regionId === regionId)
      const allLevelsHaveStars = levelsInRegion.every((level) => {
        const starsForLevel = usePlayerStore.getState().starsByLevel[level.id] || 0
        return starsForLevel >= 1
      })

      if (allLevelsHaveStars) {
        unlockNextRegion(regionId)
      }
    }
  },

  nextLevel: () => {
    const { currentLevelId, levels } = get()
    const nextLevelId = currentLevelId + 1

    if (nextLevelId <= levels.length) {
      const nextLevel = levels.find((l) => l.id === nextLevelId) || levels[0]

      set({
        currentLevelId: nextLevelId,
        currentLevel: nextLevel,
      })
    }
  },

  unlockLevel: (levelId: number) => {
    set((state) => ({
      levels: state.levels.map((level) => (level.id === levelId ? { ...level, unlocked: true } : level)),
    }))
  },
}))
