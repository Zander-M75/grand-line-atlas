/**
 * The spoiler rules. Viewers say the last episode they've seen (the limit); null means
 * they're caught up. From that:
 *
 * - Arcs that start after the limit are locked: on the timeline as locked stops only, and
 *   nowhere else (no islands, route, or crew from them).
 * - The arc the limit falls inside is in progress: it shows, but only as far as its setup.
 *   Its name and summary appear, the map shows only its first stop, and crew who join later
 *   in it stay hidden.
 */
import type { Arc, CrewMember } from '@/types';
import { isLocked } from './arcs';

/** The viewer is partway through this arc: it has started, but not finished, by the limit. */
export function isInProgress(arc: Arc, spoilerLimitEpisode: number | null): boolean {
  if (spoilerLimitEpisode === null) return false;
  const [start, end] = arc.episodes;
  return start <= spoilerLimitEpisode && spoilerLimitEpisode < end;
}

// Cached per list and limit, so the same inputs always return the same array (the map's
// leg geometry is cached by array, and store subscribers compare by identity).
const knownByArcs = new WeakMap<Arc[], Map<number, Arc[]>>();

/**
 * The arcs the viewer may know about, in the same order: locked arcs are dropped, and an arc
 * in progress keeps only its first stop. With no limit, it's `arcs` itself.
 */
export function knownArcs(arcs: Arc[], spoilerLimitEpisode: number | null): Arc[] {
  if (spoilerLimitEpisode === null) return arcs;

  let byLimit = knownByArcs.get(arcs);
  if (!byLimit) {
    byLimit = new Map();
    knownByArcs.set(arcs, byLimit);
  }
  let known = byLimit.get(spoilerLimitEpisode);
  if (!known) {
    known = arcs
      .filter((arc) => !isLocked(arc, spoilerLimitEpisode))
      .map((arc) =>
        isInProgress(arc, spoilerLimitEpisode) && arc.locationIds.length > 1
          ? { ...arc, locationIds: arc.locationIds.slice(0, 1) }
          : arc,
      );
    byLimit.set(spoilerLimitEpisode, known);
  }
  return known;
}

export interface CrewAboard {
  member: CrewMember;
  /** They officially join during this arc. */
  joinsHere: boolean;
}

/**
 * Who's aboard by the end of `arc`, leaving out anyone who joins after the viewer's limit.
 * Joins are compared by episode, not arc order: Cidre Guild (895–896) is listed after Wano
 * Country (890–1085) but airs before Jinbe joins in episode 980.
 */
export function crewAboard(
  crew: CrewMember[],
  arc: Arc,
  spoilerLimitEpisode: number | null,
): CrewAboard[] {
  const lastEpisode = Math.min(arc.episodes[1], spoilerLimitEpisode ?? Infinity);
  return crew
    .filter((member) => member.joinedEpisode <= lastEpisode)
    .map((member) => ({ member, joinsHere: member.joinedArcId === arc.id }));
}
