"use client"

import { create } from "zustand"
import type { Resources, UpgradeCost } from "@/lib/types"

interface PlayerState {
  energy: number
  maxEnergy: number
  playerXP: number
  playerLevel: number
  xpToNextLevel: number
  coins: number
  starsByLevel: Record<number, number>
  resources: Resources
  upgradesOwned: string[]

  initializePlayer: () => void
  decrementEnergy: () => void
  updateStarsByLevel: (levelId: number, stars: number) => void
  addResources: (resources: Resources) => void
  addXP: (amount: number) => void
  addCoins: (amount: number) => void
  purchaseUpgrade: (upgradeId: string, cost: UpgradeCost) => void
  calculateXpToNextLevel: () => number
}

// XP required for each level (index = level)
const XP_REQUIREMENTS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]

export const usePlayerStore = create<PlayerState>((set, get) => ({
  energy: 5,
  maxEnergy: 5,
  playerXP: 0,
  playerLevel: 1,
  xpToNextLevel: 100,
  coins: 0,
  starsByLevel: {},
  resources: {
    lumber: 0,
    brick: 0,
    steel: 0,
    cash: 0,
    glass: 0,
    concrete: 0,
    marble: 0,
    copper: 0,
    gold: 0,
  },
  upgradesOwned: [],

  initializePlayer: () => {
    set({
      energy: 5,
      maxEnergy: 5,
      playerXP: 0,
      playerLevel: 1,
      xpToNextLevel: 100,
      coins: 0,
      starsByLevel: {},
      resources: {
        lumber: 10,
        brick: 10,
        steel: 10,
        cash: 10,
        glass: 0,
        concrete: 0,
        marble: 0,
        copper: 0,
        gold: 0,
      },
      upgradesOwned: [],
    })
  },

  decrementEnergy: () => {
    set((state) => ({
      energy: Math.max(0, state.energy - 1),
    }))
  },

  updateStarsByLevel: (levelId: number, stars: number) => {
    set((state) => {
      const currentStars = state.starsByLevel[levelId] || 0
      const newStars = Math.max(currentStars, stars)

      // Calculate XP gain based on stars earned
      const xpGain = stars * 25 // 25 XP per star

      // Add XP
      get().addXP(xpGain)

      return {
        starsByLevel: {
          ...state.starsByLevel,
          [levelId]: newStars,
        },
      }
    })
  },

  addResources: (newResources: Resources) => {
    set((state) => ({
      resources: {
        lumber: state.resources.lumber + (newResources.lumber || 0),
        brick: state.resources.brick + (newResources.brick || 0),
        steel: state.resources.steel + (newResources.steel || 0),
        cash: state.resources.cash + (newResources.cash || 0),
        glass: state.resources.glass + (newResources.glass || 0),
        concrete: state.resources.concrete + (newResources.concrete || 0),
        marble: state.resources.marble + (newResources.marble || 0),
        copper: state.resources.copper + (newResources.copper || 0),
        gold: state.resources.gold + (newResources.gold || 0),
      },
    }))
  },

  calculateXpToNextLevel: () => {
    const { playerLevel } = get()
    const nextLevel = playerLevel + 1

    if (nextLevel < XP_REQUIREMENTS.length) {
      return XP_REQUIREMENTS[nextLevel]
    }

    // For levels beyond our predefined table, use a formula
    return Math.round(3250 + (nextLevel - 10) * 600)
  },

  addXP: (amount: number) => {
    const { playerXP, playerLevel } = get()
    const newXP = playerXP + amount

    let newLevel = playerLevel
    let leveledUp = false

    // Check if player leveled up
    while (newLevel < XP_REQUIREMENTS.length - 1 && newXP >= XP_REQUIREMENTS[newLevel + 1]) {
      newLevel++
      leveledUp = true
    }

    // If leveled up, add bonuses
    if (leveledUp) {
      // Add 1 energy when leveling up
      const newMaxEnergy = get().maxEnergy + 1

      set({
        playerXP: newXP,
        playerLevel: newLevel,
        xpToNextLevel: get().calculateXpToNextLevel(),
        maxEnergy: newMaxEnergy,
        energy: Math.min(get().energy + 1, newMaxEnergy), // Add 1 energy when leveling up
      })
    } else {
      set({
        playerXP: newXP,
        xpToNextLevel: get().calculateXpToNextLevel(),
      })
    }
  },

  addCoins: (amount: number) => {
    set((state) => ({
      coins: state.coins + amount,
    }))
  },

  purchaseUpgrade: (upgradeId: string, cost: UpgradeCost) => {
    const { resources, upgradesOwned, maxEnergy } = get()

    // Check if player can afford the upgrade
    const canAfford = Object.entries(cost).every(
      ([resource, amount]) => resources[resource as keyof Resources] >= (amount || 0),
    )

    if (canAfford && !upgradesOwned.includes(upgradeId)) {
      // Deduct resources
      const newResources = { ...resources }
      Object.entries(cost).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount || 0
      })

      // Apply special effects for certain upgrades
      let newMaxEnergy = maxEnergy
      if (upgradeId === "energy_boost") {
        newMaxEnergy += 1
      }

      // Add upgrade to owned list
      set({
        resources: newResources,
        upgradesOwned: [...upgradesOwned, upgradeId],
        maxEnergy: newMaxEnergy,
        energy: Math.min(get().energy + 1, newMaxEnergy), // Refill one energy when purchasing energy boost
      })
    }
  },
}))
