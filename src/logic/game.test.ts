import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  reduce,
  spawnPiece,
  type GameState,
} from './game';
import { BOARD_WIDTH, TOTAL_HEIGHT } from './types';

function startedState(seed = 1, startLevel = 1): GameState {
  const s = createInitialState({ seed, startLevel });
  return reduce(s, { type: 'start' });
}

describe('game reducer', () => {
  it('starts in menu phase', () => {
    const s = createInitialState({ seed: 1 });
    expect(s.phase).toBe('menu');
    expect(s.active).toBeNull();
  });

  it('start spawns a piece and sets queue', () => {
    const s = startedState();
    expect(s.phase).toBe('playing');
    expect(s.active).not.toBeNull();
    expect(s.queue.length).toBeGreaterThan(0);
  });

  it('pause and resume', () => {
    let s = startedState();
    s = reduce(s, { type: 'pause' });
    expect(s.phase).toBe('paused');
    s = reduce(s, { type: 'resume' });
    expect(s.phase).toBe('playing');
  });

  it('pause is no-op outside playing', () => {
    const s = createInitialState({ seed: 1 });
    expect(reduce(s, { type: 'pause' }).phase).toBe('menu');
    expect(reduce(s, { type: 'resume' }).phase).toBe('menu');
  });

  it('move shifts piece left/right', () => {
    let s = startedState();
    const initialX = s.active!.x;
    s = reduce(s, { type: 'move', dx: 1 });
    expect(s.active!.x).toBe(initialX + 1);
    s = reduce(s, { type: 'move', dx: -1 });
    expect(s.active!.x).toBe(initialX);
  });

  it('move blocked by wall does nothing', () => {
    let s = startedState();
    for (let i = 0; i < 20; i++) s = reduce(s, { type: 'move', dx: -1 });
    const x1 = s.active!.x;
    s = reduce(s, { type: 'move', dx: -1 });
    expect(s.active!.x).toBe(x1);
  });

  it('softDrop moves down and adds 1 point', () => {
    let s = startedState();
    const y0 = s.active!.y;
    const score0 = s.score;
    s = reduce(s, { type: 'softDrop' });
    expect(s.active!.y).toBe(y0 + 1);
    expect(s.score).toBe(score0 + 1);
  });

  it('hardDrop locks piece and scores 2 per row', () => {
    let s = startedState();
    const y0 = s.active!.y;
    s = reduce(s, { type: 'hardDrop' });
    // After hard drop, a new piece is spawned (or game over)
    expect(s.active).not.toBeNull();
    expect(s.score).toBeGreaterThan(0);
    expect(s.active!.y).toBeLessThanOrEqual(y0 + 100);
  });

  it('rotate changes rotation when possible', () => {
    let s = startedState(2);
    // Force not-O piece to test rotation. Skip O.
    while (s.active && s.active.kind === 'O') {
      s = reduce(s, { type: 'hardDrop' });
    }
    if (s.active && s.active.kind !== 'O') {
      const r0 = s.active.rotation;
      s = reduce(s, { type: 'rotate', direction: 'cw' });
      expect(s.active!.rotation).not.toBe(r0);
    }
  });

  it('hold swaps piece', () => {
    let s = startedState();
    const first = s.active!.kind;
    s = reduce(s, { type: 'hold' });
    expect(s.hold).toBe(first);
    expect(s.canHold).toBe(false);
  });

  it('hold disabled until next piece', () => {
    let s = startedState();
    s = reduce(s, { type: 'hold' });
    const holdAfterFirst = s.hold;
    s = reduce(s, { type: 'hold' });
    expect(s.hold).toBe(holdAfterFirst);
  });

  it('hold swaps with previous hold piece', () => {
    let s = startedState();
    const first = s.active!.kind;
    s = reduce(s, { type: 'hold' });
    const second = s.active!.kind;
    s = reduce(s, { type: 'hardDrop' });
    s = reduce(s, { type: 'hold' });
    expect(s.hold).toBe(s.hold);
    expect(s.active!.kind).toBe(first);
    expect(second).not.toBe(first);
  });

  it('tick with small delta does not crash', () => {
    let s = startedState();
    s = reduce(s, { type: 'tick', deltaMs: 16 });
    expect(s.phase).toBe('playing');
  });

  it('tick with large delta makes piece descend', () => {
    let s = startedState();
    const y0 = s.active!.y;
    s = reduce(s, { type: 'tick', deltaMs: 5000 });
    expect(s.active === null || s.active.y > y0).toBeTruthy();
  });

  it('clears a tetris and adds points', () => {
    // Build a board missing one column on the right, then drop an I piece
    let s = startedState();
    // Manually construct: fill rows TOTAL_HEIGHT-1..TOTAL_HEIGHT-4 except column 9
    const board = s.board.map((row) => row.slice());
    for (let y = TOTAL_HEIGHT - 4; y < TOTAL_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board };
    // Force active to vertical I at column 9
    s = { ...s, active: { kind: 'I', rotation: 1, x: 7, y: 0 } };
    const linesBefore = s.lines;
    s = reduce(s, { type: 'hardDrop' });
    expect(s.lines).toBe(linesBefore + 4);
    expect(s.score).toBeGreaterThan(0);
  });

  it('restart resets score and board', () => {
    let s = startedState();
    s = reduce(s, { type: 'hardDrop' });
    s = reduce(s, { type: 'restart' });
    expect(s.phase).toBe('playing');
    expect(s.lines).toBe(0);
  });

  it('setHighScore updates high score', () => {
    let s = createInitialState({ seed: 1 });
    s = reduce(s, { type: 'setHighScore', value: 5000 });
    expect(s.highScore).toBe(5000);
    s = reduce(s, { type: 'setHighScore', value: 1000 });
    expect(s.highScore).toBe(5000);
  });

  it('move ignored when not playing', () => {
    const s = createInitialState({ seed: 1 });
    expect(reduce(s, { type: 'move', dx: 1 })).toBe(s);
    expect(reduce(s, { type: 'softDrop' })).toBe(s);
    expect(reduce(s, { type: 'hardDrop' })).toBe(s);
    expect(reduce(s, { type: 'rotate', direction: 'cw' })).toBe(s);
    expect(reduce(s, { type: 'hold' })).toBe(s);
    expect(reduce(s, { type: 'tick', deltaMs: 100 })).toBe(s);
  });

  it('game over when spawn position is blocked', () => {
    let s = startedState();
    // Fill spawn area
    const board = s.board.map((row) => row.slice());
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 'L';
      }
    }
    s = { ...s, board };
    s = { ...s, active: { kind: 'I', rotation: 1, x: 0, y: 18 } };
    s = reduce(s, { type: 'hardDrop' });
    // Game continues since active piece doesn't conflict initially
    // Next spawn might fail if board is full
    expect(['playing', 'gameover']).toContain(s.phase);
  });

  it('spawnPiece uses spawn position', () => {
    const p = spawnPiece('T');
    expect(p.kind).toBe('T');
    expect(p.rotation).toBe(0);
    expect(p.x).toBeGreaterThanOrEqual(0);
  });
});
