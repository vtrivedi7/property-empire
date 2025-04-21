import { TreePine, BrickWall, Construction, Banknote, Glasses, Landmark } from "lucide-react"

type ResourceType = "lumber" | "brick" | "steel" | "cash" | "glass" | "concrete"

interface ResourceCounterProps {
  type: string
  amount: number
}

export default function ResourceCounter({ type, amount }: ResourceCounterProps) {
  // Skip rendering if amount is 0
  if (amount === 0) return null

  const getIcon = () => {
    switch (type) {
      case "lumber":
        return <TreePine className="h-4 w-4 text-green-600" />
      case "brick":
        return <BrickWall className="h-4 w-4 text-orange-600" />
      case "steel":
        return <Construction className="h-4 w-4 text-slate-600" />
      case "cash":
        return <Banknote className="h-4 w-4 text-emerald-600" />
      case "glass":
        return <Glasses className="h-4 w-4 text-pink-600" />
      case "concrete":
        return <Landmark className="h-4 w-4 text-cyan-600" />
      default:
        return null
    }
  }

  return (
    <div className="flex items-center space-x-1 bg-white rounded-full px-2 py-1 shadow-sm">
      {getIcon()}
      <span className="text-xs font-medium">{amount}</span>
    </div>
  )
}
