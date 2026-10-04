/**
 * What the map shows at one point on the timeline: the legs sailed so far, where the ship
 * is, how each island reads, and what the camera should keep in view.
 *
 * Everything here derives from the arcs on the timeline (all of them, or canon only) and
 * the current arc, so toggling filler or moving the slider is just a new call.
 */
import { locationById, locations, waypointsByKey } from '@/data';
import { routeKey, sideLegs, voyageLegs, voyageStops, type Leg } from '@/data/voyage';
import type { Arc, Location } from '@/types';
import { pathData, splineSegments } from '@/utils/spline';
import { buildTrack, headingAt, type Track } from '@/utils/track';
import type { MapPoint } from './coords';

/** A leg drawn on the map. */
export interface LegShape {
  leg: Leg;
  /** The leg's start, its hand-drawn bends, and its end, in map pixels. */
  points: MapPoint[];
  /** SVG path data: a smooth curve through `points`, in map pixels. */
  d: string;
  /** The same curve, measured, for sailing along it (see src/utils/track.ts). */
  track: Track;
  /** Unit vector of the ship's travel as it arrives at the end of the leg. */
  arrival: MapPoint;
}

export type LegState = 'traveled' | 'current';

/**
 * current: a stop in the current arc. away: where the current arc happens, when it doesn't
 * follow the ship. visited: reached by an earlier arc. ahead: reached by a later arc.
 */
export type IslandState = 'current' | 'away' | 'visited' | 'ahead';

const STATE_NAMES: Record<IslandState, string> = {
  current: 'this arc',
  away: 'this arc, away from the ship',
  visited: 'visited',
  ahead: 'ahead',
};

/** What screen readers call an island: "Syrup Village, visited", "Goat Island, ahead, anime-only". */
export function islandLabel(location: Location, state?: IslandState): string {
  return [location.name, state && STATE_NAMES[state], location.animeOnly && 'anime-only']
    .filter(Boolean)
    .join(', ');
}

export interface ShipPose {
  /** The island the ship is moored at. */
  at: MapPoint;
  /** Unit vector of the ship's travel when it got there. */
  heading: MapPoint;
}

export interface Journey {
  arc: Arc;
  /**
   * Every leg on this timeline, ahead or not: the ship's, then any side route. It's the same
   * array for every arc on one timeline, so two journeys share a voyage exactly when it's
   * identical.
   */
  voyage: LegShape[];
  /** Legs drawn up to and including the current arc. Legs still ahead are left out. */
  legs: { shape: LegShape; state: LegState }[];
  ship: ShipPose | null;
  /** Every island some arc on the timeline visits. */
  islands: { location: Location; state: IslandState }[];
  /** Points the camera keeps in view for this arc. */
  focus: MapPoint[];
}

/** With no legs at all, the ship faces east, the way the voyage reads across the map. */
const EAST: MapPoint = { x: 1, y: 0 };

export function journeyAt(arcs: Arc[], arc: Arc): Journey {
  const voyage = voyageShapes(arcs);
  const legs = voyage
    .filter(({ leg }) => leg.arcOrder <= arc.order)
    .map((shape) => ({
      shape,
      state: shape.leg.arcOrder === arc.order ? ('current' as const) : ('traveled' as const),
    }));

  // Off-route arcs and arcs with no place leave the ship at its last stop. Before it has
  // sailed anywhere, it faces the way its first leg will take it.
  const lastStop = voyageStops(arcs).findLast((stop) => stop.arcOrder <= arc.order);
  const firstLeg = voyage[0];
  const lastSailed = legs.findLast(({ shape }) => !shape.leg.side);
  const ship = lastStop && {
    at: positionOf(lastStop.locationId),
    heading: lastSailed?.shape.arrival ?? (firstLeg ? headingAt(firstLeg.track, 0) : EAST),
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

  return { arc, voyage, legs, ship: ship ?? null, islands, focus };
}

// ---------------------------------------------------------------------------
// Leg geometry, computed once for each list of arcs (with filler, and canon only).

const shapesByArcs = new WeakMap<Arc[], LegShape[]>();

export function voyageShapes(arcs: Arc[]): LegShape[] {
  let shapes = shapesByArcs.get(arcs);
  if (!shapes) {
    // A side route is a curve of its own: it shouldn't bend the ship's route, or be bent by it.
    shapes = [...legShapes(voyageLegs(arcs)), ...legShapes(sideLegs(arcs))];
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
    const [start = positionOf(leg.fromLocationId)] = points;
    const segments = splineSegments(points, {
      before: pointsByLeg[i - 1]?.at(-2),
      after: pointsByLeg[i + 1]?.[1],
    });
    const track = buildTrack(start, segments);
    return {
      leg,
      points,
      d: pathData(start, segments),
      track,
      // The same direction the ship has when it sails in, so it moors without turning.
      arrival: headingAt(track, track.length),
    };
  });
}

function positionOf(locationId: string): MapPoint {
  const location = locationById.get(locationId);
  if (!location) throw new Error(`Unknown location "${locationId}"`);
  return { x: location.x, y: location.y };
}
