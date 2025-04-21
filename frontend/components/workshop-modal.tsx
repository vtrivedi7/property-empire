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
  tier: number
  requiredLevel: number
  maxLevel: number
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
  nextLevelEffect?: string
}

interface WorkshopModalProps {
  onClose: () => void
}

export default function WorkshopModal({ onClose }: WorkshopModalProps) {
  const { resources, upgradesOwned, purchaseUpgrade, playerLevel } = usePlayerStore()
  const { regions } = useRegionStore()
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeItem | null>(null)
  const [activeTab, setActiveTab] = useState("suburban")
  const [showTooltip, setShowTooltip] = useState("")

  const upgrades: UpgradeItem[] = [
    // Suburban - Tier 1 (Basic)
    {
      id: "extra_moves",
      name: "Extra Moves",
      description: "Start each level with additional moves",
      effect: "+2 moves per level",
      nextLevelEffect: "+3 moves per level",
      regionId: 1,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { lumber: 10, brick: 5 },
    },
    {
      id: "score_boost",
      name: "Score Boost",
      description: "Increase points earned from matches",
      effect: "Base score ×1.1",
      nextLevelEffect: "Base score ×1.2",
      regionId: 1,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { steel: 8, cash: 12 },
    },
    // Urban - Tier 2 (Advanced)
    {
      id: "resource_yield",
      name: "Resource Yield+",
      description: "Earn more resources from matches",
      effect: "+1 resource per tile match",
      nextLevelEffect: "+2 resources per tile match",
      regionId: 2,
      tier: 2,
      requiredLevel: 3,
      maxLevel: 3,
      cost: { lumber: 15, steel: 15, cash: 10 },
    },
    {
      id: "special_threshold",
      name: "Special Threshold",
      description: "Easier to create special tiles",
      effect: "Special tile creation threshold lowered by 1",
      nextLevelEffect: "Special tile creation threshold lowered by 2",
      regionId: 2,
      tier: 2,
      requiredLevel: 3,
      maxLevel: 2,
      cost: { cash: 20, brick: 15, glass: 5 },
    },
    // Coastal
    {
      id: "obstacle_breaker",
      name: "Obstacle Breaker",
      description: "Makes breaking obstacles easier",
      effect: "Obstacles require 1 less match to clear",
      regionId: 3,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { steel: 20, concrete: 10 },
    },
    {
      id: "energy_boost",
      name: "Energy Boost",
      description: "Increase maximum energy capacity",
      effect: "+1 max energy",
      regionId: 3,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { brick: 20, steel: 20, cash: 15, glass: 8 },
    },
    // Mountain
    {
      id: "special_chance",
      name: "Special Chance",
      description: "Chance to create special tiles from 3-matches",
      effect: "15% chance to create a special tile from a 3-match",
      regionId: 4,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { lumber: 25, cash: 25, glass: 10 },
    },
    {
      id: "starting_energy",
      name: "Starting Energy Boost",
      description: "Start with more energy when logging in",
      effect: "+2 energy when energy refills",
      regionId: 4,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { lumber: 15, brick: 15, cash: 10 },
    },
    // Metro
    {
      id: "obstacle_efficiency",
      name: "Obstacle Removal Efficiency",
      description: "More effective at removing obstacles",
      effect: "Locked cards unlock 1 move faster",
      regionId: 5,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { steel: 25, concrete: 15 },
    },
    {
      id: "ultimate_boost",
      name: "Ultimate Boost",
      description: "Maximum power for your property empire",
      effect: "All upgrades are 50% more effective",
      regionId: 5,
      tier: 1,
      requiredLevel: 1,
      maxLevel: 3,
      cost: { lumber: 30, brick: 30, steel: 30, cash: 30, glass: 20, concrete: 20 },
    },
  ]

  const getUpgradeLevel = (upgradeId: string): number => {
    return upgradesOwned.filter(id => id === upgradeId).length
  }

  const getNextLevelCost = (upgrade: UpgradeItem): Record<string, number> => {
    const level = getUpgradeLevel(upgrade.id)
    const multiplier = 1 + level * 0.5 // 50% increase per level
    return Object.fromEntries(
      Object.entries(upgrade.cost).map(([resource, amount]) => [
        resource,
        Math.round((amount || 0) * multiplier)
      ])
    )
  }

  const canAfford = (upgrade: UpgradeItem): boolean => {
    const cost = getNextLevelCost(upgrade)
    return Object.entries(cost).every(
      ([resource, amount]) => resources[resource as keyof typeof resources] >= (amount || 0),
    )
  }

  const isUpgradeAvailable = (upgrade: UpgradeItem): boolean => {
    const currentLevel = getUpgradeLevel(upgrade.id)
    return (
      playerLevel >= upgrade.requiredLevel &&
      currentLevel < upgrade.maxLevel &&
      isRegionUnlocked(upgrade.regionId)
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

  // Filter upgrades based on player level and region
  const getAvailableUpgrades = (regionId: number) => {
    return upgrades.filter((upgrade) => {
      // Basic region filtering
      if (upgrade.regionId !== regionId) return false

      // Level requirements for certain upgrades
      if (upgrade.id === "special_chance" && playerLevel < 3) return false
      if (upgrade.id === "obstacle_efficiency" && playerLevel < 5) return false
      if (upgrade.id === "ultimate_boost" && playerLevel < 8) return false

      return true
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Workshop
            <span className="text-sm font-normal text-gray-500">
              Level {playerLevel}
            </span>
          </DialogTitle>
          <DialogDescription>
            Upgrade your empire's capabilities. Higher tiers unlock at higher levels.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Resources</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(resources).map(([resource, amount]) => (
                <ResourceCounter key={resource} type={resource} amount={amount} />
              ))}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Player Level:</span>
                <span className="font-medium text-blue-600">{playerLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Upgrades Owned:</span>
                <span className="font-medium text-blue-600">{upgradesOwned.length}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="suburban" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            {regions.map((region) => (
              <TabsTrigger
                key={region.id}
                value={region.name.toLowerCase()}
                disabled={!region.unlocked}
                className="relative"
                onMouseEnter={() => !region.unlocked && setShowTooltip(region.name)}
                onMouseLeave={() => setShowTooltip("")}
              >
                {region.unlocked ? (
                  region.name
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    {showTooltip === region.name && (
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        Complete previous region
                      </div>
                    )}
                  </>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {regions.map((region) => (
            <TabsContent
              key={region.id}
              value={region.name.toLowerCase()}
              className="space-y-4 max-h-[400px] overflow-y-auto pr-2"
            >
              {/* Group upgrades by tier */}
              {[1, 2, 3].map((tier) => {
                const tierUpgrades = getAvailableUpgrades(region.id).filter(u => u.tier === tier)
                if (tierUpgrades.length === 0) return null

                return (
                  <div key={tier} className="space-y-3">
                    <h3 className="font-medium text-sm text-gray-500">
                      Tier {tier} Upgrades
                      {tier > 1 && !isRegionUnlocked(tier) && " (Locked)"}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {tierUpgrades.map((upgrade) => {
                        const currentLevel = getUpgradeLevel(upgrade.id)
                        const isMaxLevel = currentLevel >= upgrade.maxLevel
                        const isAvailable = isUpgradeAvailable(upgrade)
                        const isAffordable = canAfford(upgrade)
                        const isSelected = selectedUpgrade?.id === upgrade.id
                        const nextLevelCost = getNextLevelCost(upgrade)

                        return (
                          <div
                            key={upgrade.id}
                            id={`upgrade-${upgrade.id}`}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              isMaxLevel
                                ? "bg-green-50 border-green-200"
                                : !isAvailable
                                  ? "bg-gray-100 border-gray-200 opacity-60"
                                  : isSelected
                                    ? "bg-blue-50 border-blue-300 shadow-md"
                                    : isAffordable
                                      ? "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
                                      : "bg-gray-50 border-gray-300 opacity-70"
                            }`}
                            onClick={() => isAvailable && !isMaxLevel && setSelectedUpgrade(upgrade)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{upgrade.name}</h3>
                                  {currentLevel > 0 && (
                                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      Level {currentLevel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{upgrade.description}</p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-blue-600">
                                    Current: {upgrade.effect}
                                  </p>
                                  {!isMaxLevel && (
                                    <p className="text-xs text-green-600">
                                      Next: {upgrade.nextLevelEffect}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                {isMaxLevel ? (
                                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Max Level
                                  </span>
                                ) : !isAvailable ? (
                                  <div className="text-xs text-gray-500">
                                    Requires Level {upgrade.requiredLevel}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end gap-1">
                                    {Object.entries(nextLevelCost).map(([resource, amount]) => (
                                      <div
                                        key={resource}
                                        className={`flex items-center text-xs px-2 py-1 rounded ${
                                          resources[resource as keyof typeof resources] >= amount
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        <span className="mr-1">{amount}</span>
                                        <span className="capitalize">{resource}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUpgrade(null)
              onClose()
            }}
          >
            Close
          </Button>
          {selectedUpgrade && isUpgradeAvailable(selectedUpgrade) && (
            <Button 
              onClick={handlePurchase}
              disabled={!canAfford(selectedUpgrade)}
              className="min-w-[100px]"
            >
              {canAfford(selectedUpgrade) ? "Upgrade" : "Cannot Afford"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
