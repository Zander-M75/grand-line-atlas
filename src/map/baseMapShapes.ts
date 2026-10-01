/**
 * Geometry for the base map's drawn details: the Red Line's ragged cliffs and hachures,
 * the graticule, the chart border, and the compass rose. Everything is generated from
 * map dimensions and a fixed seed, so the map is identical on every load.
 */
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';

type Point = [number, number];

/** Seeded pseudo-random numbers in [0, 1) (mulberry32): same seed, same sequence. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 10) / 10;
const line = ([x1, y1]: Point, [x2, y2]: Point) =>
  `M${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}`;

/**
 * A cliff edge running top to bottom near `x`. Each point drifts from the last
 * (a damped random walk), so the edge wanders instead of buzzing.
 */
function cliffEdge(x: number, random: () => number, step = 10, maxDrift = 14): Point[] {
  const points: Point[] = [];
  let drift = 0;
  for (let y = 0; y <= MAP_HEIGHT; y += step) {
    drift = Math.max(-maxDrift, Math.min(maxDrift, drift * 0.8 + (random() - 0.5) * 9));
    points.push([x + drift, y]);
  }
  return points;
}

/**
 * Short strokes from a cliff edge into the rock: the old cartographer's way of
 * drawing a steep slope. `inward` is +1 when the rock lies to the right of the edge.
 * Some edge points are skipped and lengths vary, so the strokes read as engraving
 * rather than a comb.
 */
function hachures(edge: Point[], inward: 1 | -1, random: () => number): string {
  return edge
    .filter(() => random() > 0.3)
    .map(([x, y]) => {
      const length = random() < 0.15 ? 26 + random() * 16 : 5 + random() * 14;
      return line([x, y], [x + inward * length, y + (random() - 0.5) * 4]);
    })
    .join('');
}

export interface RockBand {
  outline: string;
  hachures: string;
}

/**
 * A vertical band of Red Line rock between `left` and `right`. An edge that sits on the
 * map border (the wrap-around halves at each side) stays straight and has no hachures.
 */
export function redLineBand(left: number, right: number, seed: number): RockBand {
  const random = seededRandom(seed);
  const atWestBorder = left <= 0;
  const atEastBorder = right >= MAP_WIDTH;

  const leftEdge: Point[] = atWestBorder
    ? [
        [left, 0],
        [left, MAP_HEIGHT],
      ]
    : cliffEdge(left, random);
  const rightEdge: Point[] = atEastBorder
    ? [
        [right, 0],
        [right, MAP_HEIGHT],
      ]
    : cliffEdge(right, random);

  const outline =
    [...leftEdge, ...rightEdge.toReversed()]
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`)
      .join('') + 'Z';

  return {
    outline,
    hachures:
      (atWestBorder ? '' : hachures(leftEdge, 1, random)) +
      (atEastBorder ? '' : hachures(rightEdge, -1, random)),
  };
}

/** Grid lines every `spacing` map pixels, edge to edge. */
export function graticule(spacing: number): string {
  let d = '';
  for (let x = spacing; x < MAP_WIDTH; x += spacing) d += `M${x} 0V${MAP_HEIGHT}`;
  for (let y = spacing; y < MAP_HEIGHT; y += spacing) d += `M0 ${y}H${MAP_WIDTH}`;
  return d;
}

/**
 * The chart border's alternating bars: every other `spacing`-long stretch of each edge,
 * `depth` deep, so the border doubles as a scale matching the graticule.
 */
export function neatlineBars(spacing: number, depth: number): string {
  const bar = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  let d = '';
  for (let x = 0; x < MAP_WIDTH; x += spacing * 2) {
    d += bar(x, 0, spacing, depth) + bar(x, MAP_HEIGHT - depth, spacing, depth);
  }
  for (let y = 0; y < MAP_HEIGHT; y += spacing * 2) {
    d += bar(0, y, depth, spacing) + bar(MAP_WIDTH - depth, y, depth, spacing);
  }
  return d;
}

export interface CompassRoseShapes {
  /** Each star point is split down its spine into a lit half and a shaded half. */
  minorLit: string;
  minorShaded: string;
  majorLit: string;
  majorShaded: string;
  /** Degree ticks around the ring: every 10°, longer every 30°. */
  ticks: string;
}

/** An eight-point compass star: four long cardinal points over four short intercardinal ones. */
export function compassRose(cx: number, cy: number, radius: number): CompassRoseShapes {
  // Angles are compass bearings: 0° is north (up), increasing clockwise.
  const at = (bearing: number, distance: number): Point => {
    const rad = (bearing * Math.PI) / 180;
    return [cx + distance * Math.sin(rad), cy - distance * Math.cos(rad)];
  };
  const triangle = (a: Point, b: Point, c: Point) =>
    `M${round(a[0])} ${round(a[1])}L${round(b[0])} ${round(b[1])}L${round(c[0])} ${round(c[1])}Z`;

  const star = (bearings: number[], length: number, halfWidth: number) => {
    let lit = '';
    let shaded = '';
    for (const bearing of bearings) {
      const tip = at(bearing, length);
      lit += triangle([cx, cy], tip, at(bearing + 90, halfWidth));
      shaded += triangle([cx, cy], tip, at(bearing - 90, halfWidth));
    }
    return { lit, shaded };
  };

  const minor = star([45, 135, 225, 315], radius * 0.52, radius * 0.1);
  const major = star([0, 90, 180, 270], radius * 0.84, radius * 0.13);

  let ticks = '';
  for (let bearing = 0; bearing < 360; bearing += 10) {
    const inner = bearing % 30 === 0 ? radius * 0.88 : radius * 0.93;
    ticks += line(at(bearing, inner), at(bearing, radius));
  }

  return {
    minorLit: minor.lit,
    minorShaded: minor.shaded,
    majorLit: major.lit,
    majorShaded: major.shaded,
    ticks,
  };
}
