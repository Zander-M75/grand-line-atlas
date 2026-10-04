import { vi } from 'vitest';

/**
 * Pretends the screen matches these media queries and no others (jsdom has no matchMedia of
 * its own). `vi.unstubAllGlobals()` undoes it.
 */
export function stubMedia(...queries: string[]) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: queries.includes(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}
