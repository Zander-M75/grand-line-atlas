/**
 * Framer Motion settings shared by the panels and cards. With reduced motion every transition
 * takes no time (PLAN.md §8): things still appear and disappear, just without moving.
 */
import type { Transition } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { UI_EASE, type Bezier } from './easing';

export function useUiTransition() {
  const reduced = useReducedMotion();
  return (duration: number, ease: Bezier = UI_EASE.enter): Transition =>
    reduced ? { duration: 0 } : { duration, ease };
}
