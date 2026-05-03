import { describe, it, expect } from 'vitest';
import {
  canPlace,
  clearLines,
  cloneBoard,
  createEmptyBoard,
  dropDistance,
  ghostPiece,
  isAboveVisibleArea,
  isCellBlocked,
  isInsideHorizontal,
  lockPiece,
  VISIBLE_TOP,
} from './board';
import { BOARD_HEIGHT, BOARD_WIDTH, TOTAL_HEIGHT } from './types';
import type { ActivePiece } from './types';

describe('board', () => {
  it('creates an empty board with correct dimensions', () => {
    const b = createEmptyBoard();
    expect(b).toHaveLength(TOTAL_HEIGHT);
    expect(b[0]).toHaveLength(BOARD_WIDTH);
    expect(b.flat().every((c) => c === null)).toBe(true);
  });

  it('clones board independently', () => {
    const b = createEmptyBoard();
    const c = cloneBoard(b);
    c[0][0] = 'I';
    expect(b[0][0]).toBeNull();
  });

  it('isInsideHorizontal works', () => {
    expect(isInsideHorizontal(-1)).toBe(false);
    expect(isInsideHorizontal(0)).toBe(true);
    expect(isInsideHorizontal(BOARD_WIDTH - 1)).toBe(true);
    expect(isInsideHorizontal(BOARD_WIDTH)).toBe(false);
  });

  it('isCellBlocked detects walls and floor', () => {
    const b = createEmptyBoard();
    expect(isCellBlocked(b, -1, 5)).toBe(true);
    expect(isCellBlocked(b, BOARD_WIDTH, 5)).toBe(true);
    expect(isCellBlocked(b, 0, TOTAL_HEIGHT)).toBe(true);
    expect(isCellBlocked(b, 0, -5)).toBe(false);
    expect(isCellBlocked(b, 0, 0)).toBe(false);
    b[5][3] = 'I';
    expect(isCellBlocked(b, 3, 5)).toBe(true);
  });

  it('canPlace checks all cells', () => {
    const b = createEmptyBoard();
    const piece: ActivePiece = { kind: 'I', rotation: 0, x: 0, y: 0 };
    expect(canPlace(b, piece)).toBe(true);
    const oob: ActivePiece = { kind: 'I', rotation: 0, x: 8, y: 0 };
    expect(canPlace(b, oob)).toBe(false);
  });

  it('locks a piece into the board', () => {
    const b = createEmptyBoard();
    const piece: ActivePiece = { kind: 'O', rotation: 0, x: 4, y: 18 };
    const next = lockPiece(b, piece);
    expect(next[18][5]).toBe('O');
    expect(next[18][6]).toBe('O');
    expect(next[19][5]).toBe('O');
    expect(next[19][6]).toBe('O');
  });

  it('clearLines removes full rows and shifts down', () => {
    const b = createEmptyBoard();
    for (let x = 0; x < BOARD_WIDTH; x++) b[TOTAL_HEIGHT - 1][x] = 'L';
    for (let x = 0; x < BOARD_WIDTH; x++) b[TOTAL_HEIGHT - 2][x] = 'L';
    b[TOTAL_HEIGHT - 3][0] = 'I';
    const result = clearLines(b);
    expect(result.linesCleared).toBe(2);
    expect(result.clearedRows).toEqual([TOTAL_HEIGHT - 2, TOTAL_HEIGHT - 1]);
    expect(result.board.length).toBe(TOTAL_HEIGHT);
    expect(result.board[TOTAL_HEIGHT - 1][0]).toBe('I');
    expect(result.board[0].every((c) => c === null)).toBe(true);
  });

  it('clearLines returns 0 when no full lines', () => {
    const b = createEmptyBoard();
    const r = clearLines(b);
    expect(r.linesCleared).toBe(0);
    expect(r.clearedRows).toEqual([]);
  });

  it('dropDistance falls to floor on empty board', () => {
    const b = createEmptyBoard();
    const piece: ActivePiece = { kind: 'I', rotation: 0, x: 3, y: 0 };
    const dist = dropDistance(b, piece);
    expect(dist).toBeGreaterThan(0);
    const dropped: ActivePiece = { ...piece, y: piece.y + dist };
    expect(canPlace(b, dropped)).toBe(true);
    expect(canPlace(b, { ...dropped, y: dropped.y + 1 })).toBe(false);
  });

  it('ghostPiece returns piece at floor', () => {
    const b = createEmptyBoard();
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 0 };
    const ghost = ghostPiece(b, piece);
    expect(ghost.y).toBeGreaterThan(piece.y);
  });

  it('isAboveVisibleArea works', () => {
    const piece: ActivePiece = { kind: 'I', rotation: 0, x: 3, y: 0 };
    expect(isAboveVisibleArea(piece)).toBe(true);
    const inView: ActivePiece = { kind: 'I', rotation: 0, x: 3, y: 5 };
    expect(isAboveVisibleArea(inView)).toBe(false);
  });

  it('VISIBLE_TOP equals TOTAL_HEIGHT - BOARD_HEIGHT', () => {
    expect(VISIBLE_TOP).toBe(TOTAL_HEIGHT - BOARD_HEIGHT);
  });
});
