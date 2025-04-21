"use client"

import { useState } from "react"
import GameBoard from "@/components/game-board"
import GameHeader from "@/components/game-header"
import GameOverModal from "@/components/game-over-modal"
import LevelCompleteModal from "@/components/level-complete-modal"
import WorkshopModal from "@/components/workshop-modal"
import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"

export default function GameScreen() {
  const { gameOver, levelComplete, resetGame } = useGameStore()
  const { currentLevel, nextLevel, completeLevel } = useLevelStore()
  const [showWorkshop, setShowWorkshop] = useState(false)

  const handleNextLevel = () => {
    // Complete current level with stars
    const { score } = useGameStore.getState()
    const stars = Math.min(3, Math.floor(score / currentLevel.targetScore))
    completeLevel(currentLevel.id, stars)
    
    // Move to next level
    nextLevel()
    
    // Reset game for new level
    resetGame()
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <GameHeader onWorkshopClick={() => setShowWorkshop(true)} />
      <GameBoard />

      {gameOver && <GameOverModal />}
      {levelComplete && (
        <LevelCompleteModal 
          onClose={() => {}} 
          onNextLevel={handleNextLevel}
          onReplay={resetGame}
        />
      )}
      {showWorkshop && <WorkshopModal onClose={() => setShowWorkshop(false)} />}
    </div>
  )
}
