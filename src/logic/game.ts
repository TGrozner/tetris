import {
  canPlace,
  clearLines,
  createEmptyBoard,
  dropDistance,
  lockPiece,
} from './board';
import { getPieceCells as pieceCells, getSpawnPosition } from './pieces';
import { BagRandomizer, mulberry32 } from './rng';
import {
  computeScore,
  detectTSpin,
  gravityIntervalMs,
  hardDropPoints,
  isDifficultClear,
  levelFromLines,
  softDropPoints,
  type TSpinKind,
} from './scoring';
import { tryRotate } from './srs';
import type { ActivePiece, Board, PieceKind, Rotation } from './types';

export type Phase = 'menu' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  phase: Phase;
  board: Board;
  active: ActivePiece | null;
  hold: PieceKind | null;
  canHold: boolean;
  queue: PieceKind[];
  rng: BagRandomizer;
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: boolean;
  startLevel: number;
  lastTSpin: TSpinKind;
  lastClearedRows: number[];
  lastMoveWasRotation: boolean;
  lastKickIndex: number;
  lockDelayMs: number;
  lockTimer: number;
  lockResets: number;
  gravityAccumulator: number;
  highScore: number;
  seed: number;
}

export interface InitOptions {
  seed?: number;
  startLevel?: number;
  highScore?: number;
}

const QUEUE_PEEK = 5;
const MAX_LOCK_RESETS = 15;
const DEFAULT_LOCK_DELAY = 500;

export function createInitialState(options: InitOptions = {}): GameState {
  const seed = options.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = new BagRandomizer(mulberry32(seed));
  const startLevel = options.startLevel ?? 1;
  return {
    phase: 'menu',
    board: createEmptyBoard(),
    active: null,
    hold: null,
    canHold: true,
    queue: rng.peek(QUEUE_PEEK),
    rng,
    score: 0,
    level: startLevel,
    lines: 0,
    combo: -1,
    backToBack: false,
    startLevel,
    lastTSpin: 'none',
    lastClearedRows: [],
    lastMoveWasRotation: false,
    lastKickIndex: 0,
    lockDelayMs: DEFAULT_LOCK_DELAY,
    lockTimer: 0,
    lockResets: 0,
    gravityAccumulator: 0,
    highScore: options.highScore ?? 0,
    seed,
  };
}

export type Action =
  | { type: 'start' }
  | { type: 'restart'; seed?: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick'; deltaMs: number }
  | { type: 'move'; dx: number }
  | { type: 'softDrop' }
  | { type: 'hardDrop' }
  | { type: 'rotate'; direction: 'cw' | 'ccw' }
  | { type: 'hold' }
  | { type: 'setHighScore'; value: number };

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start':
      return startGame(state);
    case 'restart':
      return startGame(
        createInitialState({
          seed: action.seed ?? Math.floor(Math.random() * 0xffffffff),
          startLevel: state.startLevel,
          highScore: state.highScore,
        })
      );
    case 'pause':
      if (state.phase !== 'playing') return state;
      return { ...state, phase: 'paused' };
    case 'resume':
      if (state.phase !== 'paused') return state;
      return { ...state, phase: 'playing' };
    case 'tick':
      if (state.phase !== 'playing') return state;
      return tick(state, action.deltaMs);
    case 'move':
      if (state.phase !== 'playing' || !state.active) return state;
      return tryMove(state, action.dx);
    case 'softDrop':
      if (state.phase !== 'playing' || !state.active) return state;
      return softDrop(state);
    case 'hardDrop':
      if (state.phase !== 'playing' || !state.active) return state;
      return hardDrop(state);
    case 'rotate':
      if (state.phase !== 'playing' || !state.active) return state;
      return rotate(state, action.direction);
    case 'hold':
      if (state.phase !== 'playing' || !state.active || !state.canHold) return state;
      return holdPiece(state);
    case 'setHighScore':
      return { ...state, highScore: Math.max(state.highScore, action.value) };
    default:
      return state;
  }
}

