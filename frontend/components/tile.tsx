"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Building,
  Building2,
  Store,
  Castle,
  Warehouse,
  Lock,
  Bomb,
  Sparkles,
  ArrowDown,
  Plus,
  Construction,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TileType } from "@/lib/types"

interface TileProps {
  tile: TileType
  size: number
  row: number
  col: number
  isSelected: boolean
  isHighlighted?: boolean
  onClick: () => void
}

export default function Tile({ tile, size, row, col, isSelected, isHighlighted = false, onClick }: TileProps) {
  const getTileIcon = () => {
    // Special tiles
    if (tile.special) {
      switch (tile.special) {
        case "renovation-bomb":
          return <Bomb className="h-6 w-6 text-amber-600" />
        case "market-mixer":
          return <Sparkles className="h-6 w-6 text-emerald-600" />
        case "skyscraper-leveller":
          return <ArrowDown className="h-6 w-6 text-blue-600" />
        case "urban-redevelopment":
          return <Plus className="h-6 w-6 text-purple-600" />
      }
    }

    // Obstacle tiles
    if (tile.type === "locked-gate") {
      return <Lock className="h-6 w-6 text-gray-600" />
    }

    if (tile.type === "foundation-block") {
      return <Construction className="h-6 w-6 text-gray-700" />
    }

    if (tile.type === "locked-card") {
      return <Clock className="h-6 w-6 text-orange-600" />
    }

    // Basic property tiles
    switch (tile.type) {
      case "house":
        return <Home className="h-6 w-6 text-green-600" />
      case "apartment":
        return <Building className="h-6 w-6 text-blue-600" />
      case "condo":
        return <Building2 className="h-6 w-6 text-purple-600" />
      case "townhouse":
        return <Home className="h-6 w-6 text-orange-600" />
      case "villa":
        return <Castle className="h-6 w-6 text-pink-600" />
      case "commercial":
        return <Store className="h-6 w-6 text-cyan-600" />
      default:
        return <Warehouse className="h-6 w-6 text-gray-600" />
    }
  }

  const getTileColor = () => {
    // Special tiles
    if (tile.special) {
      switch (tile.special) {
        case "renovation-bomb":
          return "bg-gradient-to-br from-amber-100 to-amber-300 border-amber-500"
        case "market-mixer":
          return "bg-gradient-to-br from-emerald-100 to-emerald-300 border-emerald-500"
        case "skyscraper-leveller":
          return "bg-gradient-to-br from-blue-100 to-blue-300 border-blue-500"
        case "urban-redevelopment":
          return "bg-gradient-to-br from-purple-100 to-purple-300 border-purple-500"
      }
    }

    // Obstacle tiles
    if (tile.type === "locked-gate") {
      return "bg-gradient-to-br from-gray-200 to-gray-400 border-gray-500"
    }

    if (tile.type === "foundation-block") {
      return "bg-gradient-to-br from-stone-300 to-stone-500 border-stone-600"
    }

    if (tile.type === "locked-card") {
      return "bg-gradient-to-br from-orange-200 to-orange-400 border-orange-500"
    }

    // Basic property tiles
    switch (tile.type) {
      case "house":
        return "bg-green-100 border-green-300"
      case "apartment":
        return "bg-blue-100 border-blue-300"
      case "condo":
        return "bg-purple-100 border-purple-300"
      case "townhouse":
        return "bg-orange-100 border-orange-300"
      case "villa":
        return "bg-pink-100 border-pink-300"
      case "commercial":
        return "bg-cyan-100 border-cyan-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tile.id}
        className={cn(
          "flex items-center justify-center border rounded-md cursor-pointer transition-colors",
          getTileColor(),
          isSelected ? "ring-2 ring-offset-2 ring-blue-500" : "",
          isHighlighted ? "ring-2 ring-offset-1 ring-yellow-400 animate-pulse" : "",
          tile.isClearing ? "opacity-50" : "",
        )}
        style={{
          width: size,
          height: size,
          position: "relative",
        }}
        onClick={onClick}
        initial={tile.isNew ? { opacity: 0, scale: 0.8 } : false}
        animate={{
          opacity: tile.isMatched ? 0 : 1,
          scale: tile.isMatched ? 0 : 1,
        }}
        exit={tile.isMatched ? { opacity: 0, scale: 0 } : {}}
        transition={{
          duration: tile.isMatched ? 0.25 : tile.isNew ? 0.2 : 0.2,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
      >
        {getTileIcon()}

        {/* Hit counter for foundation blocks */}
        {tile.type === "foundation-block" && tile.hitPoints !== undefined && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
            {tile.hitPoints}
          </div>
        )}

        {/* Moves counter for locked cards */}
        {tile.type === "locked-card" && tile.movesToUnlock !== undefined && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center text-xs font-bold text-orange-700">
            {tile.movesToUnlock}
          </div>
        )}

        {/* Special tile indicator */}
        {tile.special && (
          <motion.div
            className="absolute top-0 right-0 w-3 h-3 rounded-full"
            style={{
              background:
                tile.special === "renovation-bomb"
                  ? "radial-gradient(circle, #f59e0b, #d97706)"
                  : tile.special === "market-mixer"
                    ? "radial-gradient(circle, #10b981, #059669)"
                    : tile.special === "skyscraper-leveller"
                      ? "radial-gradient(circle, #3b82f6, #2563eb)"
                      : "radial-gradient(circle, #8b5cf6, #7c3aed)",
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.5,
            }}
          />
        )}

        {/* Special tile activation animation */}
        {tile.isClearing && tile.special === "renovation-bomb" && (
          <motion.div
            className="absolute inset-0 bg-amber-400 rounded-md"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {tile.isClearing && tile.special === "market-mixer" && (
          <motion.div
            className="absolute inset-0 bg-emerald-400 rounded-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {tile.isClearing && tile.special === "skyscraper-leveller" && (
          <motion.div
            className="absolute inset-0 bg-blue-400 rounded-md"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {tile.isClearing && tile.special === "urban-redevelopment" && (
          <motion.div
            className="absolute inset-0 bg-purple-400 rounded-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
