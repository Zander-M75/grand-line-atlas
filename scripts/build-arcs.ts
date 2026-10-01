/**
 * Builds data/generated/arcs.json and meta.json from the cached wiki pages.
 *
 *   npm run data:build            (runs this, then build-locations and build-crew)
 *   tsx scripts/build-arcs.ts --as-of=2026-10-01   pretend today is another date
 *
 * What the wiki pages actually look like (inspected 2026-10-01):
 *
 *   Episode Guide/<Saga>: one page per saga, and the main source here.
 *     ==[[East Blue Saga]]==                                   the saga
 *     ===[[Romance Dawn Arc]]===                                an arc, in airing order
 *     ===[[Buggy's Crew: After the Battle!|Buggy Side Story Arc]]===   page title ≠ label
 *     ===[[Impel Down Arc]] (Cont.)===                          resumes after interleaved filler
 *     ===Elbaph Arc===                                          newest arcs may not be linked yet
 *     {{Episode|1|title|romaji|kanji|October 20|1999|summary}}  one row per episode
 *     {{Special|590|link=Episode 590|…}}                        a numbered episode filed as special
 *     {{Special|RC15|…}}, {{Special|1=01|…}}                    recaps, movies, remasters: skipped
 *     The guide also lists announced episodes with future air dates; those don't count yet.
 *
 *   <Arc> page: {{Arc Box |type = Filler |episode = auto |prev = … |next = … |next anime = …}}
 *     `episode = auto` means the template computes the range, so ranges come from the guide.
 *     `type = Filler` marks anime-only arcs (as does Category:Filler Arcs).
 *
 *   Category:<Arc> Episodes: "Episode N" pages, used to double-check each arc's range.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Arc } from '../src/types';
import { GENERATED_DIR } from './lib/paths';
import { createReviewList } from './lib/review';
import { getCategoryMembers, getPage } from './lib/wikiClient';
import { linkTargets, named, param, parseLinkText, sections, templatesNamed } from './lib/wikitext';
import { ARCS, LOCATIONS, type ArcSeed } from './sources/journey';

const review = createReviewList('arcs');

/** Arcs whose episode category disagrees with the guide; reported together at the end. */
const rangeDisagreements: string[] = [];
const asOf = parseAsOf(process.argv);

// ---------------------------------------------------------------------------
// 1. Read every saga's episode guide.

interface GuideEpisode {
  number: number;
  airDate: Date | null;
}

