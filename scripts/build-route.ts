/**
 * Builds data/generated/route.json: every leg the ship sails, both with anime-only arcs shown
 * and with them hidden, and every leg of Luffy's side route (see sideLegs), plus the
 * hand-drawn bends from scripts/sources/waypoints.ts.
 *
 *   npm run data:build   (runs it last)
 *
 * The app works out the route itself from whichever arcs are visible (src/data/voyage.ts).
 * route.json is where each connection's bends live, so it needs an entry for every leg in
 * both modes: hiding filler reconnects canon islands directly (Loguetown → Reverse Mountain
 * instead of Loguetown → Warship Island → Reverse Mountain). validate-data checks coverage.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { routeKey, sideLegs, voyageLegs, type Leg } from '../src/data/voyage';
import type { Arc, RouteSegment } from '../src/types';
import { GENERATED_DIR } from './lib/paths';
import { BENDS } from './sources/waypoints';

const arcs = JSON.parse(await readFile(path.join(GENERATED_DIR, 'arcs.json'), 'utf8')) as Arc[];

const legs = new Map<string, Leg>();
const canon = arcs.filter((arc) => !arc.filler);
const drawn = [voyageLegs(arcs), voyageLegs(canon), sideLegs(arcs), sideLegs(canon)].flat();
for (const leg of drawn) {
  const key = routeKey(leg.fromLocationId, leg.toLocationId);
  const seen = legs.get(key);
  if (seen && seen.arcId !== leg.arcId) {
    // A connection leads into the arc of the place it reaches, whichever arcs are shown.
    throw new Error(`${key} leads into ${seen.arcId} with filler and ${leg.arcId} without`);
  }
  legs.set(key, leg);
}

const bends = new Map(BENDS.map((bend) => [routeKey(bend.from, bend.to), bend]));
for (const key of bends.keys()) {
  if (!legs.has(key)) console.warn(`  warning: bend ${key} matches no leg; update waypoints.ts`);
}

// In voyage order: by arc, then by where in the arc each leg arrives.
const arcById = new Map(arcs.map((arc) => [arc.id, arc]));
const stopIndex = (leg: Leg) => arcById.get(leg.arcId)?.locationIds.indexOf(leg.toLocationId) ?? 0;

const route: RouteSegment[] = [...legs.entries()]
  .sort(([, a], [, b]) => a.arcOrder - b.arcOrder || stopIndex(a) - stopIndex(b))
  .map(([key, leg]) => {
    const bend = bends.get(key);
    return {
      fromLocationId: leg.fromLocationId,
      toLocationId: leg.toLocationId,
      arcId: leg.arcId,
      ...(bend && { waypoints: bend.waypoints }),
    };
  });

await writeFile(path.join(GENERATED_DIR, 'route.json'), JSON.stringify(route, null, 2) + '\n');

const fillerOnly = [...legs.values()].filter((leg) => leg.filler).length;
const bent = route.filter((segment) => segment.waypoints).length;
console.log(
  `Wrote ${route.length} route segments (${fillerOnly} only sailed with anime-only arcs shown, ` +
    `${bent} with bends).`,
);
