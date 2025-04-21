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
  const { gameOver, levelComplete } = useGameStore()
  const { currentLevel } = useLevelStore()
  const [showWorkshop, setShowWorkshop] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <GameHeader onWorkshopClick={() => setShowWorkshop(true)} />
      <GameBoard />

      {gameOver && <GameOverModal />}
      {levelComplete && <LevelCompleteModal onWorkshop={() => setShowWorkshop(true)} />}
      {showWorkshop && <WorkshopModal onClose={() => setShowWorkshop(false)} />}
    </div>
  )
}
