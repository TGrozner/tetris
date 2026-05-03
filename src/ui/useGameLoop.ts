import { useEffect, useRef } from 'react';

export function useGameLoop(active: boolean, onTick: (deltaMs: number) => void): void {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const delta = t - last;
      last = t;
      if (delta > 0) {
        onTickRef.current(Math.min(delta, 100));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
