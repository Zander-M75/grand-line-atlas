import { useSyncExternalStore } from 'react';
import { useAtlasStore } from '@/store';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * True when motion should be kept to a minimum: the OS asks for it, or the viewer turned it
 * on in settings (PLAN.md §8). Every animated component checks this.
 */
export function useReducedMotion(): boolean {
  const fromSettings = useAtlasStore((state) => state.settings.reducedMotion);
  const fromSystem = useSyncExternalStore(subscribe, systemPrefersReduced, () => false);
  return fromSettings || fromSystem;
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia?.(QUERY);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

function systemPrefersReduced(): boolean {
  return window.matchMedia?.(QUERY).matches ?? false;
}
