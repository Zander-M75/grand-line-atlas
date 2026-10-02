/**
 * The app's data: generated JSON from the data pipeline (see README, "The data"), with
 * hand-placed island positions merged over the auto layout.
 */
import type { Arc, CrewMember, Location, RouteSegment } from '@/types';
import arcsJson from '../../data/generated/arcs.json';
import crewJson from '../../data/generated/crew.json';
import locationsJson from '../../data/generated/locations.json';
import metaJson from '../../data/generated/meta.json';
import routeJson from '../../data/generated/route.json';
import positionsJson from '../../data/overrides/positions.json';
import { applyPositionOverrides } from './positions';
import { routeKey } from './voyage';

/** Every arc, sorted by first episode (the data build guarantees the order). */
export const arcs = arcsJson as Arc[];

export const locations: Location[] = applyPositionOverrides(
  locationsJson as Location[],
  positionsJson,
);

/** The Straw Hats, in the order the wiki lists them. */
export const crew = crewJson as CrewMember[];

/** When the data was built, and the last episode that had aired by then. */
export const meta = metaJson as { asOf: string; latestAiredEpisode: number; latestArcId: string };

export const arcById = new Map(arcs.map((arc) => [arc.id, arc]));
export const locationById = new Map(locations.map((location) => [location.id, location]));

/** Hand-drawn bends for each connection, keyed by routeKey(from, to). */
export const waypointsByKey = new Map(
  (routeJson as RouteSegment[]).map((segment) => [
    routeKey(segment.fromLocationId, segment.toLocationId),
    segment.waypoints ?? [],
  ]),
);

const first = arcs[0];
if (!first) throw new Error('data/generated/arcs.json has no arcs');
export const firstArc: Arc = first;
