"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"
import { usePlayerStore } from "@/lib/stores/player-store"
import { useRegionStore } from "@/lib/stores/region-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowRight, Home, Star, Wrench, RefreshCw } from "lucide-react"

interface LevelCompleteModalProps {
  onWorkshop: () => void
}

export default function LevelCompleteModal({ onWorkshop }: LevelCompleteModalProps) {
  const { score, resetGame } = useGameStore()
  const { currentLevel, completeLevel, nextLevel } = useLevelStore()
  const { resources, addResources, playerLevel } = usePlayerStore()
  const { unlockNextRegion } = useRegionStore()

  // Calculate stars based on score percentage
  const scorePercentage = (score / currentLevel.targetScore) * 100
  const stars = scorePercentage >= 150 ? 3 : scorePercentage >= 100 ? 2 : scorePercentage >= 50 ? 1 : 0

  // Calculate XP gain
  const xpGain = stars * 25 // 25 XP per star

  const handleNextLevel = () => {
    // Complete current level and move to next
    completeLevel(currentLevel.id, stars)

    // Check if we should unlock a new region
    if (currentLevel.id % 3 === 0) {
      unlockNextRegion(currentLevel.regionId + 1)
    }

    nextLevel()
    resetGame()
  }

  const handleReplay = () => {
    resetGame()
  }

  const handleWorkshop = () => {
    // Complete current level
    completeLevel(currentLevel.id, stars)

    // Check if we should unlock a new region
    if (currentLevel.id % 3 === 0) {
      unlockNextRegion(currentLevel.regionId + 1)
    }

    // Open workshop
    onWorkshop()
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Level Complete!</DialogTitle>
          <DialogDescription>
            Congratulations! You completed the level with {score} points ({Math.round(scorePercentage)}% of target).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex items-center justify-center mb-4">
            {[...Array(3)].map((_, i) => (
              <Star
                key={i}
                className={`h-8 w-8 mx-1 ${i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>

          <div className="text-center mb-4">
            <div className="text-sm font-medium">XP Gained</div>
            <div className="text-xl font-bold text-blue-600">+{xpGain} XP</div>
            <div className="text-xs text-gray-500">Player Level: {playerLevel}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            {Object.entries(resources)
              .filter(([_, amount]) => amount > 0)
              .map(([resource, amount]) => (
                <div key={resource} className="text-center">
                  <div className="text-xs font-medium capitalize">{resource}</div>
                  <div className="text-sm font-bold">{amount}</div>
                </div>
              ))}
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleReplay}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Replay
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleWorkshop}>
            <Wrench className="mr-2 h-4 w-4" />
            Workshop
          </Button>
          <Button onClick={handleNextLevel} className="flex-1">
            Next Level
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
