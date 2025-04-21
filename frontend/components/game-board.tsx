"use client"

import { useEffect, useState, useRef } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import Tile from "@/components/tile"
import { motion } from "framer-motion"
import { ArrowDown, ArrowRight } from "lucide-react"

export default function GameBoard() {
  const {
    grid,
    selectedTile,
    selectTile,
    swapTiles,
    isAnimating,
    invalidSwap,
    gravityDirection,
    tutorialStep,
    tutorialActive,
  } = useGameStore()

  const boardRef = useRef<HTMLDivElement>(null)
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth - 32, 400)
      setBoardSize({ width, height: width })
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (isAnimating) return

    if (selectedTile) {
      // Check if the clicked tile is adjacent to the selected tile
      const isAdjacent =
        (Math.abs(rowIndex - selectedTile.row) === 1 && colIndex === selectedTile.col) ||
        (Math.abs(colIndex - selectedTile.col) === 1 && rowIndex === selectedTile.row)

      if (isAdjacent) {
        swapTiles(selectedTile.row, selectedTile.col, rowIndex, colIndex)
      } else {
        // If not adjacent, select the new tile instead
        selectTile(rowIndex, colIndex)
      }
    } else {
      selectTile(rowIndex, colIndex)
    }
  }

  // Calculate tile size based on 8x8 grid
  const tileSize = boardSize.width / 8

  // Determine if a tile should be highlighted for tutorial
  const shouldHighlightTile = (row: number, col: number) => {
    if (!tutorialActive) return false

    if (tutorialStep === 1) {
      // Highlight potential match-3 tiles
      return (row === 3 && col >= 2 && col <= 4) || (row === 4 && col === 3) || (row === 5 && col === 3)
    } else if (tutorialStep === 2) {
      // Highlight potential match-4 tiles
      return row === 2 && col >= 2 && col <= 5
    } else if (tutorialStep === 3) {
      // Highlight locked gate and adjacent tiles
      const tile = grid[row][col]
      if (tile.type === "locked-gate") return true

      // Check if adjacent to a locked gate
      const adjacentPositions = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ]

      return adjacentPositions.some(([r, c]) => {
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          return grid[r][c].type === "locked-gate"
        }
        return false
      })
    }

    return false
  }

  return (
    <div className="relative">
      <motion.div
        ref={boardRef}
        className="relative bg-white rounded-lg shadow-md overflow-hidden"
        style={{ width: boardSize.width, height: boardSize.height }}
        animate={invalidSwap ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.15, ease: "easeInOut" }}
      >
        <div className="absolute inset-0">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((tile, colIndex) => (
                <Tile
                  key={`${rowIndex}-${colIndex}-${tile.id}`}
                  tile={tile}
                  size={tileSize}
                  row={rowIndex}
                  col={colIndex}
                  isSelected={selectedTile?.row === rowIndex && selectedTile?.col === colIndex}
                  isHighlighted={shouldHighlightTile(rowIndex, colIndex)}
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gravity direction indicator */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center items-center">
        <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-sm">
          <span className="text-xs font-medium">Gravity:</span>
          {gravityDirection === "vertical" ? (
            <ArrowDown className="h-4 w-4 text-blue-600" />
          ) : (
            <ArrowRight className="h-4 w-4 text-blue-600" />
          )}
        </div>
      </div>
    </div>
  )
}
