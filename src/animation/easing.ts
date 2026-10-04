/**
 * Easing curves, named by what they're for. GSAP takes its own ease names; Framer Motion
 * takes cubic-bezier control points. Durations live in TIMING (src/config.ts).
 */

export const GSAP_EASE = {
  /** A ship gathering way out of port and easing into the next. */
  sail: 'power1.inOut',
  /** The intro's coastlines drawing in. */
  reveal: 'power2.inOut',
  /** Things fading out of view. */
  fade: 'power1.out',
} as const;

export const MOTION_EASE = {
  /** Panels arriving: fast out of the gate, settling gently. */
  enter: [0.22, 1, 0.36, 1],
  /** Panels leaving: quick and unfussy. */
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, [number, number, number, number]>;
