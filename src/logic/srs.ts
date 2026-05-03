import type { ActivePiece, Rotation } from './types';
import type { Board } from './types';
import { canPlace } from './board';

export type Offset = readonly [number, number];

const JLSTZ_KICKS: Record<string, ReadonlyArray<Offset>> = {
  '0->1': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '1->0': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '1->2': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '2->1': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '2->3': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  '3->2': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '3->0': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '0->3': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

const I_KICKS: Record<string, ReadonlyArray<Offset>> = {
  '0->1': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '1->0': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '1->2': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  '2->1': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '2->3': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '3->2': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '3->0': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '0->3': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

export function rotateCW(rotation: Rotation): Rotation {
  return ((rotation + 1) % 4) as Rotation;
}

export function rotateCCW(rotation: Rotation): Rotation {
  return ((rotation + 3) % 4) as Rotation;
}

function getKickTable(kind: ActivePiece['kind'], from: Rotation, to: Rotation): ReadonlyArray<Offset> {
  if (kind === 'O') return [[0, 0]];
  const key = `${from}->${to}`;
  if (kind === 'I') return I_KICKS[key] ?? [[0, 0]];
  return JLSTZ_KICKS[key] ?? [[0, 0]];
}

export interface RotationResult {
  piece: ActivePiece;
  kickIndex: number;
}

export function tryRotate(
  board: Board,
  piece: ActivePiece,
  direction: 'cw' | 'ccw'
): RotationResult | null {
  const newRotation = direction === 'cw' ? rotateCW(piece.rotation) : rotateCCW(piece.rotation);
  const kicks = getKickTable(piece.kind, piece.rotation, newRotation);
  for (let i = 0; i < kicks.length; i++) {
    const [dx, dy] = kicks[i];
    // SRS y-axis points up; our y points down. Negate dy.
    const candidate: ActivePiece = {
      ...piece,
      rotation: newRotation,
      x: piece.x + dx,
      y: piece.y - dy,
    };
    if (canPlace(board, candidate)) {
      return { piece: candidate, kickIndex: i };
    }
  }
  return null;
}
