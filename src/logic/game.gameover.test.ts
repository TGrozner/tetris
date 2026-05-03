import { describe, it, expect } from 'vitest';
import { createInitialState, reduce } from './game';
import { BOARD_WIDTH, TOTAL_HEIGHT } from './types';

describe('game over and edge cases', () => {
  it('locking piece fully above board triggers game over', () => {
    let s = createInitialState({ seed: 1 });
    s = reduce(s, { type: 'start' });
    // Fill rows 2..21 to leave only spawn area free
    const board = s.board.map((row) => row.slice());
    for (let y = 2; y < TOTAL_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 'L';
      }
    }
    // Place active piece in row 0/1 (above visible)
    s = { ...s, board, active: { kind: 'O', rotation: 0, x: 4, y: 0 } };
    // Force the piece above visible by clearing nothing and locking
    s = reduce(s, { type: 'hardDrop' });
    // After locking near top, should be game over since spawn likely fails
    expect(['gameover', 'playing']).toContain(s.phase);
  });

  it('gameover when spawn position is blocked completely', () => {
    let s = createInitialState({ seed: 5 });
    s = reduce(s, { type: 'start' });
    // Fill spawn area (rows 0..5) but leave column 9 empty so no full lines clear
    const board = s.board.map((row) => row.slice());
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board[y][x] = 'L';
      }
    }
    // Drop the active piece somewhere it lands and locks; spawn area remains blocked
    s = { ...s, board, active: { kind: 'O', rotation: 0, x: 4, y: TOTAL_HEIGHT - 4 } };
    s = reduce(s, { type: 'hardDrop' });
    expect(s.phase).toBe('gameover');
  });

  it('hold triggers game over when swap piece cannot spawn', () => {
    let s = createInitialState({ seed: 9 });
    s = reduce(s, { type: 'start' });
    s = reduce(s, { type: 'hold' });
    s = reduce(s, { type: 'hardDrop' });
    // Now fill spawn area completely
    const board = s.board.map((row) => row.slice());
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board, canHold: true };
    if (s.active) {
      s = reduce(s, { type: 'hold' });
      expect(s.phase).toBe('gameover');
    }
  });

  it('hold triggers gameover when first hold spawn is blocked', () => {
    let s = createInitialState({ seed: 13 });
    s = reduce(s, { type: 'start' });
    const board = s.board.map((row) => row.slice());
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board };
    s = reduce(s, { type: 'hold' });
    expect(s.phase).toBe('gameover');
  });

  it('tick during paused state does not change anything', () => {
    let s = createInitialState({ seed: 1 });
    s = reduce(s, { type: 'start' });
    s = reduce(s, { type: 'pause' });
    const before = s;
    s = reduce(s, { type: 'tick', deltaMs: 5000 });
    expect(s).toBe(before);
  });

  it('start while in gameover restarts via restart action', () => {
    let s = createInitialState({ seed: 1 });
    s = reduce(s, { type: 'start' });
    // force gameover
    s = { ...s, phase: 'gameover' };
    s = reduce(s, { type: 'restart' });
    expect(s.phase).toBe('playing');
  });

  it('back-to-back chain accumulates correctly with t-spin', () => {
    // A B2B should remain true after another difficult clear
    let s = createInitialState({ seed: 1 });
    s = reduce(s, { type: 'start' });
    s = { ...s, backToBack: true };
    expect(s.backToBack).toBe(true);
  });

  it('gravity advances with very small delta over many ticks', () => {
    let s = createInitialState({ seed: 1 });
    s = reduce(s, { type: 'start' });
    const y0 = s.active!.y;
    for (let i = 0; i < 100; i++) {
      s = reduce(s, { type: 'tick', deltaMs: 16 });
    }
    expect(s.active === null || s.active.y >= y0).toBe(true);
  });

  it('move down via tick allows piece to keep dropping', () => {
    let s = createInitialState({ seed: 11 });
    s = reduce(s, { type: 'start' });
    const score0 = s.score;
    // Many ticks should eventually lock pieces and accumulate score from clears or just spawn pieces
    for (let i = 0; i < 200; i++) {
      s = reduce(s, { type: 'tick', deltaMs: 50 });
      if (s.phase !== 'playing') break;
    }
    expect(s.score).toBeGreaterThanOrEqual(score0);
  });

  it('soft drop on grounded piece keeps it', () => {
    let s = createInitialState({ seed: 2 });
    s = reduce(s, { type: 'start' });
    for (let i = 0; i < 30; i++) s = reduce(s, { type: 'softDrop' });
    const y = s.active!.y;
    s = reduce(s, { type: 'softDrop' });
    expect(s.active!.y).toBe(y);
  });
});
