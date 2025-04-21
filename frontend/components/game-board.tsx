"use client"

import { useEffect, useState, useRef } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import Tile from "@/components/tile"
import { motion } from "framer-motion"
import { ArrowDown, ArrowRight, ArrowUp, ArrowLeft } from "lucide-react"
import { vibrate } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function GameBoard() {
  const {
    grid,
    selectedTile,
    selectTile,
    swapTiles,
    isAnimating,
    invalidSwap,
    gravityDirection,
    settings,
    findMatches,
  } = useGameStore()

  const boardRef = useRef<HTMLDivElement>(null)
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 })
  const [focusedTile, setFocusedTile] = useState<{ row: number; col: number } | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [draggedTile, setDraggedTile] = useState<{ row: number; col: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [swappingTiles, setSwappingTiles] = useState<{
    source: { row: number; col: number };
    target: { row: number; col: number };
    isValid: boolean;
  } | null>(null)

  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth - 32, 400)
      setBoardSize({ width, height: width })
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  // Add touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const playSound = (soundName: string) => {
    if (settings.soundEnabled) {
      new Audio(`/sounds/${soundName}.mp3`).play().catch(() => {})
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const threshold = 50 // Minimum distance for swipe

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right
          if (focusedTile) {
            const newCol = Math.min(7, focusedTile.col + 1)
            setFocusedTile({ ...focusedTile, col: newCol })
            playSound("navigate")
            if (settings.vibrationEnabled) {
              vibrate(20)
            }
          }
        } else {
          // Swipe left
          if (focusedTile) {
            const newCol = Math.max(0, focusedTile.col - 1)
            setFocusedTile({ ...focusedTile, col: newCol })
            playSound("navigate")
            if (settings.vibrationEnabled) {
              vibrate(20)
            }
          }
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          // Swipe down
          if (focusedTile) {
            const newRow = Math.min(7, focusedTile.row + 1)
            setFocusedTile({ ...focusedTile, row: newRow })
            playSound("navigate")
            if (settings.vibrationEnabled) {
              vibrate(20)
            }
          }
        } else {
          // Swipe up
          if (focusedTile) {
            const newRow = Math.max(0, focusedTile.row - 1)
            setFocusedTile({ ...focusedTile, row: newRow })
            playSound("navigate")
            if (settings.vibrationEnabled) {
              vibrate(20)
            }
          }
        }
      }
    } else {
      // Tap
      if (focusedTile) {
        handleTileClick(focusedTile.row, focusedTile.col)
      }
    }

    setTouchStart(null)
  }

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedTile) return

      const { row, col } = focusedTile
      let newRow = row
      let newCol = col

      switch (e.key) {
        case "ArrowUp":
          newRow = Math.max(0, row - 1)
          break
        case "ArrowDown":
          newRow = Math.min(7, row + 1)
          break
        case "ArrowLeft":
          newCol = Math.max(0, col - 1)
          break
        case "ArrowRight":
          newCol = Math.min(7, col + 1)
          break
        case "Enter":
        case " ":
          handleTileClick(row, col)
          return
        default:
          return
      }

      if (newRow !== row || newCol !== col) {
        setFocusedTile({ row: newRow, col: newCol })
        playSound("navigate")
        if (settings.vibrationEnabled) {
          vibrate(20) // Light vibration for navigation
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [focusedTile, settings.soundEnabled, settings.vibrationEnabled])

  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (isAnimating) return

    // Play click sound and provide haptic feedback
    playSound("click")
    if (settings.vibrationEnabled) {
      vibrate(30)
    }

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
          playSound("error")
          if (settings.vibrationEnabled) {
            vibrate(100) // Longer vibration for error
          }
          selectTile(rowIndex, colIndex)
          return
        }

        // Check if the swap is valid
        const isValidSwap = checkValidSwap(selectedTile.row, selectedTile.col, rowIndex, colIndex)

        // Start swap animation
        setSwappingTiles({
          source: { row: selectedTile.row, col: selectedTile.col },
          target: { row: rowIndex, col: colIndex },
          isValid: isValidSwap
        })

        // Perform the swap immediately
        swapTiles(selectedTile.row, selectedTile.col, rowIndex, colIndex)

        // Clear animation state after a short delay
        setTimeout(() => {
          setSwappingTiles(null)
        }, 300)
      } else {
        // If not adjacent, select the new tile instead
        selectTile(rowIndex, colIndex)
      }
    } else {
      selectTile(rowIndex, colIndex)
    }
  }

  const checkValidSwap = (sourceRow: number, sourceCol: number, targetRow: number, targetCol: number) => {
    // Create a copy of the grid to test the swap
    const testGrid = grid.map(row => [...row])
    const temp = testGrid[sourceRow][sourceCol]
    testGrid[sourceRow][sourceCol] = testGrid[targetRow][targetCol]
    testGrid[targetRow][targetCol] = temp

    // Check if the swap creates any matches
    const { matches } = findMatches(testGrid)
    return matches
  }

  // Calculate tile size based on 8x8 grid
  const tileSize = boardSize.width / 8

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, row: number, col: number) => {
    if (isAnimating) return

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    const tileElement = e.currentTarget as HTMLElement
    const rect = tileElement.getBoundingClientRect()
    
    setDraggedTile({ row, col })
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    })

    // Play sound and provide haptic feedback
    playSound("click")
    if (settings.vibrationEnabled) {
      vibrate(30)
    }
  }

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTile) return

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    const boardElement = boardRef.current
    if (!boardElement) return

    const boardRect = boardElement.getBoundingClientRect()
    const tileSize = boardSize.width / 8

    // Calculate potential target tile
    const targetCol = Math.floor((clientX - boardRect.left) / tileSize)
    const targetRow = Math.floor((clientY - boardRect.top) / tileSize)

    // Update focused tile for visual feedback
    if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
      setFocusedTile({ row: targetRow, col: targetCol })
    }
  }

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedTile) return

    const clientX = 'changedTouches' in e 
      ? e.changedTouches[0].clientX 
      : (e as React.MouseEvent).clientX
    const clientY = 'changedTouches' in e 
      ? e.changedTouches[0].clientY 
      : (e as React.MouseEvent).clientY

    const boardElement = boardRef.current
    if (!boardElement) return

    const boardRect = boardElement.getBoundingClientRect()
    const tileSize = boardSize.width / 8

    // Calculate target tile
    const targetCol = Math.floor((clientX - boardRect.left) / tileSize)
    const targetRow = Math.floor((clientY - boardRect.top) / tileSize)

    // Reset drag state
    setDraggedTile(null)
    setFocusedTile(null)
    setDragOffset({ x: 0, y: 0 })

    // Check if drop is valid
    if (
      targetRow >= 0 && targetRow < 8 &&
      targetCol >= 0 && targetCol < 8 &&
      (Math.abs(targetRow - draggedTile.row) === 1 && targetCol === draggedTile.col) ||
      (Math.abs(targetCol - draggedTile.col) === 1 && targetRow === draggedTile.row)
    ) {
      // Check if either tile is a locked gate
      const sourceTile = grid[draggedTile.row][draggedTile.col]
      const targetTile = grid[targetRow][targetCol]
      
      if (sourceTile.type === "locked-gate" || targetTile.type === "locked-gate") {
        // Don't allow swapping with locked gates
        playSound("error")
        if (settings.vibrationEnabled) {
          vibrate(100)
        }
        return
      }

      // Start swap animation
      setSwappingTiles({
        source: { row: draggedTile.row, col: draggedTile.col },
        target: { row: targetRow, col: targetCol },
        isValid: true
      })

      // After animation, perform the actual swap
      setTimeout(() => {
        swapTiles(draggedTile.row, draggedTile.col, targetRow, targetCol)
        setSwappingTiles(null)
      }, 500) // Match this with the animation duration
    } else {
      // Invalid swap - animate back and shake
      setSwappingTiles({
        source: { row: draggedTile.row, col: draggedTile.col },
        target: { row: draggedTile.row, col: draggedTile.col },
        isValid: false
      })

      playSound("error")
      if (settings.vibrationEnabled) {
        vibrate(100)
      }

      // Reset after animation
      setTimeout(() => {
        setSwappingTiles(null)
      }, 500)
    }
  }

  return (
    <div className="relative">
      <motion.div
        ref={boardRef}
        className="relative bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ width: boardSize.width, height: boardSize.height }}
        onMouseMove={handleDrag}
        onTouchMove={handleDrag}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
      >
        <div className="absolute inset-0">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((tile, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}-${tile.id}`}
                  data-row={rowIndex}
                  data-col={colIndex}
                  className={cn(
                    "relative",
                    draggedTile?.row === rowIndex && draggedTile?.col === colIndex ? "z-10" : ""
                  )}
                  style={{
                    width: tileSize,
                    height: tileSize,
                  }}
                  animate={
                    swappingTiles && (
                      (swappingTiles.source.row === rowIndex && swappingTiles.source.col === colIndex) ||
                      (swappingTiles.target.row === rowIndex && swappingTiles.target.col === colIndex)
                    )
                      ? {
                          x: swappingTiles.source.row === rowIndex && swappingTiles.source.col === colIndex
                            ? (swappingTiles.target.col - swappingTiles.source.col) * tileSize
                            : (swappingTiles.source.col - swappingTiles.target.col) * tileSize,
                          y: swappingTiles.source.row === rowIndex && swappingTiles.source.col === colIndex
                            ? (swappingTiles.target.row - swappingTiles.source.row) * tileSize
                            : (swappingTiles.source.row - swappingTiles.target.row) * tileSize,
                        }
                      : draggedTile?.row === rowIndex && draggedTile?.col === colIndex
                        ? {
                            x: dragOffset.x - tileSize / 2,
                            y: dragOffset.y - tileSize / 2,
                            scale: 1.1,
                            zIndex: 10,
                          }
                        : {}
                  }
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.3,
                  }}
                >
                  <motion.div
                    animate={
                      swappingTiles && (
                        (swappingTiles.source.row === rowIndex && swappingTiles.source.col === colIndex) ||
                        (swappingTiles.target.row === rowIndex && swappingTiles.target.col === colIndex)
                      )
                        ? {
                            scale: [1, 1.1, 1],
                            opacity: swappingTiles.isValid ? [1, 1, 0] : 1,
                          }
                        : {}
                    }
                    transition={{
                      type: "tween",
                      duration: 0.3,
                      times: [0, 0.5, 1],
                    }}
                  >
                    <Tile
                      tile={tile}
                      size={tileSize}
                      row={rowIndex}
                      col={colIndex}
                      isSelected={selectedTile?.row === rowIndex && selectedTile?.col === colIndex}
                      isHighlighted={focusedTile?.row === rowIndex && focusedTile?.col === colIndex}
                      onClick={() => {
                        setFocusedTile({ row: rowIndex, col: colIndex })
                        handleTileClick(rowIndex, colIndex)
                      }}
                      onMouseDown={(e) => handleDragStart(e, rowIndex, colIndex)}
                      onTouchStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                    />
                  </motion.div>
                </motion.div>
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
