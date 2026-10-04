import { useEffect } from 'react';
import { useAtlasStore } from '@/store';
import { REDUCED_MOTION_QUERY } from '@/utils/media';
import { useMediaQuery } from './useMediaQuery';

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
  return useMediaQuery(REDUCED_MOTION_QUERY);
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
