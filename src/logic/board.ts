import { BOARD_HEIGHT, BOARD_WIDTH, TOTAL_HEIGHT } from './types';
import type { ActivePiece, Board, LockResult, PieceKind } from './types';
import { getPieceCells } from './pieces';

export function createEmptyBoard(): Board {
  const rows: Board = [];
  for (let y = 0; y < TOTAL_HEIGHT; y++) {
    rows.push(new Array(BOARD_WIDTH).fill(null));
  }
  return rows;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function isInsideHorizontal(x: number): boolean {
  return x >= 0 && x < BOARD_WIDTH;
}

export function isCellBlocked(board: Board, x: number, y: number): boolean {
  if (!isInsideHorizontal(x)) return true;
  if (y >= TOTAL_HEIGHT) return true;
  if (y < 0) return false;
  return board[y][x] !== null;
}

export function canPlace(board: Board, piece: ActivePiece): boolean {
  const cells = getPieceCells(piece.kind, piece.rotation, piece.x, piece.y);
  for (const [x, y] of cells) {
    if (isCellBlocked(board, x, y)) return false;
  }
  return true;
}

export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next = cloneBoard(board);
  const cells = getPieceCells(piece.kind, piece.rotation, piece.x, piece.y);
  for (const [x, y] of cells) {
    if (y < 0 || y >= TOTAL_HEIGHT) continue;
    if (x < 0 || x >= BOARD_WIDTH) continue;
    next[y][x] = piece.kind as PieceKind;
  }
  return next;
}

export function clearLines(board: Board): LockResult {
  const cleared: number[] = [];
  const remaining: Board = [];
  for (let y = 0; y < board.length; y++) {
    const row = board[y];
    if (row.every((c) => c !== null)) {
      cleared.push(y);
    } else {
      remaining.push(row);
    }
  }
  while (remaining.length < TOTAL_HEIGHT) {
    remaining.unshift(new Array(BOARD_WIDTH).fill(null));
  }
  return { board: remaining, linesCleared: cleared.length, clearedRows: cleared };
}

export function dropDistance(board: Board, piece: ActivePiece): number {
  let dist = 0;
  while (canPlace(board, { ...piece, y: piece.y + dist + 1 })) {
    dist++;
  }
  return dist;
}

export function ghostPiece(board: Board, piece: ActivePiece): ActivePiece {
  return { ...piece, y: piece.y + dropDistance(board, piece) };
}

export function isAboveVisibleArea(piece: ActivePiece): boolean {
  const cells = getPieceCells(piece.kind, piece.rotation, piece.x, piece.y);
  return cells.every(([, y]) => y < TOTAL_HEIGHT - BOARD_HEIGHT);
}

export const VISIBLE_TOP = TOTAL_HEIGHT - BOARD_HEIGHT;