function startGame(prev: GameState): GameState {
  const seed = prev.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rng = new BagRandomizer(mulberry32(seed));
  const next = rng.next();
  const queue = rng.peek(QUEUE_PEEK);
  const piece = spawnPiece(next);
  return {
    ...prev,
    phase: 'playing',
    board: createEmptyBoard(),
    active: piece,
    hold: null,
    canHold: true,
    queue,
    rng,
    score: 0,
    level: prev.startLevel,
    lines: 0,
    combo: -1,
    backToBack: false,
    lastTSpin: 'none',
    lastClearedRows: [],
    lastMoveWasRotation: false,
    lastKickIndex: 0,
    lockTimer: 0,
    lockResets: 0,
    gravityAccumulator: 0,
  };
}

export function spawnPiece(kind: PieceKind): ActivePiece {
  const { x, y } = getSpawnPosition(kind);
  return { kind, rotation: 0 as Rotation, x, y };
}

function tick(state: GameState, deltaMs: number): GameState {
  if (!state.active) return state;
  const interval = gravityIntervalMs(state.level);
  let acc = state.gravityAccumulator + deltaMs;
  let next: GameState = { ...state, gravityAccumulator: acc };
  while (acc >= interval && next.active && next.phase === 'playing') {
    next = applyGravityStep(next);
    acc -= interval;
    next = { ...next, gravityAccumulator: acc };
  }
  if (next.phase !== 'playing' || !next.active) return next;
  // Lock delay handling: if piece can't move down, run lock timer.
  if (!canPlace(next.board, { ...next.active, y: next.active.y + 1 })) {
    const newTimer = next.lockTimer + deltaMs;
    if (newTimer >= next.lockDelayMs) {
      return lockAndAdvance(next);
    }
    return { ...next, lockTimer: newTimer };
  }
  return { ...next, lockTimer: 0 };
}

function applyGravityStep(state: GameState): GameState {
  if (!state.active) return state;
  const moved: ActivePiece = { ...state.active, y: state.active.y + 1 };
  if (canPlace(state.board, moved)) {
    return {
      ...state,
      active: moved,
      lockTimer: 0,
      lastMoveWasRotation: false,
    };
  }
  return state;
}

function tryMove(state: GameState, dx: number): GameState {
  if (!state.active) return state;
  const candidate: ActivePiece = { ...state.active, x: state.active.x + dx };
  if (canPlace(state.board, candidate)) {
    return resetLockOnMove({
      ...state,
      active: candidate,
      lastMoveWasRotation: false,
    });
  }
  return state;
}

function softDrop(state: GameState): GameState {
  if (!state.active) return state;
  const candidate: ActivePiece = { ...state.active, y: state.active.y + 1 };
  if (canPlace(state.board, candidate)) {
    return {
      ...state,
      active: candidate,
      score: state.score + softDropPoints(1),
      lastMoveWasRotation: false,
      lockTimer: 0,
    };
  }
  return state;
}

function hardDrop(state: GameState): GameState {
  if (!state.active) return state;
  const dist = dropDistance(state.board, state.active);
  const dropped: ActivePiece = { ...state.active, y: state.active.y + dist };
  const withScore: GameState = {
    ...state,
    active: dropped,
    score: state.score + hardDropPoints(dist),
    lastMoveWasRotation: false,
  };
  return lockAndAdvance(withScore);
}

function rotate(state: GameState, direction: 'cw' | 'ccw'): GameState {
  if (!state.active) return state;
  const result = tryRotate(state.board, state.active, direction);
  if (!result) return state;
  return resetLockOnMove({
    ...state,
    active: result.piece,
    lastMoveWasRotation: true,
    lastKickIndex: result.kickIndex,
  });
}

