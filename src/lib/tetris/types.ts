export type TetrominoKey = "I" | "J" | "L" | "O" | "S" | "T" | "Z";

export interface TetrominoShape {
  rotations: number[][][];
  color: string;
  glow: string;
}

export interface ActivePiece {
  type: TetrominoKey;
  rotationIndex: number;
  matrix: number[][];
  position: {
    x: number;
    y: number;
  };
}

export interface BoardCell {
  type: TetrominoKey;
  id: string;
  glow: number;
  lockedAt: number;
}

export type GamePhase = "intro" | "countdown" | "playing" | "paused" | "over";

export interface GameStats {
  score: number;
  level: number;
  lines: number;
  speedMs: number;
  combo: number;
}

export interface LineClearEffect {
  id: string;
  rows: number[];
  timestamp: number;
}

export interface PulseSample {
  time: number;
  energy: number;
}
