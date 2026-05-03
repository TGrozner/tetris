import { useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onHold: () => void;
  onPause: () => void;
  onRestart: () => void;
  onStart: () => void;
}

export interface KeyboardOptions {
  dasMs?: number;
  arrMs?: number;
  enabled?: boolean;
}

interface AutoRepeatState {
  key: 'left' | 'right' | 'down' | null;
  startTime: number;
  lastFire: number;
}

export function useKeyboard(handlers: KeyboardHandlers, options: KeyboardOptions = {}): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const { dasMs = 170, arrMs = 50, enabled = true } = options;
  const stateRef = useRef<AutoRepeatState>({ key: null, startTime: 0, lastFire: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const tickRepeat = (now: number) => {
      const s = stateRef.current;
      if (s.key) {
        const elapsed = now - s.startTime;
        if (elapsed >= dasMs) {
          if (now - s.lastFire >= arrMs) {
            if (s.key === 'left') handlersRef.current.onMoveLeft();
            else if (s.key === 'right') handlersRef.current.onMoveRight();
            else if (s.key === 'down') handlersRef.current.onSoftDrop();
            s.lastFire = now;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tickRepeat);
    };
    rafRef.current = requestAnimationFrame(tickRepeat);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key;
      if (key === 'ArrowLeft') {
        handlersRef.current.onMoveLeft();
        stateRef.current = { key: 'left', startTime: performance.now(), lastFire: performance.now() };
        e.preventDefault();
      } else if (key === 'ArrowRight') {
        handlersRef.current.onMoveRight();
        stateRef.current = { key: 'right', startTime: performance.now(), lastFire: performance.now() };
        e.preventDefault();
      } else if (key === 'ArrowDown') {
        handlersRef.current.onSoftDrop();
        stateRef.current = { key: 'down', startTime: performance.now(), lastFire: performance.now() };
        e.preventDefault();
      } else if (key === 'ArrowUp' || key === 'x' || key === 'X') {
        handlersRef.current.onRotateCW();
        e.preventDefault();
      } else if (key === 'z' || key === 'Z' || key === 'Control') {
        handlersRef.current.onRotateCCW();
        e.preventDefault();
      } else if (key === ' ') {
        handlersRef.current.onHardDrop();
        e.preventDefault();
      } else if (key === 'c' || key === 'C' || key === 'Shift') {
        handlersRef.current.onHold();
        e.preventDefault();
      } else if (key === 'p' || key === 'P' || key === 'Escape') {
        handlersRef.current.onPause();
        e.preventDefault();
      } else if (key === 'r' || key === 'R') {
        handlersRef.current.onRestart();
        e.preventDefault();
      } else if (key === 'Enter') {
        handlersRef.current.onStart();
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const s = stateRef.current;
      if (
        (key === 'ArrowLeft' && s.key === 'left') ||
        (key === 'ArrowRight' && s.key === 'right') ||
        (key === 'ArrowDown' && s.key === 'down')
      ) {
        stateRef.current = { key: null, startTime: 0, lastFire: 0 };
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [dasMs, arrMs, enabled]);
}
