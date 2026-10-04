/**
 * Checks everything the app loads from data/: shape (zod schemas matching src/types.ts),
 * referential integrity, and episode logic. Exits non-zero on any error; warnings are
 * printed but don't fail the run.
 *
 *   npm run data:validate
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { MAP_HEIGHT, MAP_WIDTH } from '../src/config';
import { routeKey, sideLegs, voyageLegs } from '../src/data/voyage';
import type { Arc, CrewMember, Location, Region, RouteSegment } from '../src/types';
import { GENERATED_DIR, OVERRIDES_DIR } from './lib/paths';

// ---------------------------------------------------------------------------
// Schemas. `satisfies` makes the compiler flag any drift from src/types.ts.

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug');
const episode = z.number().int().positive();

const RegionSchema = z.enum([
  'east-blue',
  'west-blue',
  'north-blue',
  'south-blue',
  'paradise',
  'new-world',
  'calm-belt',
  'red-line',
  'sky',
  'undersea',
  'other',
]) satisfies z.ZodType<Region>;

const LocationSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  region: RegionSchema,
  x: z.number(),
  y: z.number(),
  summary: z.string(),
  wikiTitle: z.string().min(1),
  arcIds: z.array(slug),
  positionSource: z.enum(['auto', 'manual']),
  animeOnly: z.boolean().optional(),
}) satisfies z.ZodType<Location>;

const ArcSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  saga: z.string().min(1),
  order: z.number().int().positive(),
  episodes: z.tuple([episode, episode]),
  filler: z.boolean(),
  offRoute: z.boolean().optional(),
  sideRoute: z.boolean().optional(),
  locationIds: z.array(slug),
  chapters: z.tuple([episode, episode]).optional(),
  summary: z.string(),
  ongoing: z.boolean().optional(),
}) satisfies z.ZodType<Arc>;

const CrewMemberSchema = z.strictObject({
  id: slug,
  name: z.string().min(1),
  role: z.string().min(1),
  joinedArcId: slug,
  joinedEpisode: episode,
}) satisfies z.ZodType<CrewMember>;

const RouteSegmentSchema = z.strictObject({
  fromLocationId: slug,
  toLocationId: slug,
  arcId: slug,
  waypoints: z.array(z.tuple([z.number(), z.number()])).optional(),
}) satisfies z.ZodType<RouteSegment>;

const PositionsSchema = z.record(slug, z.strictObject({ x: z.number(), y: z.number() }));

const MetaSchema = z.strictObject({
  asOf: z.iso.date(),
  latestAiredEpisode: episode,
  latestArcId: slug,
});

// ---------------------------------------------------------------------------

const errors: string[] = [];
const warnings: string[] = [];

async function load<T>(
  file: string,
  schema: z.ZodType<T>,
  { optional = false } = {},
): Promise<T | null> {
  if (!existsSync(file)) {
    if (!optional) errors.push(`${path.basename(file)}: missing`);
    return null;
  }
  const result = schema.safeParse(JSON.parse(await readFile(file, 'utf8')));
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${path.basename(file)} ${issue.path.join('.')}: ${issue.message}`);
    }
    return null;
  }
  return result.data;
}

const generated = (file: string) => path.join(GENERATED_DIR, file);
const arcs = (await load(generated('arcs.json'), z.array(ArcSchema))) ?? [];
const locations = (await load(generated('locations.json'), z.array(LocationSchema))) ?? [];
const crew = (await load(generated('crew.json'), z.array(CrewMemberSchema))) ?? [];
const meta = await load(generated('meta.json'), MetaSchema);
const route = (await load(generated('route.json'), z.array(RouteSegmentSchema))) ?? [];
const positions = await load(path.join(OVERRIDES_DIR, 'positions.json'), PositionsSchema, {
  optional: true,
});

// ---------------------------------------------------------------------------
// Ids

function checkUnique(kind: string, ids: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`${kind}: duplicate id "${id}"`);
    seen.add(id);
  }
}
checkUnique(
  'arcs',
  arcs.map((a) => a.id),
);
checkUnique(
  'locations',
  locations.map((l) => l.id),
);
checkUnique(
  'crew',
  crew.map((c) => c.id),
);

const arcById = new Map(arcs.map((a) => [a.id, a]));
const locationById = new Map(locations.map((l) => [l.id, l]));

// ---------------------------------------------------------------------------
// Arcs: order, episodes, references

const orders = arcs.map((a) => a.order).sort((a, b) => a - b);
if (orders.some((order, i) => order !== i + 1)) {
  errors.push(`arcs: order must run 1..${arcs.length} with no gaps or repeats`);
}
const byOrder = [...arcs].sort((a, b) => a.order - b.order);
for (const [i, arc] of byOrder.entries()) {
  const [start, end] = arc.episodes;
  if (start > end) errors.push(`${arc.id}: episode range ${start}–${end} runs backwards`);
  const previous = byOrder[i - 1];
  if (previous && previous.episodes[0] > start) {
    errors.push(
      `${arc.id}: order ${arc.order} starts before arc ${previous.order} (${previous.id})`,
    );
  }
  for (const id of arc.locationIds) {
    const location = locationById.get(id);
    if (!location) errors.push(`${arc.id}: unknown location "${id}"`);
    else if (!location.arcIds.includes(arc.id)) {
      errors.push(`${arc.id}: visits ${id}, but ${id}.arcIds doesn't list it`);
    }
  }
}

for (const arc of arcs.filter((a) => a.sideRoute && !a.offRoute)) {
  errors.push(`${arc.id}: a side-route arc must be off-route (the ship isn't the one traveling)`);
}

const ongoing = byOrder.filter((a) => a.ongoing);
if (ongoing.length > 1)
  errors.push(`arcs: ${ongoing.length} arcs are marked ongoing; at most one can be`);
if (ongoing[0] && ongoing[0] !== byOrder.at(-1))
  errors.push(`${ongoing[0].id}: only the last arc can be ongoing`);

const withoutStops = arcs.filter((a) => a.locationIds.length === 0).map((a) => a.id);
if (withoutStops.length)
  warnings.push(`${withoutStops.length} arcs have no map stop: ${withoutStops.join(', ')}`);

// Every aired episode should belong to some arc. Interleaved filler makes ranges overlap,
// which is expected; gaps are worth a look.
const lastEpisode = meta?.latestAiredEpisode ?? Math.max(...arcs.map((a) => a.episodes[1]));
const covered = new Set(arcs.flatMap((a) => range(a.episodes[0], a.episodes[1])));
const gaps = collapse(range(1, lastEpisode).filter((n) => !covered.has(n)));
if (gaps.length) warnings.push(`episodes in no arc: ${gaps.join(', ')}`);

if (meta) {
  const latestArc = arcById.get(meta.latestArcId);
  if (!latestArc) errors.push(`meta.json: unknown latestArcId "${meta.latestArcId}"`);
  else if (latestArc.episodes[1] !== meta.latestAiredEpisode) {
    errors.push(
      `meta.json: latest aired episode ${meta.latestAiredEpisode} isn't the end of ${latestArc.id}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Locations

for (const location of locations) {
  for (const arcId of location.arcIds) {
    const arc = arcById.get(arcId);
    if (!arc) errors.push(`${location.id}: unknown arc "${arcId}"`);
    else if (!arc.locationIds.includes(location.id)) {
      errors.push(`${location.id}: lists ${arcId}, but ${arcId} doesn't visit it`);
    }
  }
  if (location.arcIds.length === 0) errors.push(`${location.id}: no arc visits it`);
}

for (const id of Object.keys(positions ?? {})) {
  if (!locationById.has(id)) warnings.push(`positions.json: "${id}" isn't a location`);
}

// ---------------------------------------------------------------------------
// Summaries: one or two short sentences each (PLAN.md §2.4), written in sources/summaries.ts

/** About five lines in the logbook. */
const MAX_SUMMARY_LENGTH = 240;

