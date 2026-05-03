import type { PieceKind, Rotation } from './types';

export type PieceShape = ReadonlyArray<readonly [number, number]>;

const I_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  1: [
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
  ],
  2: [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
  ],
  3: [
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
  ],
};

const O_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  1: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  2: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
  3: [
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
  ],
};

const T_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  1: [
    [1, 0],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  2: [
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  3: [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
};

const S_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  1: [
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
  2: [
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2],
  ],
  3: [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
};

const Z_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  1: [
    [2, 0],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  2: [
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  3: [
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 2],
  ],
};

const J_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  1: [
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2],
  ],
  2: [
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
  3: [
    [1, 0],
    [1, 1],
    [0, 2],
    [1, 2],
  ],
};

const L_SHAPES: Record<Rotation, PieceShape> = {
  0: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  1: [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 2],
  ],
  2: [
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
  ],
  3: [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
};

const SHAPES: Record<PieceKind, Record<Rotation, PieceShape>> = {
  I: I_SHAPES,
  O: O_SHAPES,
  T: T_SHAPES,
  S: S_SHAPES,
  Z: Z_SHAPES,
  J: J_SHAPES,
  L: L_SHAPES,
};

export function getPieceShape(kind: PieceKind, rotation: Rotation): PieceShape {
  return SHAPES[kind][rotation];
}

export function getPieceCells(
  kind: PieceKind,
  rotation: Rotation,
  x: number,
  y: number
): Array<[number, number]> {
  return getPieceShape(kind, rotation).map(([dx, dy]) => [x + dx, y + dy] as [number, number]);
}

export const ALL_PIECES: ReadonlyArray<PieceKind> = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function getSpawnPosition(kind: PieceKind): { x: number; y: number } {
  if (kind === 'I') return { x: 3, y: 0 };
  if (kind === 'O') return { x: 3, y: 0 };
  return { x: 3, y: 0 };
}
