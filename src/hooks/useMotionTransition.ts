import type { Transition } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

const INSTANT: Transition = { duration: 0 };

/** A Framer Motion transition that's instant when motion is reduced (PLAN.md §8). */
export function useMotionTransition(transition: Transition): Transition {
  return useReducedMotion() ? INSTANT : transition;
}
