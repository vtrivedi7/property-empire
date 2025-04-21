"use client"

import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"
import { usePlayerStore } from "@/lib/stores/player-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Home, RefreshCw } from "lucide-react"

export default function GameOverModal() {
  const { resetGame, score } = useGameStore()
  const { currentLevel } = useLevelStore()
  const { energy, decrementEnergy, maxEnergy } = usePlayerStore()

  const handleRetry = () => {
    decrementEnergy()
    resetGame()
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game Over</DialogTitle>
          <DialogDescription>Oh no! You ran out of moves before reaching the target score.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500 mb-2">Out of Moves!</div>
            <div className="text-lg mb-2">
              You scored <span className="font-bold">{score}</span> / {currentLevel.targetScore}
            </div>
            <div className="text-sm text-gray-500">
              Energy remaining: {energy}/{maxEnergy}
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          {energy > 0 ? (
            <Button onClick={handleRetry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry (Use 1 Energy)
            </Button>
          ) : (
            <Button disabled className="flex-1 opacity-50">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry (No Energy)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
