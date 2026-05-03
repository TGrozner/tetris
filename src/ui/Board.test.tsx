import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Board } from './Board';
import { createEmptyBoard } from '../logic/board';

describe('Board component', () => {
  it('renders an empty board', () => {
    const { container } = render(<Board board={createEmptyBoard()} active={null} />);
    const cells = container.querySelectorAll('.cell');
    expect(cells.length).toBe(10 * 20);
  });

  it('renders an active piece', () => {
    const board = createEmptyBoard();
    const { container } = render(
      <Board board={board} active={{ kind: 'T', rotation: 0, x: 3, y: 5 }} />
    );
    const filled = container.querySelectorAll('.cell.filled');
    expect(filled.length).toBeGreaterThan(0);
  });

  it('renders ghost when active piece present', () => {
    const board = createEmptyBoard();
    const { container } = render(
      <Board board={board} active={{ kind: 'T', rotation: 0, x: 3, y: 5 }} showGhost />
    );
    const ghost = container.querySelectorAll('.cell.ghost');
    expect(ghost.length).toBeGreaterThan(0);
  });

  it('renders cleared row animation', () => {
    const board = createEmptyBoard();
    const { container } = render(
      <Board board={board} active={null} clearedRows={[2, 3]} />
    );
    const cleared = container.querySelectorAll('.cell.cleared');
    expect(cleared.length).toBeGreaterThan(0);
  });
});
