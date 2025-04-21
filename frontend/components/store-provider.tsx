"use client"

import { type ReactNode, useEffect } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"
import { usePlayerStore } from "@/lib/stores/player-store"
import { useRegionStore } from "@/lib/stores/region-store"

export function StoreProvider({ children }: { children: ReactNode }) {
  const { initializeGame } = useGameStore()
  const { initializeLevels } = useLevelStore()
  const { initializePlayer } = usePlayerStore()
  const { initializeRegions } = useRegionStore()

  useEffect(() => {
    initializeRegions()
    initializeLevels()
    initializePlayer()
    initializeGame()
  }, [initializeGame, initializeLevels, initializePlayer, initializeRegions])

  return <>{children}</>
}
