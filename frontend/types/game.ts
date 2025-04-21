import { TileType } from "@/lib/types"

export interface GameState {
  userId: string;
  score: number;
  level: number;
  properties: number;
  currency: number;
  board: {
    grid: TileType[][];
    selectedTile: { row: number; col: number } | null;
    isAnimating: boolean;
    gravityDirection: "up" | "down" | "left" | "right";
  };
  resources: {
    lumber: number;
    steel: number;
    cash: number;
    brick: number;
    glass: number;
    concrete: number;
  };
}

export interface GameUpdate {
  score?: number;
  level?: number;
  properties?: number;
  currency?: number;
  board?: {
    grid?: TileType[][];
    selectedTile?: { row: number; col: number } | null;
    isAnimating?: boolean;
    gravityDirection?: "up" | "down" | "left" | "right";
  };
  resources?: {
    lumber?: number;
    steel?: number;
    cash?: number;
    brick?: number;
    glass?: number;
    concrete?: number;
  };
} 