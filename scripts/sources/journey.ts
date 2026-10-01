/**
 * The journey, as curated input to the data build: which arcs to show (starting from the
 * seed list in PLAN.md §5), which wiki page describes each, and which places each arc visits.
 *
 * Facts the wiki can answer (episode ranges, sagas, filler status, order, regions) are NOT
 * typed in here. The build scripts pull them from the wiki and check them against this file,
 * reporting any disagreement on the TODO-REVIEW list.
 */
import type { Region } from '../../src/types';

export interface ArcSeed {
  id: string;
  /** The arc's page on the wiki. */
  wikiTitle: string;
  /**
   * How PLAN.md §5 names, groups, and classifies the arc, kept so the build can report where
   * the wiki disagrees. `saga: null` means the plan lists it between sagas. `null` overall
   * means the arc was found on the wiki but isn't in the plan.
   */
  plan: { name: string; saga: string | null; filler: boolean } | null;
  /** Location ids the arc visits, in order. Empty when the wiki names no place. */
  locations: string[];
  /** The crew's ship isn't traveling: Luffy alone, flashbacks, or other characters' stories. */
  offRoute?: boolean;
  /** Overrides the wiki's filler classification, with the reason. */
  filler?: { value: boolean; reason: string };
  /** A judgment call for the owner to confirm. Becomes a TODO-REVIEW item. */
  review?: string;
}

const plan = (name: string, saga: string | null, filler = false) => ({ name, saga, filler });

const NO_PLACE =
  'The wiki names no island for this arc, so it has no map stop and the ship stays put.';

