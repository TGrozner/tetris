import { describe, it, expect } from 'vitest';
import {
  ALL_PIECES,
  getPieceCells,
  getPieceShape,
  getSpawnPosition,
} from './pieces';
import type { PieceKind, Rotation } from './types';

describe('pieces', () => {
  it('all 7 pieces have 4 cells in every rotation', () => {
    for (const kind of ALL_PIECES) {
      for (let r = 0; r < 4; r++) {
        expect(getPieceShape(kind, r as Rotation)).toHaveLength(4);
      }
    }
  });

  it('O piece is identical in all rotations', () => {
    const r0 = JSON.stringify(getPieceShape('O', 0));
    const r1 = JSON.stringify(getPieceShape('O', 1));
    const r2 = JSON.stringify(getPieceShape('O', 2));
    const r3 = JSON.stringify(getPieceShape('O', 3));
    expect(r0).toBe(r1);
    expect(r0).toBe(r2);
    expect(r0).toBe(r3);
  });

  it('getPieceCells offsets correctly', () => {
    const cells = getPieceCells('O', 0, 5, 7);
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    expect(set.has('6,7')).toBe(true);
    expect(set.has('7,7')).toBe(true);
    expect(set.has('6,8')).toBe(true);
    expect(set.has('7,8')).toBe(true);
  });

  it('getSpawnPosition returns valid coordinates', () => {
    for (const kind of ALL_PIECES) {
      const pos = getSpawnPosition(kind);
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(ALL_PIECES)('shape cells are unique for piece %s rotation 0', (kind: PieceKind) => {
    const cells = getPieceShape(kind, 0);
    const uniq = new Set(cells.map(([x, y]) => `${x},${y}`));
    expect(uniq.size).toBe(4);
  });
});
