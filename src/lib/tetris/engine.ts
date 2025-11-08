import { BOARD_COLS, BOARD_ROWS, SCORE_TABLE, TETROMINOES, TETROMINO_KEYS } from "./constants";
import { ActivePiece, BoardCell, TetrominoKey } from "./types";

export const createEmptyBoard = (): (BoardCell | null)[][] =>
  Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLS }, () => null));

export const pickBag = (): TetrominoKey[] => {
  const bag = [...TETROMINO_KEYS];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

export const spawnPiece = (type: TetrominoKey): ActivePiece => {
  const shape = TETROMINOES[type];
  const matrix = shape.rotations[0];
  const startX = Math.floor((BOARD_COLS - matrix[0].length) / 2);
  return {
    type,
    rotationIndex: 0,
    matrix,
    position: { x: startX, y: 0 },
  };
};

export const rotatePiece = (piece: ActivePiece, dir: 1 | -1): ActivePiece => {
  const shape = TETROMINOES[piece.type];
  const total = shape.rotations.length;
  let rotationIndex = piece.rotationIndex + dir;
  if (rotationIndex < 0) rotationIndex = total - 1;
  if (rotationIndex >= total) rotationIndex = 0;
  return {
    ...piece,
    rotationIndex,
    matrix: shape.rotations[rotationIndex],
  };
};

export const canPlace = (
  matrix: number[][],
  position: { x: number; y: number },
  board: (BoardCell | null)[][],
): boolean => {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!matrix[y][x]) continue;
      const boardX = position.x + x;
      const boardY = position.y + y;
      if (boardX < 0 || boardX >= BOARD_COLS || boardY >= BOARD_ROWS) return false;
      if (boardY >= 0 && board[boardY][boardX]) return false;
    }
  }
  return true;
};

export const translatePiece = (
  piece: ActivePiece,
  offset: { x: number; y: number },
): ActivePiece => ({
  ...piece,
  position: {
    x: piece.position.x + offset.x,
    y: piece.position.y + offset.y,
  },
});

export const mergePiece = (
  board: (BoardCell | null)[][],
  piece: ActivePiece,
  timestamp: number,
): (BoardCell | null)[][] => {
  const draft = board.map((row) => [...row]);
  for (let y = 0; y < piece.matrix.length; y += 1) {
    for (let x = 0; x < piece.matrix[y].length; x += 1) {
      if (!piece.matrix[y][x]) continue;
      const boardY = piece.position.y + y;
      if (boardY < 0 || boardY >= BOARD_ROWS) continue;
      const boardX = piece.position.x + x;
      draft[boardY][boardX] = {
        type: piece.type,
        id: `${piece.type}-${boardY}-${boardX}-${timestamp}`,
        glow: 1,
        lockedAt: timestamp,
      };
    }
  }
  return draft;
};

export const sweepLines = (
  board: (BoardCell | null)[][],
): { board: (BoardCell | null)[][]; cleared: number[] } => {
  const next: (BoardCell | null)[][] = [];
  const clearedRows: number[] = [];
  for (let y = 0; y < BOARD_ROWS; y += 1) {
    const isFull = board[y].every(Boolean);
    if (isFull) {
      clearedRows.push(y);
    } else {
      next.push([...board[y]]);
    }
  }
  while (next.length < BOARD_ROWS) {
    next.unshift(Array.from({ length: BOARD_COLS }, () => null));
  }
  return { board: next, cleared: clearedRows };
};

export const ghostDropY = (piece: ActivePiece, board: (BoardCell | null)[][]): number => {
  let test = piece.position.y;
  while (canPlace(piece.matrix, { x: piece.position.x, y: test + 1 }, board)) {
    test += 1;
  }
  return test;
};

export const computeLevel = (lines: number) => Math.floor(lines / 10) + 1;

export const computeSpeed = (level: number) => Math.max(90, 1000 - (level - 1) * 75);

export const computeScore = (rows: number, level: number) => (SCORE_TABLE as Record<number, number>)[rows] * level || 0;
