import { TetrominoKey, TetrominoShape } from "./types";

export const BOARD_COLS = 10;
export const BOARD_ROWS = 22;
export const VISIBLE_ROWS = 20;
export const SPAWN_ROW = 1;
export const TETROMINO_KEYS: TetrominoKey[] = ["I", "J", "L", "O", "S", "T", "Z"];

const glow = (hex: string) => hex;

const r = 1;

export const TETROMINOES: Record<TetrominoKey, TetrominoShape> = {
  I: {
    color: "#34d8ff",
    glow: glow("#78f3ff"),
    rotations: [
      [
        [0, 0, 0, 0],
        [r, r, r, r],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, r, 0, 0],
        [0, r, 0, 0],
        [0, r, 0, 0],
        [0, r, 0, 0],
      ],
    ],
  },
  J: {
    color: "#4da3ff",
    glow: glow("#86b9ff"),
    rotations: [
      [
        [r, 0, 0],
        [r, r, r],
        [0, 0, 0],
      ],
      [
        [0, r, r],
        [0, r, 0],
        [0, r, 0],
      ],
      [
        [0, 0, 0],
        [r, r, r],
        [0, 0, r],
      ],
      [
        [0, r, 0],
        [0, r, 0],
        [r, r, 0],
      ],
    ],
  },
  L: {
    color: "#ffa44d",
    glow: glow("#ffc886"),
    rotations: [
      [
        [0, 0, r],
        [r, r, r],
        [0, 0, 0],
      ],
      [
        [0, r, 0],
        [0, r, 0],
        [0, r, r],
      ],
      [
        [0, 0, 0],
        [r, r, r],
        [r, 0, 0],
      ],
      [
        [r, r, 0],
        [0, r, 0],
        [0, r, 0],
      ],
    ],
  },
  O: {
    color: "#ffd94d",
    glow: glow("#fff299"),
    rotations: [
      [
        [r, r],
        [r, r],
      ],
    ],
  },
  S: {
    color: "#6cffb3",
    glow: glow("#9dffd1"),
    rotations: [
      [
        [0, r, r],
        [r, r, 0],
        [0, 0, 0],
      ],
      [
        [0, r, 0],
        [0, r, r],
        [0, 0, r],
      ],
    ],
  },
  T: {
    color: "#c184ff",
    glow: glow("#ddb5ff"),
    rotations: [
      [
        [0, r, 0],
        [r, r, r],
        [0, 0, 0],
      ],
      [
        [0, r, 0],
        [0, r, r],
        [0, r, 0],
      ],
      [
        [0, 0, 0],
        [r, r, r],
        [0, r, 0],
      ],
      [
        [0, r, 0],
        [r, r, 0],
        [0, r, 0],
      ],
    ],
  },
  Z: {
    color: "#ff6c99",
    glow: glow("#ff9cbb"),
    rotations: [
      [
        [r, r, 0],
        [0, r, r],
        [0, 0, 0],
      ],
      [
        [0, 0, r],
        [0, r, r],
        [0, r, 0],
      ],
    ],
  },
};

export const SCORE_TABLE = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export const DROP_SPEED_MS = {
  min: 90,
  max: 1200,
};

export const AUDIO_PULSE_WINDOW = 2400;
