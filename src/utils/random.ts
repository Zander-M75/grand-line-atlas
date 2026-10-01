/**
 * Deterministic randomness, so generated details (the Red Line's cliffs, island jitter)
 * come out identical on every load and every data build. No imports: Node scripts use it too.
 */

/** Seeded pseudo-random numbers in [0, 1) (mulberry32): same seed, same sequence. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random sequence seeded by a string (FNV-1a hash), e.g. one per island id. */
export function randomFor(key: string): () => number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return seededRandom(hash);
}
