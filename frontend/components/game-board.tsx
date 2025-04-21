"use client"

import { useEffect, useState, useRef } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import Tile from "@/components/tile"
import { motion } from "framer-motion"
import { ArrowDown, ArrowRight, ArrowUp, ArrowLeft } from "lucide-react"

export default function GameBoard() {
  const {
    grid,
    selectedTile,
    selectTile,
    swapTiles,
    isAnimating,
    invalidSwap,
    gravityDirection,
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
        // Check if either tile is a locked gate
        const sourceTile = grid[selectedTile.row][selectedTile.col]
        const targetTile = grid[rowIndex][colIndex]
        
        if (sourceTile.type === "locked-gate" || targetTile.type === "locked-gate") {
          // Don't allow swapping with locked gates
          selectTile(rowIndex, colIndex)
          return
        }

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

  return (
    <div className="relative">
      <motion.div
        ref={boardRef}
        className="relative bg-white rounded-lg shadow-lg overflow-hidden"
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
                  onClick={() => handleTileClick(rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gravity direction indicator */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center items-center">
        <motion.div 
          className="flex items-center space-x-2 bg-white rounded-full px-3 py-1 shadow-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs font-medium">Gravity:</span>
          {gravityDirection === "down" ? (
            <ArrowDown className="h-4 w-4 text-blue-600" />
          ) : gravityDirection === "up" ? (
            <ArrowUp className="h-4 w-4 text-blue-600" />
          ) : gravityDirection === "right" ? (
            <ArrowRight className="h-4 w-4 text-blue-600" />
          ) : (
            <ArrowLeft className="h-4 w-4 text-blue-600" />
          )}
        </motion.div>
      </div>
    </div>
  )
}
