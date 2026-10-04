/**
 * Media queries, read and watched outside React (the store reads one before the first render;
 * useMediaQuery wraps these for components).
 */

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function matchesMedia(query: string): boolean {
  return window.matchMedia?.(query).matches ?? false;
}

export function watchMedia(query: string, onChange: () => void): () => void {
  const list = window.matchMedia?.(query);
  list?.addEventListener('change', onChange);
  return () => list?.removeEventListener('change', onChange);
}