export const ARCS: ArcSeed[] = [
  // East Blue Saga
  {
    id: 'romance-dawn',
    wikiTitle: 'Romance Dawn Arc',
    plan: plan('Romance Dawn', 'East Blue Saga'),
    locations: ['foosha-village', 'shells-town'],
    review:
      'Starts at Foosha Village, where Luffy sets out, though the anime first shows the village in a flashback in episode 4.',
  },
  {
    id: 'orange-town',
    wikiTitle: 'Orange Town Arc',
    plan: plan('Orange Town', 'East Blue Saga'),
    locations: ['orange-town'],
  },
  {
    id: 'syrup-village',
    wikiTitle: 'Syrup Village Arc',
    plan: plan('Syrup Village', 'East Blue Saga'),
    locations: ['syrup-village', 'island-of-rare-animals'],
    review:
      'Includes the Island of Rare Animals: episode 18 takes place there and the episode guide keeps it in this arc.',
  },
  {
    id: 'baratie',
    wikiTitle: 'Baratie Arc',
    plan: plan('Baratie', 'East Blue Saga'),
    locations: ['baratie'],
  },
  {
    id: 'arlong-park',
    wikiTitle: 'Arlong Park Arc',
    plan: plan('Arlong Park', 'East Blue Saga'),
    locations: ['arlong-park'],
  },
  {
    id: 'buggy-side-story',
    wikiTitle: "Buggy's Crew: After the Battle!",
    plan: plan("Buggy's Crew Adventure", 'East Blue Saga', true),
    locations: ['orange-town'],
    offRoute: true,
    filler: {
      value: true,
      reason: 'PLAN.md marks it anime-only; it expands a manga cover story into its own episodes',
    },
    review:
      "The wiki's episode guide calls it the Buggy Side Story Arc. It adapts a manga cover story, so it isn't in the wiki's Filler Arcs category. Kept as anime-only and off-route (no Straw Hats in it), shown at Orange Town where Buggy's crew was left.",
  },
  {
    id: 'loguetown',
    wikiTitle: 'Loguetown Arc',
    plan: plan('Loguetown', 'East Blue Saga'),
    locations: ['loguetown'],
  },
  {
    id: 'warship-island',
    wikiTitle: 'Warship Island Arc',
    plan: plan('Warship Island', 'Arabasta Saga', true),
    locations: ['warship-island'],
  },

  // Arabasta Saga
  {
    id: 'reverse-mountain',
    wikiTitle: 'Reverse Mountain Arc',
    plan: plan('Reverse Mountain', 'Arabasta Saga'),
    locations: ['reverse-mountain', 'twin-cape'],
    review:
      'Includes Twin Cape, the lighthouse at the foot of Reverse Mountain where Laboon waits.',
  },
  {
    id: 'whisky-peak',
    wikiTitle: 'Whisky Peak Arc',
    plan: plan('Whisky Peak', 'Arabasta Saga'),
    locations: ['whisky-peak'],
  },
  {
    id: 'koby-and-helmeppo',
    wikiTitle: 'Diary of Koby-Meppo',
    plan: plan('Koby and Helmeppo', 'Arabasta Saga', true),
    locations: [],
    offRoute: true,
    filler: {
      value: true,
      reason: 'PLAN.md marks it anime-only; it expands a manga cover story into its own episodes',
    },
    review:
      "Adapts the manga cover story Diary of Koby-Meppo, so it isn't in the wiki's Filler Arcs category. Kept as anime-only and off-route (no Straw Hats in it). The wiki names no single place, so it has no map stop.",
  },
  {
    id: 'little-garden',
    wikiTitle: 'Little Garden Arc',
    plan: plan('Little Garden', 'Arabasta Saga'),
    locations: ['little-garden'],
  },
  {
    id: 'drum-island',
    wikiTitle: 'Drum Island Arc',
    plan: plan('Drum Island', 'Arabasta Saga'),
    locations: ['drum-island'],
  },
  {
    id: 'arabasta',
    wikiTitle: 'Arabasta Arc',
    plan: plan('Arabasta', 'Arabasta Saga'),
    locations: ['arabasta'],
  },
  {
    id: 'post-arabasta',
    wikiTitle: 'Post-Arabasta Arc',
    plan: plan('Post-Arabasta', null, true),
    locations: [],
    review: `Flashback episodes aboard the ship after Arabasta. ${NO_PLACE}`,
  },

  // Sky Island Saga
  {
    id: 'goat-island',
    wikiTitle: 'Goat Island Arc',
    plan: plan('Goat Island', null, true),
    locations: ['goat-island'],
  },
  {
    id: 'ruluka-island',
    wikiTitle: 'Ruluka Island Arc',
    plan: plan('Ruluka Island', null, true),
    locations: ['ruluka-island'],
  },
  {
    id: 'jaya',
    wikiTitle: 'Jaya Arc',
    plan: plan('Jaya', 'Sky Island Saga'),
    locations: ['jaya'],
  },
  {
    id: 'skypiea',
    wikiTitle: 'Skypiea Arc',
    plan: plan('Skypiea', 'Sky Island Saga'),
    locations: ['skypiea'],
  },
  {
    id: 'g-8',
    wikiTitle: 'G-8 Arc',
    plan: plan('G-8', null, true),
    locations: ['navarone'],
  },

  // Water 7 Saga
  {
    id: 'long-ring-long-land',
    wikiTitle: 'Long Ring Long Land Arc',
    plan: plan('Long Ring Long Land', 'Water 7 Saga'),
    locations: ['long-ring-long-land'],
  },
  {
    id: 'oceans-dream',
    wikiTitle: "Ocean's Dream Arc",
    plan: plan("Ocean's Dream", 'Water 7 Saga', true),
    locations: [],
    review: NO_PLACE,
  },
  {
    id: 'foxys-return',
    wikiTitle: "Foxy's Return Arc",
    plan: plan("Foxy's Return", 'Water 7 Saga', true),
    locations: [],
    review: NO_PLACE,
  },
  {
    id: 'water-7',
    wikiTitle: 'Water 7 Arc',
    plan: plan('Water 7', 'Water 7 Saga'),
    locations: ['water-7'],
  },
  {
    id: 'enies-lobby',
    wikiTitle: 'Enies Lobby Arc',
    plan: plan('Enies Lobby', 'Water 7 Saga'),
    locations: ['enies-lobby'],
  },
  {
    id: 'post-enies-lobby',
    wikiTitle: 'Post-Enies Lobby Arc',
    plan: plan('Post-Enies Lobby', 'Water 7 Saga'),
    locations: ['water-7'],
  },

  // Thriller Bark Saga
  {
    id: 'ice-hunter',
    wikiTitle: 'Ice Hunter Arc',
    plan: plan('Ice Hunter', null, true),
    locations: ['lovely-land'],
  },
  {
    id: 'thriller-bark',
    wikiTitle: 'Thriller Bark Arc',
    plan: plan('Thriller Bark', 'Thriller Bark Saga'),
    locations: ['thriller-bark'],
  },
  {
    id: 'spa-island',
    wikiTitle: 'Spa Island Arc',
    plan: plan('Spa Island', null, true),
    locations: ['spa-island'],
  },

  // Summit War Saga
  {
    id: 'sabaody-archipelago',
    wikiTitle: 'Sabaody Archipelago Arc',
    plan: plan('Sabaody Archipelago', 'Summit War Saga'),
    locations: ['sabaody-archipelago'],
  },
  {
    id: 'amazon-lily',
    wikiTitle: 'Amazon Lily Arc',
    plan: plan('Amazon Lily', 'Summit War Saga'),
    locations: ['amazon-lily'],
    offRoute: true,
  },
  {
    id: 'impel-down',
    wikiTitle: 'Impel Down Arc',
    plan: plan('Impel Down', 'Summit War Saga'),
    locations: ['impel-down'],
    offRoute: true,
  },
  {
    id: 'little-east-blue',
    wikiTitle: 'Little East Blue Arc',
    plan: plan('Little East Blue', 'Summit War Saga', true),
    locations: ['little-east-blue'],
    offRoute: true,
  },
  {
    id: 'marineford',
    wikiTitle: 'Marineford Arc',
    plan: plan('Marineford', 'Summit War Saga'),
    locations: ['marineford'],
    offRoute: true,
  },
  {
    id: 'post-war',
    wikiTitle: 'Post-War Arc',
    plan: plan('Post-War', 'Summit War Saga'),
    locations: ['rusukaina'],
    offRoute: true,
    review:
      'Shown at Rusukaina, where Luffy trains; the arc also follows the rest of the crew around the world.',
  },

  // Fish-Man Island Saga
  {
    id: 'return-to-sabaody',
    wikiTitle: 'Return to Sabaody Arc',
    plan: plan('Return to Sabaody', 'Fish-Man Island Saga'),
    locations: ['sabaody-archipelago'],
  },
  {
    id: 'fish-man-island',
    wikiTitle: 'Fish-Man Island Arc',
    plan: plan('Fish-Man Island', 'Fish-Man Island Saga'),
    locations: ['fish-man-island'],
  },

  // Dressrosa Saga
  {
    id: 'zs-ambition',
    wikiTitle: "Z's Ambition Arc",
    plan: plan("Z's Ambition", null, true),
    locations: [],
    review: NO_PLACE,
  },
  {
    id: 'punk-hazard',
    wikiTitle: 'Punk Hazard Arc',
    plan: plan('Punk Hazard', 'Dressrosa Saga'),
    locations: ['punk-hazard'],
  },
  {
    id: 'caesar-retrieval',
    wikiTitle: 'Caesar Retrieval Arc',
    plan: plan('Caesar Retrieval', 'Dressrosa Saga', true),
    locations: [],
    review: `Set at sea between Punk Hazard and Dressrosa. ${NO_PLACE}`,
  },
  {
    id: 'dressrosa',
    wikiTitle: 'Dressrosa Arc',
    plan: plan('Dressrosa', 'Dressrosa Saga'),
    locations: ['dressrosa'],
  },

  // Whole Cake Island Saga
  {
    id: 'silver-mine',
    wikiTitle: 'Silver Mine Arc',
    plan: plan('Silver Mine', null, true),
    locations: ['silver-mine'],
  },
  {
    id: 'zou',
    wikiTitle: 'Zou Arc',
    plan: plan('Zou', 'Four Emperors Saga'),
    locations: ['zou'],
  },
  {
    id: 'marine-rookie',
    wikiTitle: 'Marine Rookie Arc',
    plan: plan('Marine Rookie', 'Four Emperors Saga', true),
    locations: [],
    review: NO_PLACE,
  },
  {
    id: 'whole-cake-island',
    wikiTitle: 'Whole Cake Island Arc',
    plan: plan('Whole Cake Island', 'Four Emperors Saga'),
    locations: ['whole-cake-island'],
  },
  {
    id: 'levely',
    wikiTitle: 'Levely Arc',
    plan: plan('Levely', 'Four Emperors Saga'),
    locations: ['mary-geoise'],
    offRoute: true,
  },

  // Wano Country Saga
  {
    id: 'wano-country',
    wikiTitle: 'Wano Country Arc',
    plan: plan('Wano Country', 'Four Emperors Saga'),
    locations: ['wano-country'],
  },
  {
    id: 'cidre-guild',
    wikiTitle: 'Cidre Guild Arc',
    plan: plan('Cidre Guild', 'Four Emperors Saga', true),
    locations: [],
    review: NO_PLACE,
  },
  {
    id: 'utas-past',
    wikiTitle: "Uta's Past Arc",
    plan: null,
    locations: ['foosha-village'],
    offRoute: true,
    review:
      "Not in PLAN.md's seed list, but the wiki lists it as an anime-only arc inside Wano. It's a flashback to Foosha Village, so it's off-route.",
  },

  // Final Saga
  {
    id: 'egghead',
    wikiTitle: 'Egghead Arc',
    plan: plan('Egghead', 'Final Saga'),
    locations: ['egghead'],
  },
  {
    id: 'elbaph',
    wikiTitle: 'Elbaph Arc',
    plan: null,
    locations: ['elbaph'],
    review: "Not in PLAN.md's seed list: the arc after Egghead, airing now.",
  },
];

