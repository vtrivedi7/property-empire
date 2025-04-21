import { NextResponse } from 'next/server';
import { getGameState, updateGameState } from '@/lib/gameStore';
import { GameUpdate } from '@/types/game';

// GET /api/game
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  let gameState = getGameState(userId);
  
  // If no game state exists, create a new one
  if (!gameState) {
    gameState = updateGameState(userId, {
      score: 0,
      level: 1,
      properties: 0,
      currency: 100, // Starting currency
    });
  }

  return NextResponse.json(gameState);
}

// POST /api/game
export async function POST(request: Request) {
  try {
    const { userId, ...update } = await request.json() as GameUpdate & { userId: string };

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const updatedState = updateGameState(userId, update);
    return NextResponse.json(updatedState);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
} 