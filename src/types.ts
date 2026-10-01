/**
 * Shared data model (PLAN.md §5). Used by both the app and the Node data scripts,
 * so this file must stay free of runtime imports.
 */

export type Region =
  | 'east-blue'
  | 'west-blue'
  | 'north-blue'
  | 'south-blue'
  | 'paradise'
  | 'new-world'
  | 'calm-belt'
  | 'red-line'
  | 'sky'
  | 'undersea'
  | 'other';

export interface Location {
  id: string; // kebab-case slug, e.g. "water-7"
  name: string; // display name
  region: Region;
  x: number; // map pixel coords: origin top-left, y grows downward (see src/config.ts)
  y: number;
  summary: string; // 1–2 original sentences
  wikiTitle: string; // page title on the wiki, for attribution links
  arcIds: string[]; // arcs that take place here
  positionSource: 'auto' | 'manual';
  // Not in the PLAN.md §5 interface, but §5 asks for anime-only islands to be
  // marked in data so the UI can style them as filler.
  animeOnly?: boolean;
}

export interface Arc {
  id: string; // e.g. "enies-lobby"
  name: string;
  saga: string; // e.g. "Water 7 Saga"
  order: number; // 1-based, sorted by first episode
  episodes: [number, number]; // anime episode range, inclusive; end may equal start for ongoing arcs
  filler: boolean; // true for anime-only arcs
  offRoute?: boolean; // true when the crew's ship isn't traveling
  locationIds: string[]; // in visit order within the arc
  chapters?: [number, number]; // optional manga reference, never used for logic
  summary: string; // 1–2 original sentences, spoiler-light
  ongoing?: boolean;
}

export interface CrewMember {
  id: string; // e.g. "zoro"
  name: string;
  role: string; // e.g. "Swordsman"
  joinedArcId: string; // arc in which they officially join
  joinedEpisode: number; // anime episode they're officially aboard from
}

export interface RouteSegment {
  fromLocationId: string;
  toLocationId: string;
  arcId: string; // arc this segment leads into
  waypoints?: [number, number][]; // optional bends so routes follow sea lanes
}
