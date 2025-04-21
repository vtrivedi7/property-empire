"use client"

import { useState, useEffect } from "react"
import GameBoard from "@/components/game-board"
import GameHeader from "@/components/game-header"
import GameOverModal from "@/components/game-over-modal"
import LevelCompleteModal from "@/components/level-complete-modal"
import WorkshopModal from "@/components/workshop-modal"
import UserSelector from "@/components/user-selector"
import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"
import { useUserStore } from "@/lib/stores/user-store"

export default function GameScreen() {
  const { 
    gameOver, 
    levelComplete, 
    resetGame, 
    score,
    grid,
    selectedTile,
    isAnimating,
    gravityDirection,
    resources
  } = useGameStore()
  const { currentLevel, nextLevel, completeLevel } = useLevelStore()
  const { userId, gameState, updateGameState } = useUserStore()
  const [showWorkshop, setShowWorkshop] = useState(false)
  const [lastScore, setLastScore] = useState(0)

  // Sync game state when score or board changes
  useEffect(() => {
    if (!userId || !gameState) return

    const shouldUpdate = 
      score !== lastScore || 
      (grid && gameState.board?.grid && JSON.stringify(grid) !== JSON.stringify(gameState.board.grid))

    if (shouldUpdate) {
      updateGameState({
        score: score,
        level: currentLevel.id,
        properties: gameState.properties || 0,
        currency: (gameState.currency || 0) + (score - lastScore),
        board: {
          grid: grid || [],
          selectedTile: selectedTile || null,
          isAnimating: isAnimating || false,
          gravityDirection: gravityDirection || "down",
        },
        resources: resources || {},
      })
      setLastScore(score)
    }
  }, [
    score, 
    userId, 
    gameState, 
    currentLevel.id, 
    updateGameState, 
    lastScore,
    grid,
    selectedTile,
    isAnimating,
    gravityDirection,
    resources
  ])

  const handleNextLevel = async () => {
    if (!userId || !gameState) return

    // Complete current level with stars
    const stars = Math.min(3, Math.floor(score / currentLevel.targetScore))
    completeLevel(currentLevel.id, stars)
    
    // Update game state with new level and score
    await updateGameState({
      level: currentLevel.id + 1,
      score: score,
      properties: gameState.properties || 0,
      currency: (gameState.currency || 0) + score,
      board: {
        grid: grid || [],
        selectedTile: selectedTile || null,
        isAnimating: isAnimating || false,
        gravityDirection: gravityDirection || "down",
      },
      resources: resources || {},
    })
    
    // Move to next level
    nextLevel()
    
    // Reset game for new level
    resetGame()
    setLastScore(0)
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <UserSelector />
      {userId ? (
        <>
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
        </>
      ) : (
        <div className="text-center text-gray-500">
          Please sign in to start playing
        </div>
      )}
    </div>
  )
}
