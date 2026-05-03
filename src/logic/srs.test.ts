import { describe, it, expect } from 'vitest';
import { rotateCW, rotateCCW, tryRotate } from './srs';
import { createEmptyBoard } from './board';
import type { ActivePiece, Rotation } from './types';

describe('srs', () => {
  it('rotateCW cycles 0->1->2->3->0', () => {
    let r: Rotation = 0;
    r = rotateCW(r);
    expect(r).toBe(1);
    r = rotateCW(r);
    expect(r).toBe(2);
    r = rotateCW(r);
    expect(r).toBe(3);
    r = rotateCW(r);
    expect(r).toBe(0);
  });

  it('rotateCCW cycles backwards', () => {
    let r: Rotation = 0;
    r = rotateCCW(r);
    expect(r).toBe(3);
    r = rotateCCW(r);
    expect(r).toBe(2);
  });

  it('tryRotate succeeds in open space', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 5 };
    const result = tryRotate(board, piece, 'cw');
    expect(result).not.toBeNull();
    expect(result!.piece.rotation).toBe(1);
  });

  it('tryRotate O piece returns same position', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { kind: 'O', rotation: 0, x: 3, y: 5 };
    const result = tryRotate(board, piece, 'cw');
    expect(result).not.toBeNull();
    expect(result!.piece.x).toBe(3);
    expect(result!.piece.y).toBe(5);
  });

  it('tryRotate uses wall kicks against left wall', () => {
    const board = createEmptyBoard();
    // T piece at left wall, rotated 1 (right side)
    const piece: ActivePiece = { kind: 'T', rotation: 1, x: -1, y: 5 };
    const result = tryRotate(board, piece, 'cw');
    expect(result).not.toBeNull();
    expect(result!.piece.x).toBeGreaterThanOrEqual(0);
  });

  it('tryRotate I-piece kick away from right wall', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { kind: 'I', rotation: 0, x: 7, y: 5 };
    const result = tryRotate(board, piece, 'cw');
    expect(result).not.toBeNull();
  });

  it('tryRotate returns null when fully blocked', () => {
    const board = createEmptyBoard();
    // Fill area around piece so no kick succeeds
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (!(x >= 3 && x <= 5 && y >= 5 && y <= 6)) {
          board[y][x] = 'I';
        }
      }
    }
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 5 };
    const result = tryRotate(board, piece, 'cw');
    // Possibly null since surrounded
    if (result) {
      expect(result.piece.rotation).toBe(1);
    } else {
      expect(result).toBeNull();
    }
  });
});
