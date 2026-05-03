import { useCallback, useEffect, useReducer, useState } from 'react';
import { createInitialState, reduce, type Action, type GameState } from '../logic/game';
import { Board } from './Board';
import { PiecePreview } from './PiecePreview';
import { useGameLoop } from './useGameLoop';
import { useKeyboard } from './useKeyboard';

const HIGH_SCORE_KEY = 'tetris.highScore';

function loadHighScore(): number {
  try {
    const v = localStorage.getItem(HIGH_SCORE_KEY);
    return v ? Math.max(0, parseInt(v, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    /* ignore */
  }
}

function init(): GameState {
  return createInitialState({ highScore: loadHighScore() });
}

export default function App() {
  const [state, dispatch] = useReducer(reduce, undefined as unknown as GameState, init);
  const [showHelp, setShowHelp] = useState(true);

  useEffect(() => {
    if (state.score > 0 && state.score >= state.highScore) {
      saveHighScore(state.score);
    }
  }, [state.score, state.highScore]);

  useGameLoop(state.phase === 'playing', (delta) => dispatch({ type: 'tick', deltaMs: delta }));

  const send = useCallback((a: Action) => dispatch(a), []);

  useKeyboard({
    onMoveLeft: () => send({ type: 'move', dx: -1 }),
    onMoveRight: () => send({ type: 'move', dx: 1 }),
    onSoftDrop: () => send({ type: 'softDrop' }),
    onHardDrop: () => send({ type: 'hardDrop' }),
    onRotateCW: () => send({ type: 'rotate', direction: 'cw' }),
    onRotateCCW: () => send({ type: 'rotate', direction: 'ccw' }),
    onHold: () => send({ type: 'hold' }),
    onPause: () => {
      if (state.phase === 'playing') send({ type: 'pause' });
      else if (state.phase === 'paused') send({ type: 'resume' });
    },
    onRestart: () => send({ type: 'restart' }),
    onStart: () => {
      if (state.phase === 'menu' || state.phase === 'gameover') send({ type: 'start' });
      else if (state.phase === 'paused') send({ type: 'resume' });
    },
  });

  const startGame = () => {
    setShowHelp(false);
    send({ type: 'start' });
  };

  return (
    <div className="app">
      <h1>TETRIS</h1>
      <div className="layout">
        <div className="left-column">
          <div className="panel" data-testid="hold">
            <h2>Hold</h2>
            <PiecePreview kind={state.hold} />
          </div>
          <div className="panel controls-help">
            <h2>Controls</h2>
            <div>
              <kbd>←</kbd> <kbd>→</kbd> move<br />
              <kbd>↓</kbd> soft drop<br />
              <kbd>↑</kbd> / <kbd>X</kbd> rotate CW<br />
              <kbd>Z</kbd> rotate CCW<br />
              <kbd>Space</kbd> hard drop<br />
              <kbd>C</kbd> hold<br />
              <kbd>P</kbd> pause<br />
              <kbd>R</kbd> restart
            </div>
          </div>
        </div>

        <div className="board-area" style={{ position: 'relative' }}>
          <Board
            board={state.board}
            active={state.active}
            clearedRows={state.lastClearedRows}
            showGhost={state.phase === 'playing'}
          />
          {state.phase === 'menu' && (
            <div className="overlay" data-testid="overlay-menu">
              <h2>READY?</h2>
              <p>Stack the bricks. Clear the lines. Don't top out.</p>
              <button className="btn" onClick={startGame} data-testid="start-btn">
                START
              </button>
              <p>or press Enter</p>
            </div>
          )}
          {state.phase === 'paused' && (
            <div className="overlay" data-testid="overlay-pause">
              <h2>PAUSED</h2>
              <button className="btn" onClick={() => send({ type: 'resume' })}>
                RESUME
              </button>
              <p>Press P to resume</p>
            </div>
          )}
          {state.phase === 'gameover' && (
            <div className="overlay" data-testid="overlay-gameover">
              <h2>GAME OVER</h2>
              <p>Score: {state.score}</p>
              <p>Best: {state.highScore}</p>
              <button className="btn" onClick={() => send({ type: 'restart' })}>
                RESTART
              </button>
            </div>
          )}
        </div>

        <div className="right-column">
          <div className="panel" data-testid="next">
            <h2>Next</h2>
            <div className="queue-list">
              {state.queue.slice(0, 3).map((kind, i) => (
                <PiecePreview key={`${i}-${kind}`} kind={kind} />
              ))}
            </div>
          </div>
          <div className="panel" data-testid="score-panel">
            <h2>Stats</h2>
            <div className="score-row">
              <span className="label">Score</span>
              <span className="value" data-testid="score">
                {state.score}
              </span>
            </div>
            <div className="score-row">
              <span className="label">Best</span>
              <span className="value" data-testid="best-score">
                {state.highScore}
              </span>
            </div>
            <div className="score-row">
              <span className="label">Lines</span>
              <span className="value" data-testid="lines">
                {state.lines}
              </span>
            </div>
            <div className="score-row">
              <span className="label">Level</span>
              <span className="value" data-testid="level">
                {state.level}
              </span>
            </div>
          </div>
        </div>
      </div>
      {showHelp && state.phase !== 'menu' ? null : null}
    </div>
  );
}
