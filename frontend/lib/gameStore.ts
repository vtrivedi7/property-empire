import { GameState } from '@/types/game';

// Simple in-memory store
const gameStore = new Map<string, GameState>();

export function getGameState(userId: string): GameState | undefined {
  return gameStore.get(userId);
}

export function updateGameState(userId: string, update: Partial<GameState>): GameState {
  const currentState = gameStore.get(userId) || {
    userId,
    score: 0,
    level: 1,
    properties: 0,
    currency: 0,
  };

  const newState = {
    ...currentState,
    ...update,
  };

  gameStore.set(userId, newState);
  return newState;
} 