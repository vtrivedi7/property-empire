"use client"

import { useState } from "react"
import { usePlayerStore } from "@/lib/stores/player-store"
import { useRegionStore } from "@/lib/stores/region-store"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Lock } from "lucide-react"
import ResourceCounter from "./resource-counter"

interface UpgradeItem {
  id: string
  name: string
  description: string
  effect: string
  regionId: number
  cost: {
    lumber?: number
    brick?: number
    steel?: number
    cash?: number
    glass?: number
    concrete?: number
    marble?: number
    copper?: number
    gold?: number
  }
}

interface WorkshopModalProps {
  onClose: () => void
}

export default function WorkshopModal({ onClose }: WorkshopModalProps) {
  const { resources, upgradesOwned, purchaseUpgrade, playerLevel } = usePlayerStore()
  const { regions } = useRegionStore()
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeItem | null>(null)
  const [activeTab, setActiveTab] = useState("suburban")

  const upgrades: UpgradeItem[] = [
    // Suburban
    {
      id: "extra_moves",
      name: "Extra Moves",
      description: "Start each level with additional moves",
      effect: "+2 moves per level",
      regionId: 1,
      cost: { lumber: 10, brick: 5 },
    },
    {
      id: "score_boost",
      name: "Score Boost",
      description: "Increase points earned from matches",
      effect: "+10% base points",
      regionId: 1,
      cost: { steel: 8, cash: 12 },
    },
    // Urban
    {
      id: "resource_yield",
      name: "Resource Yield+",
      description: "Earn more resources from matches",
      effect: "+1 resource per tile match",
      regionId: 2,
      cost: { lumber: 15, steel: 15, cash: 10 },
    },
    {
      id: "special_threshold",
      name: "Special Threshold",
      description: "Easier to create special tiles",
      effect: "Special tile creation threshold lowered by 1",
      regionId: 2,
      cost: { cash: 20, brick: 15, glass: 5 },
    },
    // Coastal
    {
      id: "obstacle_breaker",
      name: "Obstacle Breaker",
      description: "Makes breaking obstacles easier",
      effect: "Obstacles require 1 less match to clear",
      regionId: 3,
      cost: { steel: 20, concrete: 10 },
    },
    {
      id: "energy_boost",
      name: "Energy Boost",
      description: "Increase maximum energy capacity",
      effect: "+1 max energy",
      regionId: 3,
      cost: { brick: 20, steel: 20, cash: 15, glass: 8 },
    },
    // New upgrades
    {
      id: "special_chance",
      name: "Special Chance",
      description: "Chance to create special tiles from 3-matches",
      effect: "15% chance to create a special tile from a 3-match",
      regionId: 2,
      cost: { lumber: 25, cash: 25, glass: 10 },
    },
    {
      id: "starting_energy",
      name: "Starting Energy Boost",
      description: "Start with more energy when logging in",
      effect: "+2 energy when energy refills",
      regionId: 1,
      cost: { lumber: 15, brick: 15, cash: 10 },
    },
    {
      id: "obstacle_efficiency",
      name: "Obstacle Removal Efficiency",
      description: "More effective at removing obstacles",
      effect: "Locked cards unlock 1 move faster",
      regionId: 3,
      cost: { steel: 25, concrete: 15, marble: 5 },
    },
  ]

  const canAfford = (upgrade: UpgradeItem): boolean => {
    return Object.entries(upgrade.cost).every(
      ([resource, amount]) => resources[resource as keyof typeof resources] >= (amount || 0),
    )
  }

  const handlePurchase = () => {
    if (selectedUpgrade && canAfford(selectedUpgrade)) {
      // Deduct resources and add upgrade to owned list
      purchaseUpgrade(selectedUpgrade.id, selectedUpgrade.cost)

      // Visual confirmation of purchase
      const purchasedElement = document.getElementById(`upgrade-${selectedUpgrade.id}`)
      if (purchasedElement) {
        purchasedElement.classList.add("bg-green-50")
        setTimeout(() => {
          purchasedElement.classList.remove("bg-green-50")
        }, 500)
      }

      setSelectedUpgrade(null)
    }
  }

  const getRegionName = (regionId: number): string => {
    const region = regions.find((r) => r.id === regionId)
    return region ? region.name.toLowerCase() : "unknown"
  }

  const isRegionUnlocked = (regionId: number): boolean => {
    const region = regions.find((r) => r.id === regionId)
    return region ? region.unlocked : false
  }

  // Filter upgrades based on player level
  const getAvailableUpgrades = (regionId: number) => {
    return upgrades.filter((upgrade) => {
      // Basic region filtering
      if (upgrade.regionId !== regionId) return false

      // Level requirements for certain upgrades
      if (upgrade.id === "special_chance" && playerLevel < 3) return false
      if (upgrade.id === "obstacle_efficiency" && playerLevel < 5) return false

      return true
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Workshop</DialogTitle>
          <DialogDescription>
            Spend your resources to purchase upgrades that will help you in future levels.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          {Object.entries(resources).map(([resource, amount]) => (
            <ResourceCounter key={resource} type={resource} amount={amount} />
          ))}
        </div>

        <div className="mb-2 text-sm">
          <span className="font-medium">Player Level: </span>
          <span className="text-blue-600 font-bold">{playerLevel}</span>
        </div>

        <Tabs defaultValue="suburban" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="suburban">Suburban</TabsTrigger>
            <TabsTrigger value="urban" disabled={!isRegionUnlocked(2)}>
              {isRegionUnlocked(2) ? "Urban" : <Lock className="h-3 w-3 mr-1" />}
            </TabsTrigger>
            <TabsTrigger value="coastal" disabled={!isRegionUnlocked(3)}>
              {isRegionUnlocked(3) ? "Coastal" : <Lock className="h-3 w-3 mr-1" />}
            </TabsTrigger>
          </TabsList>

          {regions.map((region) => (
            <TabsContent
              key={region.id}
              value={region.name.toLowerCase()}
              className="space-y-3 max-h-[300px] overflow-y-auto pr-2"
            >
              {getAvailableUpgrades(region.id).map((upgrade) => {
                const isOwned = upgradesOwned.includes(upgrade.id)
                const isAffordable = canAfford(upgrade)
                const isSelected = selectedUpgrade?.id === upgrade.id

                return (
                  <div
                    key={upgrade.id}
                    id={`upgrade-${upgrade.id}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isOwned
                        ? "bg-gray-100 border-gray-300 opacity-60"
                        : isSelected
                          ? "bg-blue-50 border-blue-300"
                          : isAffordable
                            ? "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                            : "bg-gray-50 border-gray-300 opacity-70"
                    }`}
                    onClick={() => !isOwned && setSelectedUpgrade(upgrade)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{upgrade.name}</h3>
                        <p className="text-sm text-gray-600">{upgrade.description}</p>
                        <p className="text-xs text-blue-600 mt-1">{upgrade.effect}</p>
                      </div>
                      {isOwned ? (
                        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Owned</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1 max-w-[150px] justify-end">
                          {Object.entries(upgrade.cost).map(([resource, amount]) => (
                            <div
                              key={resource}
                              className={`flex items-center text-xs px-1.5 py-0.5 rounded ${
                                resources[resource as keyof typeof resources] >= amount
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {resource}: {amount}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {selectedUpgrade && (
            <Button className="flex-1" disabled={!canAfford(selectedUpgrade)} onClick={handlePurchase}>
              <Plus className="mr-2 h-4 w-4" />
              Purchase
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
