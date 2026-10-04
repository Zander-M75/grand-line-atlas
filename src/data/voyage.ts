/**
 * The voyage: where the crew's ship sails, derived from whichever arcs are on the timeline.
 * Hiding anime-only arcs just means passing fewer arcs in, so the canon islands on either
 * side of a filler detour connect directly.
 *
 * The data scripts use this too (build-route, validate-data), so it stays free of browser
 * APIs and its imports carry explicit `.ts` extensions.
 */
import type { Arc } from '../types.ts';

/** A place the ship puts in at, and the arc that takes it there. */
export interface Stop {
  locationId: string;
  arcId: string;
  arcOrder: number;
  filler: boolean;
}

/** One leg of the voyage: the ship sailing from one stop to the next. */
export interface Leg {
  fromLocationId: string;
  toLocationId: string;
  /** The arc this leg leads into. */
  arcId: string;
  arcOrder: number;
  /** Starts or ends at an anime-only stop, so the canon-only voyage never sails it. */
  filler: boolean;
  /** Part of a side route (see sideLegs): drawn, but the ship never sails it. */
  side?: boolean;
}

/**
 * Every stop the ship makes, in order. Off-route arcs (the story follows someone else, or
 * looks back in time) don't move the ship, and neither do arcs that name no place.
 */
export function voyageStops(arcs: Arc[]): Stop[] {
  return arcs
    .filter((arc) => !arc.offRoute)
    .flatMap((arc) =>
      arc.locationIds.map((locationId) => ({
        locationId,
        arcId: arc.id,
        arcOrder: arc.order,
        filler: arc.filler,
      })),
    );
}

/** The legs between consecutive stops. Staying put (Return to Sabaody) isn't a leg. */
export function voyageLegs(arcs: Arc[]): Leg[] {
  const legs: Leg[] = [];
  let previous: Stop | undefined;
  for (const stop of voyageStops(arcs)) {
    if (previous && previous.locationId !== stop.locationId) {
      legs.push({
        fromLocationId: previous.locationId,
        toLocationId: stop.locationId,
        arcId: stop.arcId,
        arcOrder: stop.arcOrder,
        filler: previous.filler || stop.filler,
      });
    }
    previous = stop;
  }
  return legs;
}

/**
 * The legs of a side route: Luffy's own path while the story follows him away from the ship
 * (arcs marked `sideRoute`, the Summit War). It sets out from where the ship waits and runs
 * through each side-route arc's places, until the ship puts in somewhere again.
 */
export function sideLegs(arcs: Arc[]): Leg[] {
  const legs: Leg[] = [];
  let shipAt: string | undefined;
  let luffyAt: string | undefined;
  for (const arc of arcs) {
    if (!arc.offRoute && arc.locationIds.length) {
      shipAt = arc.locationIds.at(-1);
      luffyAt = undefined;
    }
    if (!arc.sideRoute) continue;
    for (const locationId of arc.locationIds) {
      const from = luffyAt ?? shipAt;
      if (from && from !== locationId) {
        legs.push({
          fromLocationId: from,
          toLocationId: locationId,
          arcId: arc.id,
          arcOrder: arc.order,
          filler: arc.filler,
          side: true,
        });
      }
      luffyAt = locationId;
    }
  }
  return legs;
}

/** How route.json entries are looked up: one key per directed connection. */
export function routeKey(fromLocationId: string, toLocationId: string): string {
  return `${fromLocationId}>${toLocationId}`;
}
