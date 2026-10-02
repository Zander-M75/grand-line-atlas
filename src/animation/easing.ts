/**
 * Easing curves, by what moves. Durations live in TIMING (src/config.ts); the curves live here
 * so every animation of one kind feels the same.
 */

/** GSAP eases. */
export const EASE = {
  /** The ship and the route it draws: leaves gently, arrives gently. */
  sail: 'sine.inOut',
  /** The intro's lines and title. */
  introDraw: 'power2.inOut',
  introFade: 'power1.out',
} as const;

/** Leaflet's flyTo: lower is a gentler start and finish (Leaflet's default is 0.25). */
export const CAMERA_EASE_LINEARITY = 0.2;

export type Bezier = [number, number, number, number];

/** Framer Motion cubic-bezier curves. */
export const UI_EASE: Record<'enter' | 'exit', Bezier> = {
  /** Panels and cards settling in. */
  enter: [0.22, 1, 0.36, 1],
  /** Leaving: speeds up as it goes. */
  exit: [0.4, 0, 1, 1],
};
