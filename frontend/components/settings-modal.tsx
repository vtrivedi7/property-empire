"use client"

import { useState } from "react"
import { useGameStore } from "@/lib/stores/game-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Volume2, Music, Zap } from "lucide-react"

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useGameStore()
  const [localSettings, setLocalSettings] = useState({
    soundEnabled: settings.soundEnabled,
    musicEnabled: settings.musicEnabled,
    animationSpeed: settings.animationSpeed,
    vibrationEnabled: settings.vibrationEnabled,
  })

  const handleSave = () => {
    updateSettings(localSettings)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your gameplay experience with these settings.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5 text-gray-500" />
              <span>Sound Effects</span>
            </div>
            <Switch
              checked={localSettings.soundEnabled}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Music className="h-5 w-5 text-gray-500" />
              <span>Music</span>
            </div>
            <Switch
              checked={localSettings.musicEnabled}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, musicEnabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-gray-500" />
              <span>Animation Speed</span>
            </div>
            <Slider
              value={[localSettings.animationSpeed]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={([value]) => setLocalSettings({ ...localSettings, animationSpeed: value })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-gray-500" />
              <span>Vibration</span>
            </div>
            <Switch
              checked={localSettings.vibrationEnabled}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, vibrationEnabled: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
