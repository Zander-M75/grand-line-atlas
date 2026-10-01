/**
 * Pulls everything the data build needs from the One Piece Fandom wiki into data/raw.
 * Every response is cached, so a second run makes no requests; `--refresh` re-fetches.
 *
 *   npm run data:fetch [-- --refresh]
 *
 * What it fetches, and why:
 *   Category:Story Arcs, Category:Filler Arcs  every arc the wiki knows, to spot ones we lack
 *   Category:Episode Guides → Episode Guide/*   arcs in airing order, episodes, air dates, sagas
 *   each arc's page                             its Arc Box infobox (filler type, prev/next)
 *   Category:<arc> Episodes                     a second source for each arc's episode range
 *   each location's page, and its categories    Island Box region; non-canon (anime-only) tags
 *   Episode <n>, for each crew join             evidence for the join points in sources/crew.ts
 */
import { CREW } from './sources/crew';
import { ARCS, LOCATIONS } from './sources/journey';
import {
  configureWikiClient,
  getCategoriesFor,
  getCategoryMembers,
  getPage,
  requestStats,
} from './lib/wikiClient';

configureWikiClient({ refresh: process.argv.includes('--refresh') });

async function step(label: string, run: () => Promise<number>) {
  const before = requestStats.network;
  const count = await run();
  console.log(`${label}: ${count} (${requestStats.network - before} requests)`);
}

await step('Arc categories', async () => {
  const story = await getCategoryMembers('Story Arcs');
  const filler = await getCategoryMembers('Filler Arcs');
  return story.members.length + filler.members.length;
});

await step('Episode guides', async () => {
  const guides = (await getCategoryMembers('Episode Guides')).members
    .map((m) => m.title)
    .filter((title) => title.startsWith('Episode Guide/'));
  for (const title of guides) await getPage(title);
  return guides.length;
});

await step('Arc pages', async () => {
  for (const arc of ARCS) await getPage(arc.wikiTitle);
  return ARCS.length;
});

await step('Arc episode categories', async () => {
  for (const arc of ARCS) await getCategoryMembers(`${arc.wikiTitle} Episodes`);
  return ARCS.length;
});

await step('Location pages', async () => {
  const titles = Object.values(LOCATIONS).map((l) => l.wikiTitle);
  for (const title of titles) await getPage(title);
  await getCategoriesFor(titles);
  return titles.length;
});

await step('Crew join episodes', async () => {
  for (const member of CREW) await getPage(`Episode ${member.joinedEpisode}`);
  return CREW.length;
});

console.log(
  `\nDone: ${requestStats.network} network requests, ${requestStats.cached} served from cache.`,
);
