import { PIECE_COLORS, type PieceKind } from '../logic/types';
import { getPieceShape } from '../logic/pieces';

interface PiecePreviewProps {
  kind: PieceKind | null;
}

export function PiecePreview({ kind }: PiecePreviewProps) {
  const grid: (PieceKind | null)[][] = [
    [null, null, null, null],
    [null, null, null, null],
  ];
  if (kind) {
    const shape = getPieceShape(kind, 0);
    for (const [x, y] of shape) {
      if (y < 2 && x < 4) grid[y][x] = kind;
    }
  }
  const cells: JSX.Element[] = [];
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 4; x++) {
      const c = grid[y][x];
      cells.push(
        <div
          key={`${x},${y}`}
          className={c ? 'preview-cell filled' : 'preview-cell'}
          style={c ? { background: PIECE_COLORS[c] } : undefined}
        />
      );
    }
  }
  return <div className="preview-grid">{cells}</div>;
}