function holdPiece(state: GameState): GameState {
  if (!state.active || !state.canHold) return state;
  const current = state.active.kind;
  if (state.hold == null) {
    const nextKind = state.rng.next();
    const queue = state.rng.peek(QUEUE_PEEK);
    const piece = spawnPiece(nextKind);
    if (!canPlace(state.board, piece)) {
      return {
        ...state,
        hold: current,
        active: null,
        canHold: false,
        queue,
        phase: 'gameover',
        highScore: Math.max(state.highScore, state.score),
      };
    }
    return {
      ...state,
      hold: current,
      active: piece,
      canHold: false,
      queue,
      lockTimer: 0,
      lockResets: 0,
      lastMoveWasRotation: false,
    };
  }
  const swapped = spawnPiece(state.hold);
  if (!canPlace(state.board, swapped)) {
    return {
      ...state,
      hold: current,
      active: null,
      canHold: false,
      phase: 'gameover',
      highScore: Math.max(state.highScore, state.score),
    };
  }
  return {
    ...state,
    hold: current,
    active: swapped,
    canHold: false,
    lockTimer: 0,
    lockResets: 0,
    lastMoveWasRotation: false,
  };
}

function resetLockOnMove(state: GameState): GameState {
  if (!state.active) return state;
  const grounded = !canPlace(state.board, { ...state.active, y: state.active.y + 1 });
  if (!grounded) return state;
  if (state.lockResets >= MAX_LOCK_RESETS) return state;
  return { ...state, lockTimer: 0, lockResets: state.lockResets + 1 };
}

function lockAndAdvance(state: GameState): GameState {
  if (!state.active) return state;
  const tSpin = detectTSpin(
    state.board,
    state.active,
    state.lastMoveWasRotation,
    state.lastKickIndex
  );
  const newBoard = lockPiece(state.board, state.active);
  const cleared = clearLines(newBoard);
  const linesCleared = cleared.linesCleared;
  const newLines = state.lines + linesCleared;
  const newLevel = levelFromLines(newLines, state.startLevel);
  const newCombo = linesCleared > 0 ? state.combo + 1 : -1;
  const difficult = isDifficultClear(linesCleared, tSpin);
  let newB2B = state.backToBack;
  if (linesCleared > 0) {
    newB2B = difficult ? true : false;
  }
  const scoreGain = computeScore({
    linesCleared,
    level: state.level,
    tSpin,
    isBackToBack: state.backToBack && difficult && state.backToBack,
    combo: Math.max(0, newCombo),
  });
  const totalScore = state.score + scoreGain;

  // Check if locked piece is fully above visible area => game over (lock-out)
  const allAbove = activePieceAllAbove(state);
  if (allAbove && linesCleared === 0) {
    return {
      ...state,
      board: cleared.board,
      active: null,
      score: totalScore,
      lines: newLines,
      level: newLevel,
      combo: newCombo,
      backToBack: newB2B,
      lastTSpin: tSpin,
      lastClearedRows: cleared.clearedRows,
      phase: 'gameover',
      highScore: Math.max(state.highScore, totalScore),
    };
  }

  const nextKind = state.rng.next();
  const queue = state.rng.peek(QUEUE_PEEK);
  const newActive = spawnPiece(nextKind);
  if (!canPlace(cleared.board, newActive)) {
    return {
      ...state,
      board: cleared.board,
      active: null,
      score: totalScore,
      lines: newLines,
      level: newLevel,
      combo: newCombo,
      backToBack: newB2B,
      lastTSpin: tSpin,
      lastClearedRows: cleared.clearedRows,
      queue,
      phase: 'gameover',
      highScore: Math.max(state.highScore, totalScore),
    };
  }
  return {
    ...state,
    board: cleared.board,
    active: newActive,
    score: totalScore,
    lines: newLines,
    level: newLevel,
    combo: newCombo,
    backToBack: newB2B,
    lastTSpin: tSpin,
    lastClearedRows: cleared.clearedRows,
    queue,
    canHold: true,
    lockTimer: 0,
    lockResets: 0,
    lastMoveWasRotation: false,
    gravityAccumulator: 0,
    highScore: Math.max(state.highScore, totalScore),
  };
}

function activePieceAllAbove(state: GameState): boolean {
  if (!state.active) return false;
  const visibleTop = 2;
  const { kind, rotation, x, y } = state.active;
  const cells = pieceCells(kind, rotation, x, y);
  return cells.every(([, py]) => py < visibleTop);
}
