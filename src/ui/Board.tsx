import { memo } from 'react';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  PIECE_COLORS,
  TOTAL_HEIGHT,
  type ActivePiece,
  type Board as BoardType,
  type PieceKind,
} from '../logic/types';
import { getPieceCells } from '../logic/pieces';
import { ghostPiece } from '../logic/board';

const HIDDEN_ROWS = TOTAL_HEIGHT - BOARD_HEIGHT;

export interface BoardProps {
  board: BoardType;
  active: ActivePiece | null;
  showGhost?: boolean;
  clearedRows?: number[];
}

function BoardImpl({ board, active, showGhost = true, clearedRows = [] }: BoardProps) {
  const display: (PieceKind | null)[][] = board.map((row) => row.slice());
  const ghostCells = new Set<string>();
  if (active && showGhost) {
    const ghost = ghostPiece(board, active);
    for (const [x, y] of getPieceCells(ghost.kind, ghost.rotation, ghost.x, ghost.y)) {
      ghostCells.add(`${x},${y}`);
    }
  }
  const activeCells = new Set<string>();
  if (active) {
    for (const [x, y] of getPieceCells(active.kind, active.rotation, active.x, active.y)) {
      activeCells.add(`${x},${y}`);
      if (y >= 0 && y < TOTAL_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        display[y][x] = active.kind;
      }
    }
  }

  const visibleRows: JSX.Element[] = [];
  for (let y = HIDDEN_ROWS; y < TOTAL_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const cell = display[y][x];
      const key = `${x},${y}`;
      const isGhost = !cell && ghostCells.has(key);
      const isCleared = clearedRows.includes(y);
      const cls = ['cell'];
      if (cell) cls.push('filled');
      if (isGhost) cls.push('ghost');
      if (isCleared) cls.push('cleared');
      const style = cell ? { background: PIECE_COLORS[cell] } : undefined;
      visibleRows.push(
        <div
          key={key}
          className={cls.join(' ')}
          style={style}
          data-testid={`cell-${x}-${y - HIDDEN_ROWS}`}
        />
      );
    }
  }

  return (
    <div className="board-wrapper">
      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, var(--cell, 28px))` }}
        role="grid"
        aria-label="Playing field"
      >
        {visibleRows}
      </div>
    </div>
  );
}

export const Board = memo(BoardImpl);
