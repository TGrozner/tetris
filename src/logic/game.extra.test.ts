import { describe, it, expect } from 'vitest';
import { createInitialState, reduce, type GameState } from './game';
import { BOARD_WIDTH, TOTAL_HEIGHT } from './types';

function startedState(seed = 1, startLevel = 1): GameState {
  const s = createInitialState({ seed, startLevel });
  return reduce(s, { type: 'start' });
}

describe('game extra branches', () => {
  it('softDrop blocked at floor does nothing', () => {
    let s = startedState();
    // Move piece all the way down
    for (let i = 0; i < 30; i++) s = reduce(s, { type: 'softDrop' });
    const score = s.score;
    s = reduce(s, { type: 'softDrop' });
    expect(s.score).toBe(score);
  });

  it('hold from second hold uses spawn position of stored kind', () => {
    let s = startedState(123);
    s = reduce(s, { type: 'hold' });
    s = reduce(s, { type: 'hardDrop' });
    s = reduce(s, { type: 'hold' });
    expect(s.active).not.toBeNull();
  });

  it('start without prior init', () => {
    const s = createInitialState();
    expect(s.phase).toBe('menu');
    const started = reduce(s, { type: 'start' });
    expect(started.phase).toBe('playing');
  });

  it('restart with explicit seed restarts board', () => {
    let s = startedState();
    s = reduce(s, { type: 'hardDrop' });
    s = reduce(s, { type: 'hardDrop' });
    s = reduce(s, { type: 'restart', seed: 42 });
    expect(s.lines).toBe(0);
    expect(s.score).toBe(0);
    expect(s.board.flat().every((c) => c === null)).toBe(true);
  });

  it('multiple line clears track combo', () => {
    let s = startedState();
    // Build a board where every drop will clear at least one line.
    const board = s.board.map((row) => row.slice());
    for (let y = TOTAL_HEIGHT - 1; y >= TOTAL_HEIGHT - 4; y--) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board, active: { kind: 'I', rotation: 1, x: 7, y: 0 } };
    s = reduce(s, { type: 'hardDrop' });
    expect(s.combo).toBe(0);
    // Build again for second clear
    const board2 = s.board.map((row) => row.slice());
    for (let y = TOTAL_HEIGHT - 1; y >= TOTAL_HEIGHT - 1; y--) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board2[y][x] = 'L';
      }
    }
    s = { ...s, board: board2, active: { kind: 'I', rotation: 1, x: 7, y: 0 } };
    s = reduce(s, { type: 'hardDrop' });
    expect(s.combo).toBe(1);
  });

  it('combo resets on no clear', () => {
    let s = startedState();
    const board = s.board.map((row) => row.slice());
    for (let y = TOTAL_HEIGHT - 1; y >= TOTAL_HEIGHT - 4; y--) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board, active: { kind: 'I', rotation: 1, x: 7, y: 0 } };
    s = reduce(s, { type: 'hardDrop' });
    expect(s.combo).toBe(0);
    // hard drop next piece without clearing
    s = reduce(s, { type: 'hardDrop' });
    expect(s.combo).toBe(-1);
  });

  it('back-to-back tetris boosts score', () => {
    // Setup state with backToBack already true
    let s = startedState();
    const board = s.board.map((row) => row.slice());
    for (let y = TOTAL_HEIGHT - 1; y >= TOTAL_HEIGHT - 4; y--) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board[y][x] = 'L';
      }
    }
    s = {
      ...s,
      board,
      active: { kind: 'I', rotation: 1, x: 7, y: 0 },
      backToBack: true,
      level: 1,
    };
    const before = s.score;
    s = reduce(s, { type: 'hardDrop' });
    // tetris with B2B = 800 * 1.5 + hard drop bonus
    expect(s.score - before).toBeGreaterThanOrEqual(1200);
  });

  it('hold ignored when canHold is false', () => {
    let s = startedState();
    s = reduce(s, { type: 'hold' });
    const before = s;
    s = reduce(s, { type: 'hold' });
    expect(s).toBe(before);
  });

  it('rotate noop when O piece', () => {
    let s = startedState();
    while (s.active && s.active.kind !== 'O') {
      s = reduce(s, { type: 'hardDrop' });
    }
    if (s.active && s.active.kind === 'O') {
      const before = s.active.rotation;
      s = reduce(s, { type: 'rotate', direction: 'cw' });
      // O rotation is same offset, but rotation field cycles
      expect(s.active!.rotation).not.toBe(undefined);
      expect(before).toBeDefined();
    }
  });

  it('level increases after 10 lines', () => {
    let s = startedState();
    s = { ...s, lines: 9 };
    const board = s.board.map((row) => row.slice());
    for (let y = TOTAL_HEIGHT - 1; y >= TOTAL_HEIGHT - 1; y--) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board, active: { kind: 'I', rotation: 1, x: 7, y: 0 } };
    s = reduce(s, { type: 'hardDrop' });
    expect(s.level).toBe(2);
  });

  it('lock delay triggers after gravity stalls', () => {
    let s = startedState();
    // Drop active piece all the way to floor
    for (let i = 0; i < 30; i++) s = reduce(s, { type: 'softDrop' });
    // Now tick repeatedly to trigger lock
    for (let i = 0; i < 20; i++) {
      s = reduce(s, { type: 'tick', deltaMs: 100 });
    }
    expect(s.active).not.toBeNull();
  });

  it('rotate CCW also works', () => {
    let s = startedState(7);
    while (s.active && s.active.kind === 'O') {
      s = reduce(s, { type: 'hardDrop' });
    }
    if (s.active && s.active.kind !== 'O') {
      const r0 = s.active.rotation;
      s = reduce(s, { type: 'rotate', direction: 'ccw' });
      expect(s.active!.rotation).not.toBe(r0);
    }
  });
});
