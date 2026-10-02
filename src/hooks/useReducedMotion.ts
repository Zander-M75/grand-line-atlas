import { useEffect, useSyncExternalStore } from 'react';
import { useAtlasStore } from '@/store';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * True when motion should be kept to a minimum: the OS asks for it, or the viewer turned it
 * on in settings (PLAN.md §8). Every animated component checks this.
 */
export function useReducedMotion(): boolean {
  const fromSettings = useAtlasStore((state) => state.settings.reducedMotion);
  return useSystemReducedMotion() || fromSettings;
}

/** Just the OS setting, for Settings to explain why motion is already reduced. */
export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, systemPrefersReducedMotion, () => false);
}

/**
 * Mirrors useReducedMotion onto <html data-motion>, so CSS transitions and animations follow
 * the settings override too, not only the OS media query (see global.css).
 */
export function useMotionAttribute() {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia?.(QUERY);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/** The OS setting, read once (outside React). */
export function systemPrefersReducedMotion(): boolean {
  return window.matchMedia?.(QUERY).matches ?? false;
}
