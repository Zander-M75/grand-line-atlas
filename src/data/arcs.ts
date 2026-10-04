import type { Arc } from '@/types';

/**
 * The arc an episode belongs to. Anime-only arcs sometimes air inside a canon arc (Little
 * East Blue during Impel Down); there the canon arc wins.
 */
export function arcForEpisode(arcs: Arc[], episode: number): Arc | undefined {
  const containing = arcs.filter(
    ({ episodes: [start, end] }) => episode >= start && episode <= end,
  );
  return containing.find((arc) => !arc.filler) ?? containing[0];
}

/**
 * Where to land when anime-only arcs are hidden while one is showing: the canon arc it airs
 * inside, or else the last canon arc before it (the ship hasn't moved on yet).
 */
export function canonArcFor(arcs: Arc[], arc: Arc): Arc | undefined {
  if (!arc.filler) return arc;
  const canon = arcs.filter((a) => !a.filler);
  return (
    arcForEpisode(canon, arc.episodes[0]) ?? canon.findLast((a) => a.order < arc.order) ?? canon[0]
  );
}

/** Past the viewer's spoiler limit: the arc starts after the last episode they've seen. */
export function isLocked(arc: Arc, spoilerLimitEpisode: number | null): boolean {
  return spoilerLimitEpisode !== null && arc.episodes[0] > spoilerLimitEpisode;
}

/** "Ep. 264–312", or "Ep. 1029" for a one-episode arc. */
export function episodeLabel({ episodes: [start, end] }: Arc): string {
  return start === end ? `Ep. ${start}` : `Ep. ${start}–${end}`;
}

/** The same range, written out for screen readers: "episodes 264 to 312". */
export function episodeText({ episodes: [start, end] }: Arc): string {
  return start === end ? `episode ${start}` : `episodes ${start} to ${end}`;
}

/**
 * The arc as a screen reader hears it, with the notes the timeline shows as tags:
 * "Impel Down Arc, episodes 422 to 456, Summit War Saga, away from the ship".
 */
export function spokenArc(arc: Arc): string {
  return [
    arc.name,
    episodeText(arc),
    arc.saga,
    arc.filler && 'anime-only',
    arc.ongoing && 'now airing',
    arc.offRoute ? 'away from the ship' : arc.locationIds.length === 0 && 'no island stop',
  ]
    .filter(Boolean)
    .join(', ');
}

/** "Water 7 Saga" → "Water 7", for tight spaces. */
export function shortSagaName(saga: string): string {
  return saga.replace(/ Saga$/, '');
}
