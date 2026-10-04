import { useCallback, useSyncExternalStore } from 'react';
import { matchesMedia, watchMedia } from '@/utils/media';

/** Whether a CSS media query matches right now, updating when it changes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => watchMedia(query, onChange), [query]);
  return useSyncExternalStore(
    subscribe,
    () => matchesMedia(query),
    () => false,
  );
}
