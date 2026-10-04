/**
 * Checks the summaries in sources/summaries.ts against the generated data and the wiki:
 *
 * - each one belongs to an arc or place in the data (renaming an id would orphan it), and
 * - none shares a run of six or more words with any cached wiki page (arc and place pages,
 *   episode pages, the episode guide's synopses), so none is copied wiki prose (PLAN.md §2.4).
 *
 * Findings go on the TODO-REVIEW list. Missing summaries are data:validate's to catch.
 *
 *   npm run data:build   (runs it last)
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { indexSources, longestSharedRun, MIN_SHARED_WORDS } from './lib/originality';
import { GENERATED_DIR } from './lib/paths';
import { createReviewList } from './lib/review';
import { cachedPages } from './lib/wikiClient';
import { ARC_SUMMARIES, LOCATION_SUMMARIES } from './sources/summaries';

const review = createReviewList('summaries');

async function idsIn(file: string): Promise<Set<string>> {
  const items = JSON.parse(await readFile(path.join(GENERATED_DIR, file), 'utf8'));
  return new Set((items as { id: string }[]).map((item) => item.id));
}

const pages = await cachedPages();
if (pages.length === 0) console.warn('No cached wiki pages to compare against; run data:fetch.');
const index = indexSources(pages.map((page) => ({ title: page.requested, text: page.wikitext })));

const groups = [
  { kind: 'arc', summaries: ARC_SUMMARIES, ids: await idsIn('arcs.json') },
  { kind: 'place', summaries: LOCATION_SUMMARIES, ids: await idsIn('locations.json') },
];
for (const { kind, summaries, ids } of groups) {
  for (const [id, summary] of Object.entries(summaries)) {
    if (!ids.has(id)) review.add(id, `has a summary, but there's no ${kind} with this id`);
    const shared = longestSharedRun(summary, index);
    if (shared) {
      review.add(id, `the summary shares "${shared.phrase}" with the wiki's "${shared.source}"`);
    }
  }
}

const count = groups.reduce((sum, group) => sum + Object.keys(group.summaries).length, 0);
console.log(
  `Checked ${count} summaries against ${pages.length} cached wiki pages ` +
    `for shared runs of ${MIN_SHARED_WORDS} or more words.`,
);
await review.finish();
