"use client"

import { create } from "zustand"
import type { RegionConfig } from "@/lib/types"

interface RegionState {
  regions: RegionConfig[]
  currentRegionId: number
  currentRegion: RegionConfig

  initializeRegions: () => void
  setCurrentRegion: (regionId: number) => void
  unlockRegion: (regionId: number) => void
  unlockNextRegion: (currentRegionId: number) => void
}

export const useRegionStore = create<RegionState>((set, get) => ({
  regions: [],
  currentRegionId: 1,
  currentRegion: {
    id: 1,
    name: "Suburban",
    description: "A peaceful suburban area with family homes.",
    unlocked: true,
  },

  initializeRegions: () => {
    const regions: RegionConfig[] = [
      {
        id: 1,
        name: "Suburban",
        description: "A peaceful suburban area with family homes.",
        unlocked: true,
      },
      {
        id: 2,
        name: "Urban",
        description: "The bustling city center with high-rise buildings.",
        unlocked: false,
      },
      {
        id: 3,
        name: "Coastal",
        description: "Beautiful beachfront properties with ocean views.",
        unlocked: false,
      },
    ]

    set({
      regions,
      currentRegionId: 1,
      currentRegion: regions[0],
    })
  },

  setCurrentRegion: (regionId: number) => {
    const { regions } = get()
    const region = regions.find((r) => r.id === regionId) || regions[0]

    set({
      currentRegionId: regionId,
      currentRegion: region,
    })
  },

  unlockRegion: (regionId: number) => {
    set((state) => ({
      regions: state.regions.map((region) => (region.id === regionId ? { ...region, unlocked: true } : region)),
    }))
  },

  unlockNextRegion: (currentRegionId: number) => {
    const nextRegionId = currentRegionId + 1
    const { regions } = get()

    // Check if next region exists and is not already unlocked
    const nextRegion = regions.find((r) => r.id === nextRegionId)
    if (nextRegion && !nextRegion.unlocked) {
      set((state) => ({
        regions: state.regions.map((region) => (region.id === nextRegionId ? { ...region, unlocked: true } : region)),
      }))
    }
  },
}))
