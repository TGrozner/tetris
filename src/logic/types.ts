export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Cell = PieceKind | null;

export type Rotation = 0 | 1 | 2 | 3;

export interface ActivePiece {
  kind: PieceKind;
  rotation: Rotation;
  x: number;
  y: number;
}

export type Board = Cell[][];

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const SPAWN_BUFFER = 2;
export const TOTAL_HEIGHT = BOARD_HEIGHT + SPAWN_BUFFER;

export const PIECE_COLORS: Record<PieceKind, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

export type LockResult = {
  board: Board;
  linesCleared: number;
  clearedRows: number[];
};
