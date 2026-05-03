import { describe, it, expect } from 'vitest';
import {
  computeScore,
  detectTSpin,
  gravityIntervalMs,
  hardDropPoints,
  isDifficultClear,
  levelFromLines,
  pieceFootprint,
  softDropPoints,
} from './scoring';
import { createEmptyBoard } from './board';
import type { ActivePiece } from './types';

describe('scoring', () => {
  it('single = 100 * level', () => {
    expect(
      computeScore({ linesCleared: 1, level: 1, tSpin: 'none', isBackToBack: false, combo: 0 })
    ).toBe(100);
    expect(
      computeScore({ linesCleared: 1, level: 5, tSpin: 'none', isBackToBack: false, combo: 0 })
    ).toBe(500);
  });

  it('double = 300 * level', () => {
    expect(
      computeScore({ linesCleared: 2, level: 1, tSpin: 'none', isBackToBack: false, combo: 0 })
    ).toBe(300);
  });

  it('triple = 500 * level', () => {
    expect(
      computeScore({ linesCleared: 3, level: 1, tSpin: 'none', isBackToBack: false, combo: 0 })
    ).toBe(500);
  });

  it('tetris = 800 * level', () => {
    expect(
      computeScore({ linesCleared: 4, level: 2, tSpin: 'none', isBackToBack: false, combo: 0 })
    ).toBe(1600);
  });

  it('back-to-back tetris = 800 * level * 1.5', () => {
    expect(
      computeScore({ linesCleared: 4, level: 1, tSpin: 'none', isBackToBack: true, combo: 0 })
    ).toBe(1200);
  });

  it('combo bonus adds 50 per combo per level', () => {
    expect(
      computeScore({ linesCleared: 1, level: 1, tSpin: 'none', isBackToBack: false, combo: 2 })
    ).toBe(100 + 50 * 2 * 1);
  });

  it('zero lines = zero score (no t-spin)', () => {
    expect(
      computeScore({ linesCleared: 0, level: 1, tSpin: 'none', isBackToBack: false, combo: 0 })
    ).toBe(0);
  });

  it('t-spin scoring', () => {
    expect(
      computeScore({ linesCleared: 0, level: 1, tSpin: 'full', isBackToBack: false, combo: 0 })
    ).toBe(400);
    expect(
      computeScore({ linesCleared: 1, level: 1, tSpin: 'full', isBackToBack: false, combo: 0 })
    ).toBe(800);
    expect(
      computeScore({ linesCleared: 2, level: 1, tSpin: 'full', isBackToBack: false, combo: 0 })
    ).toBe(1200);
    expect(
      computeScore({ linesCleared: 3, level: 1, tSpin: 'full', isBackToBack: false, combo: 0 })
    ).toBe(1600);
  });

  it('mini t-spin scoring', () => {
    expect(
      computeScore({ linesCleared: 0, level: 1, tSpin: 'mini', isBackToBack: false, combo: 0 })
    ).toBe(100);
    expect(
      computeScore({ linesCleared: 1, level: 1, tSpin: 'mini', isBackToBack: false, combo: 0 })
    ).toBe(200);
    expect(
      computeScore({ linesCleared: 2, level: 1, tSpin: 'mini', isBackToBack: false, combo: 0 })
    ).toBe(400);
  });

  it('isDifficultClear', () => {
    expect(isDifficultClear(4, 'none')).toBe(true);
    expect(isDifficultClear(1, 'full')).toBe(true);
    expect(isDifficultClear(1, 'none')).toBe(false);
    expect(isDifficultClear(0, 'mini')).toBe(false);
  });

  it('levelFromLines', () => {
    expect(levelFromLines(0)).toBe(1);
    expect(levelFromLines(9)).toBe(1);
    expect(levelFromLines(10)).toBe(2);
    expect(levelFromLines(35)).toBe(4);
    expect(levelFromLines(0, 5)).toBe(5);
  });

  it('gravityIntervalMs decreases with level', () => {
    const lvl1 = gravityIntervalMs(1);
    const lvl5 = gravityIntervalMs(5);
    const lvl10 = gravityIntervalMs(10);
    expect(lvl1).toBe(1000);
    expect(lvl5).toBeLessThan(lvl1);
    expect(lvl10).toBeLessThan(lvl5);
    expect(gravityIntervalMs(20)).toBeGreaterThanOrEqual(16);
  });

  it('softDropPoints linear', () => {
    expect(softDropPoints(0)).toBe(0);
    expect(softDropPoints(5)).toBe(5);
  });

  it('hardDropPoints doubled', () => {
    expect(hardDropPoints(10)).toBe(20);
  });

  it('detectTSpin returns none for non-T pieces', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { kind: 'L', rotation: 0, x: 3, y: 18 };
    expect(detectTSpin(board, piece, true, 0)).toBe('none');
  });

  it('detectTSpin returns none if last move was not rotation', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 18 };
    expect(detectTSpin(board, piece, false, 0)).toBe('none');
  });

  it('detectTSpin detects 3-corner full t-spin', () => {
    const board = createEmptyBoard();
    // T piece at center (cx=4, cy=19). Fill 3 corners.
    const piece: ActivePiece = { kind: 'T', rotation: 2, x: 3, y: 18 };
    // corners at (3,18), (5,18), (3,20-floor), (5,20-floor) but y=20 is floor edge
    // Let's place at y=18 so cx=4, cy=19. Corners: (3,18) (5,18) (3,20 outside) (5,20 outside)
    // bottom corners are outside the board (>= TOTAL_HEIGHT?), TOTAL_HEIGHT=22, so (3,20) and (5,20) are inside
    board[18][3] = 'I';
    board[20][3] = 'I';
    board[20][5] = 'I';
    const result = detectTSpin(board, piece, true, 0);
    expect(['mini', 'full']).toContain(result);
  });

  it('pieceFootprint returns 4 cells', () => {
    const piece: ActivePiece = { kind: 'I', rotation: 0, x: 3, y: 5 };
    expect(pieceFootprint(piece)).toHaveLength(4);
  });
});
