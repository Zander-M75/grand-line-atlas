/**
 * Moving along a curve at a steady speed.
 *
 * A Bezier piece isn't parameterized by distance: t = 0.5 is rarely halfway along it, so
 * stepping t evenly would make the ship speed up and slow down with the curve's shape. A track
 * measures its pieces once, as a table of distances at evenly spaced t values, and answers
 * "where is the point this far along?" by looking the distance up in that table.
 *
 * It's plain math on points (no DOM), so the ship's course and the route's drawing can be
 * worked out, and tested, anywhere.
 */
import { direction, distance, pathData, type CubicSegment, type Point } from './spline';

/** Samples per Bezier piece: enough to measure a leg to within a fraction of a pixel. */
const SAMPLES = 32;

export interface Track {
  start: Point;
  segments: CubicSegment[];
  /**
   * Distance along the track at each sample. Sample k sits at t = (k / SAMPLES) mod 1 of
   * piece floor(k / SAMPLES); the last one is the end of the last piece.
   */
  lengths: number[];
  length: number;
}

export function buildTrack(start: Point, segments: CubicSegment[]): Track {
  const lengths = [0];
  let previous = start;
  let length = 0;
  for (const segment of segments) {
    for (let k = 1; k <= SAMPLES; k++) {
      const point = bezierPoint(segment, k / SAMPLES);
      length += distance(previous, point);
      lengths.push(length);
      previous = point;
    }
  }
  return { start, segments, lengths, length };
}

/** The point `along` pixels from the track's start (clamped to the track). */
export function pointAt(track: Track, along: number): Point {
  const located = locate(track, along);
  return located ? bezierPoint(located.segment, located.t) : track.start;
}

/** The unit direction of travel `along` pixels from the start. */
export function headingAt(track: Track, along: number): Point {
  const located = locate(track, along);
  if (!located) return EAST;
  const { segment, t } = located;
  return direction(ORIGIN, bezierVelocity(segment, t)) ?? direction(segment[0], segment[3]) ?? EAST;
}

/** SVG path data for the stretch of the track from its start to `along` pixels in. */
export function partialPath(track: Track, along: number): string {
  if (along <= 0) return '';
  const located = locate(track, along);
  if (!located) return '';
  const { index, segment, t } = located;
  return pathData(track.start, [...track.segments.slice(0, index), splitBezier(segment, t)]);
}

// ---------------------------------------------------------------------------

const ORIGIN: Point = { x: 0, y: 0 };
const EAST: Point = { x: 1, y: 0 };

/** Which piece a distance falls in, and where in it. Undefined for a track with no pieces. */
function locate(
  track: Track,
  along: number,
): { index: number; segment: CubicSegment; t: number } | undefined {
  const { lengths, segments } = track;
  if (segments.length === 0) return undefined;
  const target = Math.min(Math.max(along, 0), track.length);

  // The last sample at or before the target, by binary search.
  let low = 0;
  let high = lengths.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if ((lengths[middle] ?? 0) <= target) low = middle;
    else high = middle;
  }
  const from = lengths[low] ?? 0;
  const span = (lengths[high] ?? from) - from;
  const u = (low + (span > 0 ? (target - from) / span : 0)) / SAMPLES;

  const index = Math.min(Math.floor(u), segments.length - 1);
  const segment = segments[index];
  return segment && { index, segment, t: u - index };
}

function bezierPoint([p0, c1, c2, p3]: CubicSegment, t: number): Point {
  const s = 1 - t;
  const a = s * s * s;
  const b = 3 * s * s * t;
  const c = 3 * s * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p3.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p3.y,
  };
}

/** The curve's derivative at t: its direction of travel, scaled by its speed. */
function bezierVelocity([p0, c1, c2, p3]: CubicSegment, t: number): Point {
  const s = 1 - t;
  const a = 3 * s * s;
  const b = 6 * s * t;
  const c = 3 * t * t;
  return {
    x: a * (c1.x - p0.x) + b * (c2.x - c1.x) + c * (p3.x - c2.x),
    y: a * (c1.y - p0.y) + b * (c2.y - c1.y) + c * (p3.y - c2.y),
  };
}

/** The first part of a Bezier piece, up to t (de Casteljau's construction). */
function splitBezier([p0, c1, c2, p3]: CubicSegment, t: number): CubicSegment {
  const lerp = (a: Point, b: Point): Point => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const p01 = lerp(p0, c1);
  const p12 = lerp(c1, c2);
  const p23 = lerp(c2, p3);
  const p012 = lerp(p01, p12);
  const p123 = lerp(p12, p23);
  return [p0, p01, p012, lerp(p012, p123)];
}