for (const item of [...arcs, ...locations]) {
  const { summary } = item;
  if (!summary.trim()) errors.push(`${item.id}: no summary (add one to sources/summaries.ts)`);
  else if (summary.length > MAX_SUMMARY_LENGTH) {
    errors.push(
      `${item.id}: summary is ${summary.length} characters; keep it to ${MAX_SUMMARY_LENGTH}`,
    );
  } else if (sentences(summary).length > 2) {
    errors.push(`${item.id}: summary has ${sentences(summary).length} sentences; keep it to two`);
  }
}

// ---------------------------------------------------------------------------
// Crew

for (const member of crew) {
  const arc = arcById.get(member.joinedArcId);
  if (!arc) {
    errors.push(`${member.id}: unknown joinedArcId "${member.joinedArcId}"`);
  } else if (member.joinedEpisode < arc.episodes[0] || member.joinedEpisode > arc.episodes[1]) {
    errors.push(
      `${member.id}: joinedEpisode ${member.joinedEpisode} is outside ${arc.id} (${arc.episodes.join('–')})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Route: an entry for every leg drawn (the ship's and the side route's), with anime-only arcs
// shown and hidden

const segments = new Map<string, RouteSegment>();
for (const segment of route) {
  const key = routeKey(segment.fromLocationId, segment.toLocationId);
  if (segments.has(key)) errors.push(`route ${key}: listed twice`);
  segments.set(key, segment);
  if (!locationById.has(segment.fromLocationId)) errors.push(`route ${key}: unknown from location`);
  if (!locationById.has(segment.toLocationId)) errors.push(`route ${key}: unknown to location`);
  if (!arcById.has(segment.arcId)) errors.push(`route ${key}: unknown arc "${segment.arcId}"`);
  for (const [x, y] of segment.waypoints ?? []) {
    if (x < 0 || x > MAP_WIDTH || y < 0 || y > MAP_HEIGHT) {
      errors.push(`route ${key}: waypoint ${x},${y} is off the map`);
    }
  }
}

const drawn = new Set<string>();
for (const [mode, shown] of [
  ['with anime-only arcs', byOrder],
  ['without anime-only arcs', byOrder.filter((a) => !a.filler)],
] as const) {
  for (const leg of [...voyageLegs(shown), ...sideLegs(shown)]) {
    const key = routeKey(leg.fromLocationId, leg.toLocationId);
    drawn.add(key);
    const segment = segments.get(key);
    if (!segment) errors.push(`route.json: no entry for ${key}, drawn ${mode}`);
    else if (segment.arcId !== leg.arcId) {
      errors.push(`route ${key}: leads into ${leg.arcId}, not ${segment.arcId}`);
    }
  }
}
for (const key of segments.keys()) {
  if (!drawn.has(key)) warnings.push(`route ${key}: never drawn; rebuild with data:build`);
}

// ---------------------------------------------------------------------------

console.log(
  `Checked ${arcs.length} arcs, ${locations.length} locations, ${crew.length} crew, ` +
    `${route.length} route segments.`,
);
for (const warning of warnings) console.warn(`  warning: ${warning}`);
for (const error of errors) console.error(`  error: ${error}`);
if (errors.length) {
  console.error(`\n${errors.length} error${errors.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log('Data is valid.');

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Splits at sentence ends, but not after an abbreviation or initial ("Dr. Vegapunk"). */
function sentences(text: string): string[] {
  const result: string[] = [];
  for (const piece of text.split(/(?<=[.!?])\s+(?=[A-Z‘“"])/)) {
    const previous = result.at(-1);
    if (previous && /\b(?:Dr|Mr|Mrs|Ms|St|[A-Z])\.$/.test(previous)) {
      result[result.length - 1] = `${previous} ${piece}`;
    } else {
      result.push(piece);
    }
  }
  return result;
}

/** [3, 4, 5, 9] → ["3–5", "9"] */
function collapse(numbers: number[]): string[] {
  const runs: [number, number][] = [];
  for (const n of numbers) {
    const last = runs.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else runs.push([n, n]);
  }
  return runs.map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`));
}
