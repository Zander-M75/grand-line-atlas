/**
 * What the route and ship do when the timeline moves: the pure decisions, kept apart from the
 * GSAP and DOM code in src/map/Voyage.tsx so they can be tested.
 *
 * - One step forward: the new arc's legs draw in and the ship sails along them.
 * - One step back: the legs of the arc being left un-draw, and the ship sails back.
 * - A jump: everything in between snaps, and only the final arc's legs animate.
 * - Anything else (filler toggled, spoiler limit changed, reduced motion): snap.
 */
import { TIMING } from '@/config';
import type { Journey, LegShape } from '@/map/journey';
import type { MapPoint } from '@/map/coords';
import type { Arc } from '@/types';

/** The map at one moment: the arcs it was drawn from, and the journey at the current arc. */
export interface VoyageView {
  arcs: Arc[];
  journey: Journey;
}

export type VoyageMotion =
  | { kind: 'snap' }
  /**
   * Draw `legs` (the current arc's) and sail along them. `from` is the leg the ship was moored
   * on before they start, if any.
   */
  | { kind: 'sail'; legs: LegShape[]; from?: LegShape }
  /** Un-draw `legs` (the arc being left), and sail back to the mooring on `to`, if any. */
  | { kind: 'unsail'; legs: LegShape[]; to?: LegShape };

export const SNAP: VoyageMotion = { kind: 'snap' };

export function planVoyageMotion(previous: VoyageView | null, next: VoyageView): VoyageMotion {
  // A different list of arcs (filler toggled, limit changed) reshapes legs: nothing to tween.
  if (!previous || previous.arcs !== next.arcs) return SNAP;
  const before = previous.journey.arc.order;
  const after = next.journey.arc.order;
  const nextLegs = next.journey.legs.map(({ shape }) => shape);

  if (after > before) {
    const index = nextLegs.findIndex(({ leg }) => leg.arcOrder === after);
    if (index < 0) return SNAP;
    return { kind: 'sail', legs: nextLegs.slice(index), from: nextLegs[index - 1] };
  }

  if (after < before) {
    const leaving = previous.journey.legs
      .map(({ shape }) => shape)
      .filter(({ leg }) => leg.arcOrder > after);
    // Only the arc being left un-draws; a longer jump back just snaps.
    if (leaving.length === 0 || leaving.some(({ leg }) => leg.arcOrder !== before)) return SNAP;
    return { kind: 'unsail', legs: leaving, to: nextLegs.at(-1) };
  }

  return SNAP;
}

/** How long drawing `length` map pixels of route takes, in seconds. */
export function drawDuration(length: number): number {
  return Math.min(
    Math.max(length / TIMING.routeDrawPxPerSecond, TIMING.routeDrawMin),
    TIMING.routeDrawMax,
  );
}

/**
 * The legs of a move whose camera move is one of the voyage's big crossings (CAMERA.dramatic):
 * true if any leg arrives at or leaves one of those places.
 */
export function isDramatic(
  legs: LegShape[],
  dramatic: { arriving: readonly string[]; leaving: readonly string[] },
): boolean {
  return legs.some(
    ({ leg }) =>
      dramatic.arriving.includes(leg.toLocationId) || dramatic.leaving.includes(leg.fromLocationId),
  );
}

// ---------------------------------------------------------------------------
// Courses: the path the ship follows, across one or more legs.

/** A stretch of one path, from `start` to `end` along it (in map pixels). */
export interface CourseSection {
  start: number;
  end: number;
  pointAt(distance: number): MapPoint;
}

export interface Course {
  length: number;
  /** Where the ship is `distance` along the course, and the unit vector it's heading. */
  at(distance: number): { point: MapPoint; heading: MapPoint };
}

/** How far ahead and behind a point to look when working out the heading, in map pixels. */
const HEADING_SPAN = 2;

/** Joins sections end to end into one course. */
export function course(sections: CourseSection[]): Course {
  const lengths = sections.map(({ start, end }) => Math.max(end - start, 0));
  const length = lengths.reduce((sum, value) => sum + value, 0);

  function locate(distance: number): MapPoint {
    let remaining = Math.min(Math.max(distance, 0), length);
    for (const [i, section] of sections.entries()) {
      const sectionLength = lengths[i] ?? 0;
      if (remaining <= sectionLength || i === sections.length - 1) {
        return section.pointAt(section.start + Math.min(remaining, sectionLength));
      }
      remaining -= sectionLength;
    }
    return { x: 0, y: 0 };
  }

  return {
    length,
    at(distance) {
      const point = locate(distance);
      const behind = locate(distance - HEADING_SPAN);
      const ahead = locate(distance + HEADING_SPAN);
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;
      const size = Math.hypot(dx, dy);
      return { point, heading: size > 0 ? { x: dx / size, y: dy / size } : { x: 1, y: 0 } };
    },
  };
}

// ---------------------------------------------------------------------------
// The ship's pose on screen.

/** The most the ship tilts with its heading, in degrees. It's a side view, so it never rolls far. */
export const MAX_TILT = 35;

/**
 * The CSS transform that points the ship (drawn facing east) along `heading`: mirrored when
 * heading west, then tilted toward the heading, up to MAX_TILT.
 */
export function shipTransform(heading: MapPoint): string {
  const west = heading.x < 0;
  let degrees = (Math.atan2(heading.y, heading.x) * 180) / Math.PI;
  if (west) degrees = degrees > 0 ? degrees - 180 : degrees + 180;
  const tilt = Math.round(Math.min(Math.max(degrees, -MAX_TILT), MAX_TILT) * 10) / 10;
  // (+ 0 turns -0 into 0, so a level ship reads "rotate(0deg)".)
  return `rotate(${tilt + 0}deg)${west ? ' scaleX(-1)' : ''}`;
}
