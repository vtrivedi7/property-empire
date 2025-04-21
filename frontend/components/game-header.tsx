"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"
import { usePlayerStore } from "@/lib/stores/player-store"
import { useRegionStore } from "@/lib/stores/region-store"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Home, RefreshCw, Wrench } from "lucide-react"
import ResourceCounter from "./resource-counter"

interface GameHeaderProps {
  onWorkshopClick: () => void
}

export default function GameHeader({ onWorkshopClick }: GameHeaderProps) {
  const { score, movesRemaining, resetGame } = useGameStore()
  const { currentLevel } = useLevelStore()
  const { energy, resources, playerLevel, playerXP, xpToNextLevel } = usePlayerStore()
  const { currentRegion } = useRegionStore()

  const progressPercentage = Math.min(100, Math.round((score / currentLevel.targetScore) * 100))
  const xpProgressPercentage = Math.min(100, Math.round((playerXP / xpToNextLevel) * 100))

  return (
    <div className="w-full mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="icon">
          <Home className="h-5 w-5" />
        </Button>
        <div className="text-lg font-bold text-center">
          {currentRegion.name} - Level {currentLevel.id}
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={onWorkshopClick}>
            <Wrench className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <span className="mr-1">⚡</span> {energy}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetGame}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Restart
        </Button>
      </div>

      {/* Player Level and XP */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          Player Level: <span className="text-blue-600 font-bold">{playerLevel}</span>
        </div>
        <div className="text-sm font-medium">
          XP: {playerXP} / {xpToNextLevel}
        </div>
      </div>
      <Progress value={xpProgressPercentage} className="h-1.5 bg-blue-100 [&>div]:bg-blue-500" />

      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          Score: {score} / {currentLevel.targetScore}
        </div>
        <div className="text-sm font-medium">
          Moves: {movesRemaining} / {currentLevel.moveLimit}
        </div>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="flex flex-wrap justify-between items-center gap-2">
        {Object.entries(resources).map(([resource, amount]) => (
          <ResourceCounter key={resource} type={resource} amount={amount} />
        ))}
      </div>
    </div>
  )
}
