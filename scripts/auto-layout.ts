/**
 * Gives every location in data/generated/locations.json a starting position, worked out
 * from the zones in src/config.ts (positionSource: 'auto'). Hand-placed positions live in
 * data/overrides/positions.json and win when the app loads; this script never touches them.
 *
 *   npm run data:layout   (data:build runs it too, right after build-locations)
 *
 * The rules, in the order they run:
 *   1. The Blues: islands follow a gentle curve across their quadrant in visit order,
 *      trending toward Reverse Mountain, the gateway to the Grand Line.
 *   2. The Grand Line: Paradise islands spread evenly from Reverse Mountain to the Red Line
 *      in visit order, New World islands from the Red Line onward. They alternate above and
 *      below the centerline so neighbors' labels don't collide.
 *   3. Special cases (PLAN.md §7, Phase 3): places on the Red Line, in the Calm Belts, in the
 *      sky, or under the sea, positioned relative to the zones or to islands already placed.
 * Every random nudge is seeded by the island's id, so re-running gives the same layout.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BANDS, BLUE_QUADRANTS, MAP_HEIGHT, MAP_WIDTH, ZONES, type Quadrant } from '../src/config';
import type { Location, Region } from '../src/types';
import { randomFor } from '../src/utils/random';
import { GENERATED_DIR } from './lib/paths';

interface Point {
  x: number;
  y: number;
}

const file = path.join(GENERATED_DIR, 'locations.json');
const locations = JSON.parse(await readFile(file, 'utf8')) as Location[];
const placed = new Map<string, Point>();

const { centerX } = ZONES.redLine;
const { centerY } = ZONES.grandLine;
const middle = (band: { top: number; bottom: number }) => (band.top + band.bottom) / 2;

/** Where each special case goes. Rules may use islands placed by earlier rules. */
const SPECIAL_PLACES: Record<string, () => Point> = {
  'reverse-mountain': () => ZONES.reverseMountain,
  // Laboon's lighthouse, at the foot of Reverse Mountain on the Grand Line side.
  'twin-cape': () => ({ x: BANDS.paradise.left + 90, y: centerY + 50 }),
  // The last stop in Paradise, right against the Red Line.
  'sabaody-archipelago': () => ({ x: BANDS.redLine.left - 110, y: centerY + 50 }),
  // Marine Headquarters, across the water from Sabaody.
  marineford: () => ({ x: BANDS.redLine.left - 190, y: centerY - 70 }),
  // On top of the Red Line, where the Grand Line meets it.
  'mary-geoise': () => ({ x: centerX, y: centerY - 70 }),
  // Undersea, beneath the Red Line crossing.
  'fish-man-island': () => ({ x: centerX, y: centerY + 70 }),
  // Floating above Jaya.
  skypiea: () => {
    const jaya = at('jaya');
    return { x: jaya.x, y: Math.min(jaya.y, centerY) - 150 };
  },
  // Calm Belt islands, near Sabaody where their arcs branch off.
  'amazon-lily': () => ({ x: at('sabaody-archipelago').x - 60, y: middle(BANDS.northCalmBelt) }),
  rusukaina: () => ({ x: at('sabaody-archipelago').x - 260, y: middle(BANDS.northCalmBelt) }),
  // The prison sits between Enies Lobby and Marineford, linked to both by the Tarai Current.
  'impel-down': () => ({
    x: (at('enies-lobby').x + at('marineford').x) / 2,
    y: middle(BANDS.southCalmBelt),
  }),
};

// 1. The Blues.
for (const [blue, quadrant] of Object.entries(BLUE_QUADRANTS)) {
  alongCurve(idsInRegion(blue as Region), quadrant);
}

// 2. The Grand Line. Paradise's run stops short of the Red Line, leaving room for
// Marineford and Sabaody (special cases) against it.
spreadAlongGrandLine(
  idsInRegion('paradise'),
  ZONES.reverseMountain.x + 200,
  BANDS.redLine.left - 330,
);
spreadAlongGrandLine(
  idsInRegion('new-world'),
  BANDS.newWorld.left + 120,
  BANDS.newWorld.right - 120,
);

// 3. Special cases, then a fallback for anything no rule covers.
for (const [id, place] of Object.entries(SPECIAL_PLACES)) {
  if (locations.some((l) => l.id === id)) placed.set(id, place());
}
for (const location of locations) {
  if (!placed.has(location.id)) {
    console.warn(`No layout rule for ${location.id} (${location.region}); placed mid-map.`);
    placed.set(location.id, { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  }
}

const laidOut: Location[] = locations.map((location) => {
  const { x, y } = at(location.id);
  return { ...location, x: Math.round(x), y: Math.round(y), positionSource: 'auto' };
});
await writeFile(file, JSON.stringify(laidOut, null, 2) + '\n');

console.log(`Laid out ${laidOut.length} locations.`);
for (const l of laidOut)
  console.log(`  ${l.id.padEnd(24)} ${String(l.x).padStart(5)} ${String(l.y).padStart(5)}`);

// ---------------------------------------------------------------------------

function at(id: string): Point {
  const point = placed.get(id);
  if (!point) throw new Error(`Layout rule needs ${id}, which hasn't been placed yet`);
  return point;
}

/** Ids in a region, in visit order, leaving out the special cases. */
function idsInRegion(region: Region): string[] {
  return locations.filter((l) => l.region === region && !(l.id in SPECIAL_PLACES)).map((l) => l.id);
}

/**
 * Evenly spaced along the Grand Line, alternating above and below the centerline, each
 * nudged a little (seeded by id) so they don't sit in perfectly straight rows.
 */
function spreadAlongGrandLine(ids: string[], left: number, right: number) {
  const step = ids.length > 1 ? (right - left) / (ids.length - 1) : 0;
  ids.forEach((id, i) => {
    const random = randomFor(id);
    const side = i % 2 === 0 ? -1 : 1;
    placed.set(id, {
      x: left + step * i + (random() - 0.5) * step * 0.3,
      y: centerY + side * (35 + random() * 55),
    });
  });
}

/**
 * A curve across a Blue's quadrant, from its far corner toward Reverse Mountain: toward the
 * west edge for the western quadrants, and toward the east edge (where the map wraps around
 * to Reverse Mountain) for the eastern ones. Each island is nudged by up to 50px.
 */
function alongCurve(ids: string[], quadrant: Quadrant) {
  const west = quadrant.endsWith('w');
  const north = quadrant.startsWith('n');
  const [left, right] = west
    ? [BANDS.paradise.left, BANDS.redLine.left]
    : [BANDS.redLine.right, BANDS.newWorld.right];
  const [top, bottom] = north
    ? [0, BANDS.northCalmBelt.top]
    : [BANDS.southCalmBelt.bottom, MAP_HEIGHT];

  // Written for the north-west quadrant, then mirrored for the others.
  const flipX = (x: number) => (west ? left + x : right - x);
  const flipY = (y: number) => (north ? top + y : bottom - y);
  const width = right - left;
  const height = bottom - top;
  const start = { x: flipX(width - 160), y: flipY(height * 0.26) };
  const control = { x: flipX(width * 0.5), y: flipY(height * 0.88) };
  const end = { x: flipX(270), y: flipY(height * 0.8) };

  ids.forEach((id, i) => {
    const t = ids.length > 1 ? i / (ids.length - 1) : 0;
    const random = randomFor(id);
    const curve = (a: number, b: number, c: number) =>
      (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c;
    placed.set(id, {
      x: curve(start.x, control.x, end.x) + (random() - 0.5) * 100,
      y: curve(start.y, control.y, end.y) + (random() - 0.5) * 100,
    });
  });
}
