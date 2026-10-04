/**
 * How the ship sits on the water: where it's drawn relative to its point on the route, which
 * way it faces, and how far it pitches.
 *
 * The ship is drawn side-on, so it can't simply rotate to any heading (sailing north would
 * stand it on its stern). Instead it faces east or west, mirrored as needed, and tilts toward
 * its course up to a limit.
 */
import type { MapPoint } from '@/map/coords';

/** How far behind its point on the route the ship's hull sits, in screen pixels. */
export const SHIP_TRAIL = 30;

/** Roughly where the stern is, behind the hull's middle, in screen pixels: wake starts here. */
export const SHIP_STERN = 18;

/** The steepest the ship pitches toward its course, in degrees. */
const MAX_TILT = 32;

/**
 * Below this much east-west travel (as a fraction of the heading), a sailing ship keeps the
 * way it was facing, so a course running straight north or south doesn't flip it to and fro.
 */
const TURN_THRESHOLD = 0.2;

export type Facing = 'east' | 'west';

export function facingFor(heading: MapPoint, current?: Facing): Facing {
  if (current && Math.abs(heading.x) < TURN_THRESHOLD) return current;
  return heading.x < 0 ? 'west' : 'east';
}

/**
 * The CSS transform for a ship drawn facing east with its hull's middle on the route: moved
 * back along `heading`, tilted toward it, and mirrored if it faces west. Rotation is around
 * the hull's middle (the icon's transform-origin).
 */
export function shipTransform(heading: MapPoint, facing: Facing): string {
  const west = facing === 'west';
  // With the ship mirrored, its bow points the other way, so the angle is measured from west.
  const angle = west ? Math.atan2(-heading.y, -heading.x) : Math.atan2(heading.y, heading.x);
  const tilt = clamp((angle * 180) / Math.PI, -MAX_TILT, MAX_TILT);
  const dx = -heading.x * SHIP_TRAIL;
  const dy = -heading.y * SHIP_TRAIL;
  return `translate(${round(dx)}px, ${round(dy)}px) rotate(${round(tilt)}deg) scaleX(${west ? -1 : 1})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
