import type { ActivePiece, Board } from './types';
import { getPieceCells } from './pieces';

export interface ScoreEvent {
  linesCleared: number;
  level: number;
  tSpin: TSpinKind;
  isBackToBack: boolean;
  combo: number;
}

export type TSpinKind = 'none' | 'mini' | 'full';

export function computeScore(event: ScoreEvent): number {
  const { linesCleared, level, tSpin, isBackToBack, combo } = event;
  let base = 0;
  if (tSpin === 'full') {
    if (linesCleared === 0) base = 400;
    else if (linesCleared === 1) base = 800;
    else if (linesCleared === 2) base = 1200;
    else if (linesCleared === 3) base = 1600;
  } else if (tSpin === 'mini') {
    if (linesCleared === 0) base = 100;
    else if (linesCleared === 1) base = 200;
    else if (linesCleared === 2) base = 400;
  } else {
    if (linesCleared === 1) base = 100;
    else if (linesCleared === 2) base = 300;
    else if (linesCleared === 3) base = 500;
    else if (linesCleared === 4) base = 800;
  }

  let total = base * level;
  const isDifficult = linesCleared === 4 || (tSpin !== 'none' && linesCleared > 0);
  if (isBackToBack && isDifficult) {
    total = Math.floor(total * 1.5);
  }
  if (combo > 0 && linesCleared > 0) {
    total += 50 * combo * level;
  }
  return total;
}

export function isDifficultClear(linesCleared: number, tSpin: TSpinKind): boolean {
  return linesCleared === 4 || (tSpin !== 'none' && linesCleared > 0);
}

// Detect T-spin: piece must be T, last move must be a rotation, and at least 3 of the 4 corners
// around the T center must be blocked.
export function detectTSpin(
  board: Board,
  piece: ActivePiece,
  lastMoveWasRotation: boolean,
  lastKickIndex: number
): TSpinKind {
  if (piece.kind !== 'T' || !lastMoveWasRotation) return 'none';
  // T center is at (piece.x + 1, piece.y + 1)
  const cx = piece.x + 1;
  const cy = piece.y + 1;
  const corners: Array<[number, number]> = [
    [cx - 1, cy - 1],
    [cx + 1, cy - 1],
    [cx - 1, cy + 1],
    [cx + 1, cy + 1],
  ];
  let occupied = 0;
  for (const [x, y] of corners) {
    if (x < 0 || x >= board[0].length || y < 0 || y >= board.length) {
      occupied++;
    } else if (board[y][x] !== null) {
      occupied++;
    }
  }
  if (occupied < 3) return 'none';
  // Front corners depend on rotation. Pointing direction:
  // 0 -> up (front corners are top two)
  // 1 -> right (front corners are right two)
  // 2 -> down (front corners are bottom two)
  // 3 -> left (front corners are left two)
  const frontCorners = getFrontCorners(piece.rotation, cx, cy);
  let frontOccupied = 0;
  for (const [x, y] of frontCorners) {
    if (x < 0 || x >= board[0].length || y < 0 || y >= board.length) {
      frontOccupied++;
    } else if (board[y][x] !== null) {
      frontOccupied++;
    }
  }
  // Mini T-spin: 3 corners occupied but only 1 front corner (unless last kick was special)
  if (frontOccupied >= 2) return 'full';
  if (lastKickIndex === 4) return 'full';
  return 'mini';
}

function getFrontCorners(rotation: number, cx: number, cy: number): Array<[number, number]> {
  switch (rotation) {
    case 0:
      return [
        [cx - 1, cy - 1],
        [cx + 1, cy - 1],
      ];
    case 1:
      return [
        [cx + 1, cy - 1],
        [cx + 1, cy + 1],
      ];
    case 2:
      return [
        [cx - 1, cy + 1],
        [cx + 1, cy + 1],
      ];
    case 3:
      return [
        [cx - 1, cy - 1],
        [cx - 1, cy + 1],
      ];
    default:
      return [];
  }
}

export function levelFromLines(totalLines: number, startLevel = 1): number {
  return Math.max(startLevel, Math.floor(totalLines / 10) + startLevel);
}

// Tetris Guideline gravity: time per row = (0.8 - ((level - 1) * 0.007))^(level - 1) seconds
export function gravityIntervalMs(level: number): number {
  const lvl = Math.max(1, Math.min(level, 20));
  const seconds = Math.pow(0.8 - (lvl - 1) * 0.007, lvl - 1);
  return Math.max(16, Math.floor(seconds * 1000));
}

export function softDropPoints(rowsDropped: number): number {
  return rowsDropped;
}

export function hardDropPoints(rowsDropped: number): number {
  return rowsDropped * 2;
}

// Helper to ensure the active piece has cells inside the visible play area when locked.
export function pieceFootprint(piece: ActivePiece): Array<[number, number]> {
  return getPieceCells(piece.kind, piece.rotation, piece.x, piece.y);
}
