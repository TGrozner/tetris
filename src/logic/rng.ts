import type { PieceKind } from './types';
import { ALL_PIECES } from './pieces';

export type RandomFn = () => number;

export function shuffleBag(rand: RandomFn = Math.random): PieceKind[] {
  const bag: PieceKind[] = ALL_PIECES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

export class BagRandomizer {
  private queue: PieceKind[] = [];
  constructor(private rand: RandomFn = Math.random) {
    this.refill();
  }
  private refill(): void {
    this.queue.push(...shuffleBag(this.rand));
  }
  next(): PieceKind {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }
  peek(n: number): PieceKind[] {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }
}

// Mulberry32 PRNG for deterministic tests
export function mulberry32(seed: number): RandomFn {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
