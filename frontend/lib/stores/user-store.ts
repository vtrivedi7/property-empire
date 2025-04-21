import { create } from 'zustand'
import { GameState, GameUpdate } from '@/types/game'
import { useGameStore } from './game-store'
import { useLevelStore } from './level-store'
import { LevelConfig } from '@/lib/types'
import { usePlayerStore } from './player-store'

interface UserStore {
  userId: string | null
  gameState: GameState | null
  isLoading: boolean
  error: string | null
  setUserId: (userId: string) => void
  fetchGameState: () => Promise<void>
  updateGameState: (update: Partial<GameUpdate>) => Promise<void>
  resetUser: () => void
}

const defaultLevelConfig: LevelConfig = {
  id: 1,
  regionId: 1,
  name: "Level 1",
  targetScore: 100,
  moveLimit: 30,
  unlocked: true,
}

export const useUserStore = create<UserStore>((set, get) => ({
  userId: null,
  gameState: null,
  isLoading: false,
  error: null,

  setUserId: (userId: string) => {
    // Reset all stores before setting new user
    usePlayerStore.getState().initializePlayer()
    useGameStore.getState().resetGame()
    
    set({ userId, isLoading: true, error: null })
    get().fetchGameState()
  },

  fetchGameState: async () => {
    const { userId } = get()
    if (!userId) return

    try {
      const response = await fetch(`/api/game?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        set({ gameState: data, error: null })
        
        // Reset stores before loading new data
        usePlayerStore.getState().initializePlayer()
        useGameStore.getState().resetGame()
        
        // Update game store with loaded state
        if (data.board) {
          useGameStore.setState({
            grid: data.board.grid || [],
            selectedTile: data.board.selectedTile || null,
            isAnimating: data.board.isAnimating || false,
            gravityDirection: data.board.gravityDirection || "down",
            score: data.score || 0,
          })
        }
        
        // Update level store with proper level config
        useLevelStore.setState({
          currentLevel: {
            ...defaultLevelConfig,
            id: data.level || 1,
            targetScore: data.level === 1 ? 100 : defaultLevelConfig.targetScore,
          },
        })
        
        // Update player store with user's resources
        if (data.resources) {
          usePlayerStore.setState({
            resources: data.resources,
            playerLevel: data.playerLevel || 1,
            playerXP: data.playerXP || 0,
            xpToNextLevel: data.xpToNextLevel || 100,
            upgradesOwned: data.upgradesOwned || [],
          })
        }
      } else {
        set({ error: data.error })
      }
    } catch (error) {
      set({ error: 'Failed to fetch game state' })
    } finally {
      set({ isLoading: false })
    }
  },

  updateGameState: async (update: Partial<GameUpdate>) => {
    const { userId, gameState } = get()
    if (!userId || !gameState) return

    // Get current game state and resources
    const currentGameState = useGameStore.getState()
    const currentResources = usePlayerStore.getState().resources

    const newState = {
      ...gameState,
      ...update,
      board: {
        grid: update.board?.grid || currentGameState.grid || [],
        selectedTile: update.board?.selectedTile || currentGameState.selectedTile || null,
        isAnimating: update.board?.isAnimating ?? currentGameState.isAnimating ?? false,
        gravityDirection: update.board?.gravityDirection || currentGameState.gravityDirection || "down",
      },
      resources: currentResources, // Always use the current resources from player store
    }

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newState),
      })
      const data = await response.json()
      if (response.ok) {
        set({ gameState: data, error: null })
      } else {
        set({ error: data.error })
      }
    } catch (error) {
      set({ error: 'Failed to update game state' })
    }
  },

  resetUser: () => {
    set({ userId: null, gameState: null, error: null })
    // Reset all stores
    usePlayerStore.getState().initializePlayer()
    useGameStore.getState().resetGame()
  },
})) 