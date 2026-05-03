import { describe, it, expect } from 'vitest';
import { BagRandomizer, mulberry32, shuffleBag } from './rng';
import { ALL_PIECES } from './pieces';

describe('rng', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('shuffleBag returns all 7 unique pieces', () => {
    const bag = shuffleBag(mulberry32(1));
    expect(bag).toHaveLength(7);
    expect(new Set(bag).size).toBe(7);
    for (const k of ALL_PIECES) {
      expect(bag).toContain(k);
    }
  });

  it('BagRandomizer cycles through every piece in 7 draws', () => {
    const rng = new BagRandomizer(mulberry32(7));
    const drawn: string[] = [];
    for (let i = 0; i < 7; i++) drawn.push(rng.next());
    expect(new Set(drawn).size).toBe(7);
  });

  it('BagRandomizer.peek does not consume', () => {
    const rng = new BagRandomizer(mulberry32(99));
    const p = rng.peek(5);
    expect(p).toHaveLength(5);
    expect(rng.next()).toBe(p[0]);
    expect(rng.next()).toBe(p[1]);
  });

  it('BagRandomizer.peek can request beyond one bag', () => {
    const rng = new BagRandomizer(mulberry32(100));
    const p = rng.peek(14);
    expect(p).toHaveLength(14);
  });

  it('shuffleBag default arg works', () => {
    const bag = shuffleBag();
    expect(bag).toHaveLength(7);
  });
});
