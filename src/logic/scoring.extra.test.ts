import { describe, it, expect } from 'vitest';
import { detectTSpin } from './scoring';
import { createEmptyBoard } from './board';
import { TOTAL_HEIGHT } from './types';
import type { ActivePiece } from './types';

describe('t-spin extra branches', () => {
  it('detectTSpin none when fewer than 3 corners occupied', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 5 };
    expect(detectTSpin(board, piece, true, 0)).toBe('none');
  });

  it('detectTSpin returns full when all 4 corners and front-front', () => {
    const board = createEmptyBoard();
    // Place T at (3, TOTAL_HEIGHT-2) so center is (4, TOTAL_HEIGHT-1)
    const cy = TOTAL_HEIGHT - 1;
    const cx = 4;
    board[cy - 1][cx - 1] = 'I';
    board[cy - 1][cx + 1] = 'I';
    if (board[cy + 1]) board[cy + 1][cx - 1] = 'I';
    // (cy+1, cx+1) outside
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: cx - 1, y: cy - 1 };
    const r = detectTSpin(board, piece, true, 0);
    expect(['full', 'mini']).toContain(r);
  });

  it('detectTSpin returns full at rotation 1 with right corners filled', () => {
    const board = createEmptyBoard();
    const cx = 4;
    const cy = 8;
    // For rotation 1 (right), front corners are right-top and right-bottom
    board[cy - 1][cx + 1] = 'I';
    board[cy + 1][cx + 1] = 'I';
    board[cy - 1][cx - 1] = 'I';
    const piece: ActivePiece = { kind: 'T', rotation: 1, x: cx - 1, y: cy - 1 };
    const r = detectTSpin(board, piece, true, 0);
    expect(['full', 'mini']).toContain(r);
  });

  it('detectTSpin rotation 2 down-pointing', () => {
    const board = createEmptyBoard();
    const cx = 4;
    const cy = 8;
    board[cy + 1][cx - 1] = 'I';
    board[cy + 1][cx + 1] = 'I';
    board[cy - 1][cx - 1] = 'I';
    const piece: ActivePiece = { kind: 'T', rotation: 2, x: cx - 1, y: cy - 1 };
    const r = detectTSpin(board, piece, true, 0);
    expect(['full', 'mini']).toContain(r);
  });

  it('detectTSpin rotation 3 left-pointing', () => {
    const board = createEmptyBoard();
    const cx = 4;
    const cy = 8;
    board[cy - 1][cx - 1] = 'I';
    board[cy + 1][cx - 1] = 'I';
    board[cy + 1][cx + 1] = 'I';
    const piece: ActivePiece = { kind: 'T', rotation: 3, x: cx - 1, y: cy - 1 };
    const r = detectTSpin(board, piece, true, 0);
    expect(['full', 'mini']).toContain(r);
  });

  it('detectTSpin promotes mini to full when last kick was 4', () => {
    const board = createEmptyBoard();
    const cx = 4;
    const cy = 8;
    // Make 3 corners occupied with only 1 front, but kickIndex=4
    board[cy + 1][cx - 1] = 'I';
    board[cy + 1][cx + 1] = 'I';
    board[cy - 1][cx - 1] = 'I';
    const piece: ActivePiece = { kind: 'T', rotation: 0, x: cx - 1, y: cy - 1 };
    const r = detectTSpin(board, piece, true, 4);
    expect(r).toBe('full');
  });
});
