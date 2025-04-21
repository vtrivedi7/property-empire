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
      // Suburban Region (1)
      {
        id: 1,
        regionId: 1,
        name: "Suburban Start",
        targetScore: 100,
        moveLimit: 20,
        unlocked: true,
        description: "Welcome to the suburbs! Start building your property empire.",
      },
      {
        id: 2,
        regionId: 1,
        name: "Neighborhood Growth",
        targetScore: 150,
        moveLimit: 18,
        unlocked: false,
        description: "Expand your neighborhood with more properties.",
        obstacles: {
          lockedGates: 1,
          foundationBlocks: 0,
        },
      },
      {
        id: 3,
        regionId: 1,
        name: "Community Hub",
        targetScore: 200,
        moveLimit: 16,
        unlocked: false,
        description: "Create a thriving community center.",
        obstacles: {
          lockedGates: 1,
          foundationBlocks: 1,
        },
      },

      // Urban Region (2)
      {
        id: 4,
        regionId: 2,
        name: "City Entrance",
        targetScore: 250,
        moveLimit: 20,
        unlocked: false,
        description: "Welcome to the city! Build your first urban properties.",
        obstacles: {
          lockedGates: 2,
          foundationBlocks: 1,
        },
      },
      {
        id: 5,
        regionId: 2,
        name: "Downtown Development",
        targetScore: 300,
        moveLimit: 18,
        unlocked: false,
        description: "Develop the downtown area with modern buildings.",
        obstacles: {
          lockedGates: 2,
          foundationBlocks: 2,
        },
      },
      {
        id: 6,
        regionId: 2,
        name: "Business District",
        targetScore: 350,
        moveLimit: 16,
        unlocked: false,
        description: "Create a bustling business district.",
        obstacles: {
          lockedGates: 3,
          foundationBlocks: 2,
        },
      },

      // Coastal Region (3)
      {
        id: 7,
        regionId: 3,
        name: "Beachfront Properties",
        targetScore: 400,
        moveLimit: 22,
        unlocked: false,
        description: "Build luxurious beachfront properties.",
        obstacles: {
          lockedGates: 3,
          foundationBlocks: 3,
        },
      },
      {
        id: 8,
        regionId: 3,
        name: "Marina Development",
        targetScore: 450,
        moveLimit: 20,
        unlocked: false,
        description: "Develop a modern marina complex.",
        obstacles: {
          lockedGates: 4,
          foundationBlocks: 3,
        },
      },
      {
        id: 9,
        regionId: 3,
        name: "Coastal Paradise",
        targetScore: 500,
        moveLimit: 18,
        unlocked: false,
        description: "Create a coastal paradise with premium properties.",
        obstacles: {
          lockedGates: 4,
          foundationBlocks: 4,
        },
      },

      // Mountain Region (4)
      {
        id: 10,
        regionId: 4,
        name: "Mountain Retreat",
        targetScore: 550,
        moveLimit: 24,
        unlocked: false,
        description: "Build a peaceful mountain retreat.",
        obstacles: {
          lockedGates: 4,
          foundationBlocks: 4,
        },
      },
      {
        id: 11,
        regionId: 4,
        name: "Ski Resort",
        targetScore: 600,
        moveLimit: 22,
        unlocked: false,
        description: "Develop a world-class ski resort.",
        obstacles: {
          lockedGates: 5,
          foundationBlocks: 4,
        },
      },
      {
        id: 12,
        regionId: 4,
        name: "Mountain Village",
        targetScore: 650,
        moveLimit: 20,
        unlocked: false,
        description: "Create a charming mountain village.",
        obstacles: {
          lockedGates: 5,
          foundationBlocks: 5,
        },
      },

      // Metro Region (5)
      {
        id: 13,
        regionId: 5,
        name: "Metro Center",
        targetScore: 700,
        moveLimit: 26,
        unlocked: false,
        description: "Build the heart of the metropolitan area.",
        obstacles: {
          lockedGates: 5,
          foundationBlocks: 5,
        },
      },
      {
        id: 14,
        regionId: 5,
        name: "Financial District",
        targetScore: 750,
        moveLimit: 24,
        unlocked: false,
        description: "Develop a thriving financial district.",
        obstacles: {
          lockedGates: 6,
          foundationBlocks: 5,
        },
      },
      {
        id: 15,
        regionId: 5,
        name: "Metropolitan Empire",
        targetScore: 800,
        moveLimit: 22,
        unlocked: false,
        description: "Create your ultimate property empire.",
        obstacles: {
          lockedGates: 6,
          foundationBlocks: 6,
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

    // Unlock the next level if at least 1 star is earned
    if (stars >= 1) {
      const nextLevelId = levelId + 1
      get().unlockLevel(nextLevelId)
    }

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
