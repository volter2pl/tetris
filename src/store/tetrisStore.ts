"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  computeLevel,
  computeScore,
  computeSpeed,
  createEmptyBoard,
  ghostDropY,
  mergePiece,
  pickBag,
  rotatePiece,
  spawnPiece,
  sweepLines,
  translatePiece,
  canPlace,
} from "@/lib/tetris/engine";
import { BOARD_COLS, TETROMINO_KEYS } from "@/lib/tetris/constants";
import { ActivePiece, GamePhase, GameStats, LineClearEffect, TetrominoKey } from "@/lib/tetris/types";

type BoardMatrix = ReturnType<typeof createEmptyBoard>;

interface InputState {
  softDrop: boolean;
}

interface TetrisStore {
  phase: GamePhase;
  board: BoardMatrix;
  active: ActivePiece | null;
  ghostY: number;
  queue: TetrominoKey[];
  hold: TetrominoKey | null;
  canHold: boolean;
  stats: GameStats;
  dropAccumulator: number;
  inputs: InputState;
  recentEffect: LineClearEffect | null;
  countdownUntil: number | null;
  startGame: (opts?: { skipCountdown?: boolean }) => void;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tick: (delta: number) => void;
  move: (dir: -1 | 1) => void;
  softDrop: (active: boolean) => void;
  rotate: (dir: 1 | -1) => void;
  hardDrop: () => void;
  holdPiece: () => void;
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const baseStats = (): GameStats => ({
  score: 0,
  level: 1,
  lines: 0,
  speedMs: 900,
  combo: 0,
});

const prepareQueue = () => [...pickBag(), ...pickBag()];
const DEFAULT_QUEUE: TetrominoKey[] = [...TETROMINO_KEYS, ...TETROMINO_KEYS];

const refreshGhost = (piece: ActivePiece | null, board: BoardMatrix) =>
  piece ? ghostDropY(piece, board) : 0;

const withSpawnedPiece = (state: TetrisStore, nextBoard?: BoardMatrix) => {
  if (!state.queue.length) {
    state.queue.push(...pickBag());
  }
  const nextType = state.queue.shift() as TetrominoKey;
  const candidate = spawnPiece(nextType);
  const board = nextBoard ?? state.board;
  if (!canPlace(candidate.matrix, candidate.position, board)) {
    state.phase = "over";
    state.active = null;
    return;
  }
  state.active = candidate;
  state.ghostY = refreshGhost(candidate, board);
  state.canHold = true;
};

export const useTetrisStore = create<TetrisStore>()(
  immer((set) => ({
    phase: "intro",
    board: createEmptyBoard(),
    active: null,
    ghostY: 0,
    queue: [...DEFAULT_QUEUE],
    hold: null,
    canHold: true,
    stats: baseStats(),
    dropAccumulator: 0,
    inputs: { softDrop: false },
    recentEffect: null,
    countdownUntil: null,
    startGame: ({ skipCountdown } = {}) =>
      set((state) => {
        state.board = createEmptyBoard();
        state.queue = prepareQueue();
        state.hold = null;
        state.canHold = true;
        state.stats = baseStats();
        state.dropAccumulator = 0;
        state.recentEffect = null;
        state.countdownUntil = skipCountdown ? null : now() + 2400;
        state.phase = skipCountdown ? "playing" : "countdown";
        withSpawnedPiece(state);
      }),
    resetGame: () =>
      set((state) => {
        state.phase = "intro";
        state.board = createEmptyBoard();
        state.queue = prepareQueue();
        state.active = null;
        state.ghostY = 0;
        state.stats = baseStats();
        state.hold = null;
        state.canHold = true;
        state.dropAccumulator = 0;
        state.countdownUntil = null;
      }),
    pauseGame: () =>
      set((state) => {
        if (state.phase === "playing") {
          state.phase = "paused";
        }
      }),
    resumeGame: () =>
      set((state) => {
        if (state.phase === "paused") {
          state.phase = "playing";
        }
      }),
    move: (dir) =>
      set((state) => {
        if (state.phase !== "playing" || !state.active) return;
        const next = translatePiece(state.active, { x: dir, y: 0 });
        if (canPlace(next.matrix, next.position, state.board)) {
          state.active = next;
          state.ghostY = refreshGhost(next, state.board);
        }
      }),
    rotate: (dir) =>
      set((state) => {
        if (state.phase !== "playing" || !state.active) return;
        const rotated = rotatePiece(state.active, dir);
        const kicks = [0, -1, 1, -2, 2];
        for (const offset of kicks) {
          const candidate = { ...rotated, position: { ...rotated.position, x: rotated.position.x + offset } };
          if (canPlace(candidate.matrix, candidate.position, state.board)) {
            state.active = candidate;
            state.ghostY = refreshGhost(candidate, state.board);
            break;
          }
        }
      }),
    softDrop: (active) =>
      set((state) => {
        state.inputs.softDrop = active;
      }),
    holdPiece: () =>
      set((state) => {
        if (state.phase !== "playing" || !state.active || !state.canHold) return;
        const currentType = state.active.type;
        if (state.hold) {
          state.active = spawnPiece(state.hold);
          state.active.position.y = 0;
          state.active.position.x = Math.floor((BOARD_COLS - state.active.matrix[0].length) / 2);
        } else {
          state.active = null;
          withSpawnedPiece(state);
        }
        state.hold = currentType;
        state.canHold = false;
        if (state.active) {
          state.ghostY = refreshGhost(state.active, state.board);
        }
      }),
    hardDrop: () =>
      set((state) => {
        if (state.phase !== "playing" || !state.active) return;
        state.active.position.y = state.ghostY;
        lockPiece(state);
      }),
    tick: (delta) =>
      set((state) => {
        const timeline = now();
        if (state.phase === "countdown" && state.countdownUntil && timeline >= state.countdownUntil) {
          state.phase = "playing";
          state.dropAccumulator = 0;
          state.countdownUntil = null;
        }
        if (state.phase !== "playing" || !state.active) {
          state.dropAccumulator = 0;
          return;
        }
        state.dropAccumulator += delta;
        const interval = state.inputs.softDrop ? Math.max(60, state.stats.speedMs * 0.2) : state.stats.speedMs;
        if (state.dropAccumulator < interval) return;
        state.dropAccumulator = 0;
        const next = translatePiece(state.active, { x: 0, y: 1 });
        if (canPlace(next.matrix, next.position, state.board)) {
          state.active = next;
          state.ghostY = refreshGhost(next, state.board);
          return;
        }
        lockPiece(state);
      }),
  })),
);

const lockPiece = (state: TetrisStore) => {
  if (!state.active) return;
  const merged = mergePiece(state.board, state.active, now());
  const { board, cleared } = sweepLines(merged);
  state.board = board;
  state.active = null;
  if (cleared.length) {
    state.recentEffect = { id: `${cleared.join("-")}-${now()}`, rows: cleared, timestamp: now() };
    state.stats.lines += cleared.length;
    state.stats.combo += 1;
    const level = computeLevel(state.stats.lines);
    state.stats.level = level;
    state.stats.speedMs = computeSpeed(level);
    state.stats.score += computeScore(cleared.length, level) + state.stats.combo * 25 * cleared.length;
  } else {
    state.stats.combo = 0;
    state.recentEffect = null;
  }
  state.canHold = true;
  withSpawnedPiece(state, board);
};