interface GuideArc {
  /** The arc's wiki page (the heading's link target), or its label when it isn't linked. */
  page: string;
  label: string;
  saga: string;
  episodes: GuideEpisode[];
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseAirDate(monthDay = '', year = ''): Date | null {
  const day = monthDay.match(/([A-Z][a-z]+)\s+(\d{1,2})/);
  const yearMatch = year.match(/\d{4}/);
  const month = MONTHS.indexOf(day?.[1] ?? '');
  if (!day || !yearMatch || month < 0) return null;
  return new Date(Date.UTC(Number(yearMatch[0]), month, Number(day[2])));
}

function guideEpisodes(sectionBody: string): GuideEpisode[] {
  const rows = [
    ...templatesNamed(sectionBody, 'Episode'),
    // A few numbered episodes are filed as specials; those link to their own "Episode N" page.
    ...templatesNamed(sectionBody, 'Special').filter(
      (t) => named(t, 'link') === `Episode ${param(t, 1)}`,
    ),
  ];
  return rows
    .map((t) => ({ number: Number(param(t, 1)), airDate: parseAirDate(param(t, 5), param(t, 6)) }))
    .filter((e) => Number.isInteger(e.number) && e.number > 0);
}

const withoutContinuation = (label: string) => label.replace(/\s*\(Cont\.?(?:\s*\d+)?\)\s*$/, '');

async function readGuides(): Promise<Map<string, GuideArc>> {
  const pages = (await getCategoryMembers('Episode Guides')).members
    .map((m) => m.title)
    .filter((title) => title.startsWith('Episode Guide/'));

  const arcs = new Map<string, GuideArc>();
  for (const title of pages) {
    const { wikitext } = await getPage(title);
    let saga = '';
    for (const section of sections(wikitext)) {
      if (section.level === 2) {
        saga = parseLinkText(section.heading).label;
        continue;
      }
      const episodes = guideEpisodes(section.body);
      if (episodes.length === 0) continue; // OVAs, remaster blocks, navigation

      const { target, label } = parseLinkText(section.heading);
      const page = target ?? withoutContinuation(label);
      const existing = arcs.get(page);
      if (existing) {
        // An arc split around interleaved filler: "(Cont.)" sections add to it.
        existing.episodes.push(...episodes);
        if (existing.saga !== saga)
          review.add(page, `appears in two sagas: ${existing.saga}, ${saga}`);
      } else {
        arcs.set(page, { page, label: withoutContinuation(label), saga, episodes });
      }
    }
  }
  return arcs;
}

// ---------------------------------------------------------------------------
// 2. Combine the guide with the curated arc list and each arc's own page.

const guide = await readGuides();
const fillerCategory = new Set(
  (await getCategoryMembers('Filler Arcs')).members.map((m) => m.title),
);
const aired = (e: GuideEpisode) => e.airDate !== null && e.airDate <= asOf;
const latestAired = Math.max(
  ...[...guide.values()].flatMap((arc) => arc.episodes.filter(aired).map((e) => e.number)),
);

interface BuiltArc {
  seed: ArcSeed;
  arc: Omit<Arc, 'order'>;
  hasUnairedEpisodes: boolean;
  hasNextArc: boolean;
}

const built: BuiltArc[] = [];
for (const seed of ARCS) {
  const entry = guide.get(seed.wikiTitle);
  if (!entry) {
    review.add(
      seed.id,
      `not found in the episode guide (looked for "${seed.wikiTitle}"); left out`,
    );
    continue;
  }
  const airedNumbers = entry.episodes.filter(aired).map((e) => e.number);
  if (airedNumbers.length === 0) {
    console.log(`Skipping ${entry.label}: no episodes have aired as of ${isoDate(asOf)}.`);
    continue;
  }
  guide.delete(seed.wikiTitle);

  const page = await getPage(seed.wikiTitle);
  const arcBox = templatesNamed(page.wikitext, 'Arc Box')[0];
  const wikiFiller =
    fillerCategory.has(seed.wikiTitle) || named(arcBox ?? { template: '' }, 'type') === 'Filler';
  const filler = seed.filler?.value ?? wikiFiller;
  // An override is reported here unless the seed's own review note already explains it.
  if (seed.filler && seed.filler.value !== wikiFiller && !seed.review) {
    review.add(
      seed.id,
      `the wiki ${wikiFiller ? 'lists it as filler' : "doesn't list it as filler"}; marked ${filler ? 'anime-only' : 'canon'} because ${seed.filler.reason}`,
    );
  }

  await checkLocationsAreLinked(seed, page.wikitext);
  await crossCheckEpisodeCategory(seed, entry.label, airedNumbers);
  if (seed.review) review.add(seed.id, seed.review);

  built.push({
    seed,
    arc: {
      id: seed.id,
      name: entry.label,
      saga: entry.saga,
      episodes: [Math.min(...airedNumbers), Math.max(...airedNumbers)],
      filler,
      ...(seed.offRoute ? { offRoute: true } : {}),
      locationIds: seed.locations,
      summary: '',
    },
    hasUnairedEpisodes: entry.episodes.some((e) => !aired(e)),
    hasNextArc: Boolean(arcBox && (named(arcBox, 'next') || named(arcBox, 'next anime'))),
  });
}

for (const leftover of guide.values()) {
  const numbers = leftover.episodes.map((e) => e.number);
  review.add(
    leftover.page,
    `in the episode guide (${leftover.saga}, episodes ${Math.min(...numbers)}–${Math.max(...numbers)}) but not in sources/journey.ts`,
  );
}

const knownPages = new Set(ARCS.map((a) => a.wikiTitle));
for (const category of ['Story Arcs', 'Filler Arcs']) {
  for (const member of (await getCategoryMembers(category)).members) {
    if (member.ns === 0 && member.title !== 'Story Arcs' && !knownPages.has(member.title)) {
      review.add(member.title, `in Category:${category} but not in sources/journey.ts`);
    }
  }
}

/**
 * Evidence that the arc really visits each place: the arc's page links to the place, or the
 * place's page links back to the arc. Either direction counts, since pages often link a
 * place by another name (the G-8 Arc page links "G-8", not "Navarone Island").
 */
async function checkLocationsAreLinked(seed: ArcSeed, arcWikitext: string) {
  const arcLinks = linkTargets(arcWikitext);
  for (const id of seed.locations) {
    const location = LOCATIONS[id];
    if (!location) {
      review.add(seed.id, `location "${id}" isn't defined in sources/journey.ts`);
      continue;
    }
    const locationPage = await getPage(location.wikiTitle);
    const linked =
      arcLinks.has(location.wikiTitle) ||
      (locationPage.title !== null && arcLinks.has(locationPage.title)) ||
      linkTargets(locationPage.wikitext).has(seed.wikiTitle);
    if (!linked) {
      review.add(seed.id, `visits ${location.wikiTitle}, but neither page links to the other`);
    }
  }
}

async function crossCheckEpisodeCategory(seed: ArcSeed, label: string, guideNumbers: number[]) {
  const category = await getCategoryMembers(`${seed.wikiTitle} Episodes`);
  const numbers = category.members
    .map((m) => Number(m.title.match(/^Episode (\d+)$/)?.[1]))
    .filter((n) => Number.isInteger(n) && n <= latestAired);
  if (numbers.length === 0) return; // no category to compare against
  const fromGuide = `${Math.min(...guideNumbers)}–${Math.max(...guideNumbers)}`;
  const fromCategory = `${Math.min(...numbers)}–${Math.max(...numbers)}`;
  if (fromGuide !== fromCategory) {
    rangeDisagreements.push(`${label} (guide ${fromGuide}, category ${fromCategory})`);
  }
}

// ---------------------------------------------------------------------------
// 3. Order by first episode (a containing arc before the filler nested in it).

built.sort(
  (a, b) => a.arc.episodes[0] - b.arc.episodes[0] || b.arc.episodes[1] - a.arc.episodes[1],
);
const arcs: Arc[] = built.map(({ arc: { id, name, saga, ...rest } }, i) => ({
  id,
  name,
  saga,
  order: i + 1,
  ...rest,
}));

const last = built.at(-1);
const lastArc = arcs.at(-1);
if (last && lastArc && (last.hasUnairedEpisodes || !last.hasNextArc)) {
  lastArc.ongoing = true;
}

if (rangeDisagreements.length) {
  review.add(
    'Episode ranges',
    `come from the wiki's episode guide. Its per-arc episode categories disagree by a few episodes at the edges for: ${rangeDisagreements.join('; ')}. Spot checks favor the guide (episode 45 is Luffy's first bounty, the end of Arlong Park; 227–228 are canon Long Ring Long Land after Foxy's Return).`,
  );
}

reportInterleaving(arcs);
reportPlanDifferences(
  built.map((b) => b.seed),
  arcs,
);

function reportInterleaving(sorted: Arc[]) {
  for (const inner of sorted) {
    const outer = sorted.find(
      (other) =>
        other !== inner &&
        other.episodes[0] < inner.episodes[0] &&
        other.episodes[1] > inner.episodes[1],
    );
    if (outer) {
      console.log(
        `Interleaved: ${inner.name} (${inner.episodes.join('–')}) airs inside ${outer.name} (${outer.episodes.join('–')}).`,
      );
    }
  }
}

function reportPlanDifferences(seeds: ArcSeed[], sorted: Arc[]) {
  const byId = new Map(seeds.map((s) => [s.id, s]));
  const sagaChanges: string[] = [];
  const nameChanges: string[] = [];
  const fillerChanges: string[] = [];
  for (const arc of sorted) {
    const planned = byId.get(arc.id)?.plan;
    if (!planned) continue;
    if (planned.saga !== arc.saga) {
      sagaChanges.push(`${arc.name} (plan: ${planned.saga ?? 'between sagas'})`);
    }
    if (`${planned.name} Arc` !== arc.name) nameChanges.push(`"${planned.name}" → "${arc.name}"`);
    if (planned.filler !== arc.filler) {
      fillerChanges.push(`${arc.name} (plan: ${planned.filler ? 'anime-only' : 'canon'})`);
    }
  }
  if (sagaChanges.length) {
    review.add(
      'Sagas',
      `follow the wiki's episode guide, which groups these differently from PLAN.md: ${sagaChanges.join('; ')}`,
    );
  }
  if (nameChanges.length)
    review.add('Names', `the wiki names these differently from PLAN.md: ${nameChanges.join('; ')}`);
  if (fillerChanges.length)
    review.add('Filler', `differs from PLAN.md: ${fillerChanges.join('; ')}`);

  const planOrder = ARCS.filter((s) => s.plan).map((s) => s.id);
  const planned = sorted.filter((arc) => planOrder.includes(arc.id));
  const outOfOrder = planned
    .filter((arc, i) => {
      const previous = planned[i - 1];
      return previous && planOrder.indexOf(arc.id) < planOrder.indexOf(previous.id);
    })
    .map((arc) => arc.name);
  if (outOfOrder.length) {
    review.add(
      'Order',
      `by first episode, these come earlier than PLAN.md lists them: ${outOfOrder.join(', ')}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Write the output and report.

await writeJson('arcs.json', arcs);
await writeJson('meta.json', {
  asOf: isoDate(asOf),
  latestAiredEpisode: latestAired,
  latestArcId: lastArc?.id,
});

console.log(
  `\nWrote ${arcs.length} arcs. Latest aired episode as of ${isoDate(asOf)}: ${latestAired}.\n`,
);
for (const arc of arcs) {
  const flags = [arc.filler && 'anime-only', arc.offRoute && 'off-route', arc.ongoing && 'ongoing']
    .filter(Boolean)
    .join(', ');
  console.log(
    `${String(arc.order).padStart(3)}  ${arc.episodes.join('–').padEnd(10)} ${arc.name.padEnd(30)} ${arc.saga.padEnd(24)} ${flags}`,
  );
}
await review.finish();

// ---------------------------------------------------------------------------

function parseAsOf(argv: string[]): Date {
  const flag = argv.find((a) => a.startsWith('--as-of='))?.slice('--as-of='.length);
  const date = flag ? new Date(`${flag}T00:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid --as-of date: ${flag}`);
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function writeJson(file: string, value: unknown) {
  await writeFile(path.join(GENERATED_DIR, file), JSON.stringify(value, null, 2) + '\n');
}
