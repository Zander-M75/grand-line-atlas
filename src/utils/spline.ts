/**
 * Smooth curves through points, as SVG cubic Bezier paths.
 *
 * A Catmull-Rom spline passes through every point it's given, which is what a route through
 * islands needs. This uses the centripetal variant (alpha = 0.5): unlike the uniform one, it
 * never loops or overshoots when points are unevenly spaced, as islands are. Each piece of
 * the spline converts exactly to one cubic Bezier, which SVG draws natively.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Bezier control points for the piece of the spline from p1 to p2, given the points on
 * either side (p0 before, p3 after). At the ends of a curve, pass undefined: a mirrored
 * point stands in, so the curve leaves the end heading straight for its neighbor.
 */
export function catmullRomControls(
  p0: Point | undefined,
  p1: Point,
  p2: Point,
  p3: Point | undefined,
): [Point, Point] {
  const before = p0 ?? mirror(p2, p1);
  const after = p3 ?? mirror(p1, p2);

  // Centripetal parameterization: each span is weighted by the square root of its length.
  const d1 = Math.sqrt(distance(before, p1));
  const d2 = Math.sqrt(distance(p1, p2));
  const d3 = Math.sqrt(distance(p2, after));

  // A repeated point gives the curve no direction on that side, so it stays straight.
  const c1 =
    d1 === 0 || d2 === 0
      ? p1
      : blend(
          [p2, d1 * d1],
          [before, -d2 * d2],
          [p1, 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2],
          3 * d1 * (d1 + d2),
        );
  const c2 =
    d3 === 0 || d2 === 0
      ? p2
      : blend(
          [p1, d3 * d3],
          [after, -d2 * d2],
          [p2, 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2],
          3 * d3 * (d3 + d2),
        );
  return [c1, c2];
}

/** One piece of a curve: a cubic Bezier from `start` to `end`, shaped by two control points. */
export type CubicSegment = [start: Point, control1: Point, control2: Point, end: Point];

/**
 * The cubic Bezier pieces of a smooth curve through `points`, one per pair of neighbors.
 * `before` and `after` are the points just outside this stretch when it's one part of a
 * longer curve; passing them makes neighboring parts join without a kink.
 */
export function splineSegments(
  points: Point[],
  { before, after }: { before?: Point; after?: Point } = {},
): CubicSegment[] {
  const segments: CubicSegment[] = [];
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    if (!p1 || !p2) continue;
    const p0 = i >= 2 ? points[i - 2] : before;
    const p3 = i + 1 < points.length ? points[i + 1] : after;
    segments.push([p1, ...catmullRomControls(p0, p1, p2, p3), p2]);
  }
  return segments;
}

/** SVG path commands for a smooth curve through `points` (see splineSegments). */
export function splinePath(points: Point[], neighbors?: { before?: Point; after?: Point }): string {
  const [start] = points;
  if (!start) return '';
  return pathData(start, splineSegments(points, neighbors));
}

/** SVG path commands for Bezier pieces laid end to end, starting with a move to `start`. */
export function pathData(start: Point, segments: CubicSegment[]): string {
  return [
    `M${fmt(start)}`,
    ...segments.map(([, c1, c2, end]) => `C${fmt(c1)} ${fmt(c2)} ${fmt(end)}`),
  ].join(' ');
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** The unit vector from a toward b, or undefined if they're the same point. */
export function direction(a: Point, b: Point): Point | undefined {
  const length = distance(a, b);
  return length === 0 ? undefined : { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}

/** `p` reflected through `center`. */
function mirror(p: Point, center: Point): Point {
  return { x: 2 * center.x - p.x, y: 2 * center.y - p.y };
}

/** (a·wa + b·wb + c·wc) / divisor. */
function blend(
  [a, wa]: [Point, number],
  [b, wb]: [Point, number],
  [c, wc]: [Point, number],
  divisor: number,
): Point {
  return {
    x: (a.x * wa + b.x * wb + c.x * wc) / divisor,
    y: (a.y * wa + b.y * wb + c.y * wc) / divisor,
  };
}

/** One decimal place keeps paths short with no visible rounding. */
function fmt({ x, y }: Point): string {
  return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
}
