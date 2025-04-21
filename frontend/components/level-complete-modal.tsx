"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameStore } from "@/lib/stores/game-store"
import { useLevelStore } from "@/lib/stores/level-store"
import { usePlayerStore } from "@/lib/stores/player-store"
import { Button } from "@/components/ui/button"
import { Star, Trophy, ArrowRight, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"

interface LevelCompleteModalProps {
  onClose: () => void
  onNextLevel: () => void
  onReplay: () => void
}

export default function LevelCompleteModal({ onClose, onNextLevel, onReplay }: LevelCompleteModalProps) {
  const { score, movesRemaining } = useGameStore()
  const { currentLevel } = useLevelStore()
  const { addXP } = usePlayerStore()
  const [showModal, setShowModal] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  // Calculate stars based on score vs target
  const calculateStars = () => {
    const ratio = score / currentLevel.targetScore
    if (ratio >= 1.5) return 3
    if (ratio >= 1.25) return 2
    return 1
  }

  const stars = calculateStars()
  const experienceGained = Math.round(score * (stars / 2))
  const bonusMoves = movesRemaining * 50

  useEffect(() => {
    // Trigger entrance animation
    setShowModal(true)

    // Trigger confetti
    const duration = 2000
    const particleCount = 100
    const spread = 70
    const startVelocity = 30

    confetti({
      particleCount,
      spread,
      startVelocity,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF69B4', '#4CAF50', '#2196F3'],
    })

    // Add experience points
    addXP(experienceGained)

    // Sequence the animations
    const timer1 = setTimeout(() => setAnimationPhase(1), 500)
    const timer2 = setTimeout(() => setAnimationPhase(2), 1000)
    const timer3 = setTimeout(() => setAnimationPhase(3), 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Level Complete!</h2>
              <p className="text-gray-600 mb-6">Congratulations on clearing Level {currentLevel.id}!</p>

              {/* Stars */}
              <motion.div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3].map((starIndex) => (
                  <motion.div
                    key={starIndex}
                    initial={{ scale: 0 }}
                    animate={animationPhase >= starIndex ? { scale: 1 } : { scale: 0 }}
                    transition={{ type: "spring", duration: 0.5, delay: starIndex * 0.2 }}
                  >
                    <Star
                      className={`w-12 h-12 ${
                        starIndex <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={animationPhase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                className="grid grid-cols-2 gap-4 mb-8"
              >
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">Final Score</p>
                  <p className="text-2xl font-bold text-blue-700">{score}</p>
                  <p className="text-xs text-blue-500">Target: {currentLevel.targetScore}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">Bonus Points</p>
                  <p className="text-2xl font-bold text-green-700">+{bonusMoves}</p>
                  <p className="text-xs text-green-500">From {movesRemaining} moves</p>
                </div>
              </motion.div>

              {/* Experience Gained */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={animationPhase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                className="bg-purple-50 rounded-lg p-4 mb-8"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <p className="text-purple-700 font-medium">
                    +{experienceGained} Experience Gained!
                  </p>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={animationPhase >= 3 ? { opacity: 1 } : { opacity: 0 }}
                className="flex gap-3"
              >
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onReplay}
                >
                  Play Again
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={onNextLevel}
                >
                  Next Level
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
