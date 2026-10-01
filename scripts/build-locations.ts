/**
 * Builds data/generated/locations.json: every place an arc in arcs.json visits, with its
 * display name and region. Positions are placeholders (0, 0) until auto-layout runs (Phase 3);
 * summaries are written in Phase 7.
 *
 *   npm run data:build   (runs build-arcs first, then this, then build-crew)
 *
 * What the wiki pages actually look like (inspected 2026-10-01):
 *
 *   Islands and towns use {{Island Box | region = [[Paradise]] | first = … | affiliation = …}}.
 *   Town pages often have no `region` (Foosha Village is "located on [[Dawn Island]]").
 *
 *   Categories carry the rest: "<Region> Islands" / "<Region> Locations" (East Blue, Paradise,
 *   New World, Calm Belt, Red Line…), "Sky Islands", "Sea Floor Locations", "Totto Land
 *   Islands", and "Non-Canon …" for anime-only places (Warship Island, Navarone Island…).
 *
 * Region is read from the infobox first, then categories, then the seed's override; anything
 * still unknown falls back to the region of the nearest earlier stop and goes on TODO-REVIEW.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Arc, Location, Region } from '../src/types';
import { GENERATED_DIR } from './lib/paths';
import { createReviewList } from './lib/review';
import { getCategoriesFor, getPage } from './lib/wikiClient';
import { named, templatesNamed } from './lib/wikitext';
import { LOCATIONS } from './sources/journey';

const review = createReviewList('locations');

const arcs = JSON.parse(await readFile(path.join(GENERATED_DIR, 'arcs.json'), 'utf8')) as Arc[];

// Only places some arc visits, in the order the voyage first reaches them.
const visitedIds = [...new Set(arcs.flatMap((arc) => arc.locationIds))];
const unusedSeeds = Object.keys(LOCATIONS).filter((id) => !visitedIds.includes(id));
if (unusedSeeds.length) console.log(`Not visited by any arc, skipped: ${unusedSeeds.join(', ')}`);

const categories = await getCategoriesFor(
  visitedIds.flatMap((id) => LOCATIONS[id]?.wikiTitle ?? []),
);

// Order matters: "New World" and "Paradise" must win over a bare "Grand Line".
const REGION_NAMES: [string, Region][] = [
  ['New World', 'new-world'],
  ['Paradise', 'paradise'],
  ['East Blue', 'east-blue'],
  ['West Blue', 'west-blue'],
  ['North Blue', 'north-blue'],
  ['South Blue', 'south-blue'],
  ['Calm Belt', 'calm-belt'],
  ['Red Line', 'red-line'],
  ['Sky', 'sky'],
  ['Sea Floor', 'undersea'],
];

function regionFromText(text: string): Region | undefined {
  return REGION_NAMES.find(([name]) => text.includes(name))?.[1];
}

function regionFromCategories(pageCategories: string[]): Region | undefined {
  for (const category of pageCategories) {
    if (category === 'Totto Land Islands') return 'new-world';
    if (category === 'Dawn Island Locations') return 'east-blue';
    if (/(Islands|Locations)$/.test(category)) {
      const region = regionFromText(category);
      if (region) return region;
    }
  }
  return undefined;
}

const locations: Location[] = [];
for (const id of visitedIds) {
  const seed = LOCATIONS[id];
  if (!seed) {
    review.add(id, 'used by an arc but not defined in sources/journey.ts; skipped');
    continue;
  }
  const page = await getPage(seed.wikiTitle);
  if (page.title === null) review.add(id, `the wiki has no page called "${seed.wikiTitle}"`);

  const pageCategories = categories[seed.wikiTitle] ?? [];
  const infobox = templatesNamed(page.wikitext, 'Island Box')[0];
  const infoboxRegionText = infobox ? named(infobox, 'region') : undefined;
  const fromInfobox = infoboxRegionText ? regionFromText(infoboxRegionText) : undefined;
  const fromCategories = regionFromCategories(pageCategories);

  // Town infoboxes often name the island here ("Organ Islands"); categories then decide.
  if (infoboxRegionText && !fromInfobox && !fromCategories && !seed.region) {
    review.add(id, `infobox region "${infoboxRegionText}" doesn't map to a map region`);
  }
  if (fromInfobox && fromCategories && fromInfobox !== fromCategories && !seed.region) {
    review.add(
      id,
      `infobox says ${fromInfobox} but its categories say ${fromCategories}; using the infobox`,
    );
  }

  let region = seed.region?.value ?? fromInfobox ?? fromCategories;
  if (seed.region && seed.region.value !== (fromInfobox ?? fromCategories)) {
    console.log(`${id}: region set to ${seed.region.value} (${seed.region.reason})`);
  }
  if (!region) {
    region = regionOfEarlierStop(id) ?? 'other';
    review.add(
      id,
      `the wiki gives no region; placed in ${region}, the region of the stop before it`,
    );
  }

  const visitingArcs = arcs.filter((arc) => arc.locationIds.includes(id));
  const nonCanon = pageCategories.some((c) => c.startsWith('Non-Canon'));
  const onlyFiller = visitingArcs.every((arc) => arc.filler);
  if (nonCanon && !onlyFiller) {
    review.add(id, 'the wiki marks it non-canon, but a canon arc visits it');
  }

  locations.push({
    id,
    name: seed.name ?? page.title ?? seed.wikiTitle,
    region,
    x: 0,
    y: 0,
    summary: '',
    wikiTitle: page.title ?? seed.wikiTitle,
    arcIds: visitingArcs.map((arc) => arc.id),
    positionSource: 'auto',
    ...(nonCanon ? { animeOnly: true } : {}),
  });
}

/** Region of the nearest place visited before this one, for places the wiki can't place. */
function regionOfEarlierStop(id: string): Region | undefined {
  const index = visitedIds.indexOf(id);
  for (let i = index - 1; i >= 0; i--) {
    const earlier = locations.find((l) => l.id === visitedIds[i]);
    if (earlier) return earlier.region;
  }
  return undefined;
}

await writeFile(
  path.join(GENERATED_DIR, 'locations.json'),
  JSON.stringify(locations, null, 2) + '\n',
);

console.log(`\nWrote ${locations.length} locations.\n`);
for (const l of locations) {
  console.log(
    `${l.id.padEnd(24)} ${l.name.padEnd(22)} ${l.region.padEnd(10)} ${l.animeOnly ? 'anime-only' : ''}`,
  );
}
await review.finish();
