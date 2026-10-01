/**
 * Writes data/generated/crew.json from the hand-written list in sources/crew.ts, after
 * checking each join point against the wiki: the arc must exist and contain the episode,
 * and the cached "Episode N" page must mention the member.
 *
 *   npm run data:build   (runs build-arcs and build-locations first)
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Arc } from '../src/types';
import { GENERATED_DIR } from './lib/paths';
import { createReviewList } from './lib/review';
import { getPage } from './lib/wikiClient';
import { CREW } from './sources/crew';

const review = createReviewList('crew');
const arcs = JSON.parse(await readFile(path.join(GENERATED_DIR, 'arcs.json'), 'utf8')) as Arc[];

for (const member of CREW) {
  const arc = arcs.find((a) => a.id === member.joinedArcId);
  const [first, last] = arc?.episodes ?? [0, 0];
  if (!arc) {
    review.add(member.id, `joins in "${member.joinedArcId}", which isn't in arcs.json`);
  } else if (member.joinedEpisode < first || member.joinedEpisode > last) {
    review.add(
      member.id,
      `joins in episode ${member.joinedEpisode}, outside ${arc.name} (${first}–${last})`,
    );
  }

  // "Monkey D. Luffy" → "Luffy", "Tony Tony Chopper" → "Chopper": how episode pages refer to them.
  const shortName = member.name.split(' ').at(-1) ?? member.name;
  const episodePage = await getPage(`Episode ${member.joinedEpisode}`);
  if (!episodePage.wikitext.includes(shortName)) {
    review.add(
      member.id,
      `the wiki page for Episode ${member.joinedEpisode} never mentions ${shortName}`,
    );
  }
}

await writeFile(path.join(GENERATED_DIR, 'crew.json'), JSON.stringify(CREW, null, 2) + '\n');
console.log(`Wrote ${CREW.length} crew members.`);
await review.finish();
