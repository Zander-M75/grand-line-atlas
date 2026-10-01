/**
 * What the map shows at one point on the timeline: the legs sailed so far, where the ship
 * is, how each island reads, and what the camera should keep in view.
 *
 * Everything here derives from the arcs on the timeline (all of them, or canon only) and
 * the current arc, so toggling filler or moving the slider is just a new call.
 */
import { locationById, locations, waypointsByKey } from '@/data';
import { routeKey, voyageLegs, voyageStops, type Leg } from '@/data/voyage';
import type { Arc, Location } from '@/types';
import { catmullRomControls, direction, splinePath } from '@/utils/spline';
import type { MapPoint } from './coords';

/** A leg drawn on the map. */
export interface LegShape {
  leg: Leg;
  /** The leg's start, its hand-drawn bends, and its end, in map pixels. */
  points: MapPoint[];
  /** SVG path data: a smooth curve through `points`, in map pixels. */
  d: string;
  /** Unit vector of the ship's travel as it arrives at the end of the leg. */
  arrival: MapPoint;
}

export type LegState = 'traveled' | 'current';

/**
 * current: a stop in the current arc. away: where the current arc happens, when it doesn't
 * follow the ship. visited: reached by an earlier arc. ahead: reached by a later arc.
 */
export type IslandState = 'current' | 'away' | 'visited' | 'ahead';

export interface ShipPose {
  /** The island the ship is moored at. */
  at: MapPoint;
  /** Unit vector of the ship's travel when it got there. */
  heading: MapPoint;
}

export interface Journey {
  arc: Arc;
  /** Legs sailed up to and including the current arc. Legs still ahead are left out. */
  legs: { shape: LegShape; state: LegState }[];
  ship: ShipPose | null;
  /** Every island some arc on the timeline visits. */
  islands: { location: Location; state: IslandState }[];
  /** Points the camera keeps in view for this arc. */
  focus: MapPoint[];
}

/** Before the first leg, the ship faces east, the way the voyage reads across the map. */
const EAST: MapPoint = { x: 1, y: 0 };

export function journeyAt(arcs: Arc[], arc: Arc): Journey {
  const legs = voyageShapes(arcs)
    .filter(({ leg }) => leg.arcOrder <= arc.order)
    .map((shape) => ({
      shape,
      state: shape.leg.arcOrder === arc.order ? ('current' as const) : ('traveled' as const),
    }));

  // Off-route arcs and arcs with no place leave the ship at its last stop.
  const lastStop = voyageStops(arcs).findLast((stop) => stop.arcOrder <= arc.order);
  const ship = lastStop && {
    at: positionOf(lastStop.locationId),
    heading: legs.at(-1)?.shape.arrival ?? EAST,
  };

  const onTimeline = new Set(arcs.flatMap((a) => a.locationIds));
  const here = new Set(arc.locationIds);
  const seen = new Set(arcs.filter((a) => a.order < arc.order).flatMap((a) => a.locationIds));
  const islands = locations
    .filter((location) => onTimeline.has(location.id))
    .map((location) => ({ location, state: islandState(location.id) }));

  function islandState(id: string): IslandState {
    if (here.has(id)) return arc.offRoute ? 'away' : 'current';
    return seen.has(id) ? 'visited' : 'ahead';
  }

  const focus = [
    ...legs.filter(({ state }) => state === 'current').flatMap(({ shape }) => shape.points),
    ...arc.locationIds.map(positionOf),
  ];
  if (focus.length === 0 && ship) focus.push(ship.at);

  return { arc, legs, ship: ship ?? null, islands, focus };
}

// ---------------------------------------------------------------------------
// Leg geometry, computed once for each list of arcs (with filler, and canon only).

const shapesByArcs = new WeakMap<Arc[], LegShape[]>();

export function voyageShapes(arcs: Arc[]): LegShape[] {
  let shapes = shapesByArcs.get(arcs);
  if (!shapes) {
    shapes = legShapes(voyageLegs(arcs));
    shapesByArcs.set(arcs, shapes);
  }
  return shapes;
}

/**
 * The whole voyage is one smooth curve, cut into legs at each island: every leg curves using
 * its neighbors' points, so the route flows through islands instead of kinking at them.
 */
function legShapes(legs: Leg[]): LegShape[] {
  const pointsByLeg = legs.map((leg) => [
    positionOf(leg.fromLocationId),
    ...(waypointsByKey.get(routeKey(leg.fromLocationId, leg.toLocationId)) ?? []).map(([x, y]) => ({
      x,
      y,
    })),
    positionOf(leg.toLocationId),
  ]);

  return legs.map((leg, i) => {
    const points = pointsByLeg[i] ?? [];
    const before = pointsByLeg[i - 1]?.at(-2);
    const after = pointsByLeg[i + 1]?.[1];
    return {
      leg,
      points,
      d: splinePath(points, { before, after }),
      arrival: arrival([before, ...points, after]),
    };
  });
}

/**
 * The curve's direction where the leg ends (the tangent of its last piece), given the leg's
 * points with its outside neighbors on each end. Falls back to the straight line in.
 */
function arrival(points: (MapPoint | undefined)[]): MapPoint {
  const [previous, end, after] = points.slice(-3);
  if (!previous || !end) return EAST;
  const [, control] = catmullRomControls(points.at(-4), previous, end, after);
  return direction(control, end) ?? direction(previous, end) ?? EAST;
}

function positionOf(locationId: string): MapPoint {
  const location = locationById.get(locationId);
  if (!location) throw new Error(`Unknown location "${locationId}"`);
  return { x: location.x, y: location.y };
}