export interface LocationSeed {
  /** The location's page on the wiki. */
  wikiTitle: string;
  /** Display name, when the wiki's page title isn't the familiar one. */
  name?: string;
  /** Overrides the region read from the wiki, with the reason. */
  region?: { value: Region; reason: string };
}

export const LOCATIONS: Record<string, LocationSeed> = {
  'foosha-village': { wikiTitle: 'Foosha Village' },
  'shells-town': { wikiTitle: 'Shells Town' },
  'orange-town': { wikiTitle: 'Orange Town' },
  'syrup-village': { wikiTitle: 'Syrup Village' },
  'island-of-rare-animals': { wikiTitle: 'Island of Rare Animals' },
  baratie: { wikiTitle: 'Baratie' },
  'arlong-park': { wikiTitle: 'Arlong Park' },
  loguetown: { wikiTitle: 'Loguetown' },
  'warship-island': { wikiTitle: 'Warship Island' },
  'reverse-mountain': { wikiTitle: 'Reverse Mountain' },
  'twin-cape': { wikiTitle: 'Twin Cape' },
  'whisky-peak': { wikiTitle: 'Whisky Peak' },
  'little-garden': { wikiTitle: 'Little Garden' },
  'drum-island': { wikiTitle: 'Drum Island' },
  arabasta: { wikiTitle: 'Arabasta Kingdom', name: 'Arabasta' },
  'goat-island': { wikiTitle: 'Goat Island (Non-Canon)', name: 'Goat Island' },
  'ruluka-island': { wikiTitle: 'Ruluka', name: 'Ruluka Island' },
  jaya: { wikiTitle: 'Jaya' },
  skypiea: {
    wikiTitle: 'Skypiea',
    region: { value: 'sky', reason: 'drawn as a floating marker above Jaya (PLAN.md §6)' },
  },
  navarone: { wikiTitle: 'Navarone Island', name: 'Navarone' },
  'long-ring-long-land': { wikiTitle: 'Long Ring Long Land' },
  'water-7': { wikiTitle: 'Water 7' },
  'enies-lobby': { wikiTitle: 'Enies Lobby' },
  'lovely-land': { wikiTitle: 'Lovely Land' },
  'thriller-bark': {
    wikiTitle: 'Thriller Bark',
    region: {
      value: 'paradise',
      reason:
        'the wiki files it under West Blue, where the ship came from, but the crew finds it in the Florian Triangle in Paradise',
    },
  },
  'spa-island': { wikiTitle: 'Spa Island' },
  'sabaody-archipelago': { wikiTitle: 'Sabaody Archipelago' },
  'amazon-lily': { wikiTitle: 'Amazon Lily' },
  'impel-down': { wikiTitle: 'Impel Down' },
  'little-east-blue': { wikiTitle: 'Little East Blue' },
  marineford: { wikiTitle: 'Marineford' },
  rusukaina: { wikiTitle: 'Rusukaina' },
  'fish-man-island': {
    wikiTitle: 'Fish-Man Island',
    region: {
      value: 'undersea',
      reason: 'drawn as an undersea marker beneath the Red Line crossing (PLAN.md §6)',
    },
  },
  'punk-hazard': { wikiTitle: 'Punk Hazard' },
  dressrosa: { wikiTitle: 'Dressrosa' },
  'silver-mine': { wikiTitle: 'Silver Mine' },
  zou: { wikiTitle: 'Zou' },
  'whole-cake-island': { wikiTitle: 'Whole Cake Island' },
  'mary-geoise': { wikiTitle: 'Mary Geoise' },
  'wano-country': { wikiTitle: 'Wano Country' },
  egghead: { wikiTitle: 'Egghead' },
  elbaph: { wikiTitle: 'Elbaph' },
};
