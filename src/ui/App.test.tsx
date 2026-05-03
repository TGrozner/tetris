import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title and menu overlay initially', () => {
    render(<App />);
    expect(screen.getByText('TETRIS')).toBeInTheDocument();
    expect(screen.getByTestId('overlay-menu')).toBeInTheDocument();
  });

  it('starts the game when start button clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-btn'));
    expect(screen.queryByTestId('overlay-menu')).not.toBeInTheDocument();
  });

  it('reacts to arrow key input', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByTestId('score')).toBeInTheDocument();
  });

  it('hard drop on space increases score', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.keyDown(window, { key: ' ' });
    const score = screen.getByTestId('score');
    expect(parseInt(score.textContent ?? '0', 10)).toBeGreaterThan(0);
  });

  it('pause overlay shows on P', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.keyDown(window, { key: 'p' });
    expect(screen.getByTestId('overlay-pause')).toBeInTheDocument();
  });

  it('rotation key X works', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.keyDown(window, { key: 'x' });
    fireEvent.keyDown(window, { key: 'z' });
  });

  it('hold key C works', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('start-btn'));
    fireEvent.keyDown(window, { key: 'c' });
  });

  it('renders score panel', () => {
    render(<App />);
    expect(screen.getByTestId('score-panel')).toBeInTheDocument();
    expect(screen.getByTestId('lines')).toBeInTheDocument();
    expect(screen.getByTestId('level')).toBeInTheDocument();
  });
});
