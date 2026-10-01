/**
 * The URL carries the current arc, so any view can be shared: `?arc=enies-lobby`. Links can
 * also name an episode, `?ep=300`, which opens the arc that episode belongs to.
 */
import { useEffect } from 'react';
import { arcs, firstArc } from '@/data';
import { arcForEpisode } from '@/data/arcs';
import { goToArc, useAtlasStore } from '@/store';
import type { Arc } from '@/types';

/**
 * The arc a query string points to: `arc` by id, else `ep` by episode, else the first arc.
 * Where an anime-only arc airs inside a canon one, an episode resolves to the canon arc.
 */
export function arcFromSearch(search: string): Arc {
  const params = new URLSearchParams(search);
  const byId = arcs.find((arc) => arc.id === params.get('arc'));
  if (byId) return byId;
  const episode = params.get('ep') ?? '';
  const byEpisode = /^\d+$/.test(episode) ? arcForEpisode(arcs, Number(episode)) : undefined;
  return byEpisode ?? firstArc;
}

/**
 * Opens the arc the page's URL points to. Call once, before the first render, so the app
 * never flashes the first arc on the way. Linking to an anime-only arc turns filler on.
 */
export function restoreFromUrl(search = window.location.search) {
  goToArc(arcFromSearch(search).id);
}

/** Keeps `?arc=` in step with the current arc, without adding history entries. */
export function useUrlSync() {
  const arcId = useAtlasStore((state) => state.currentArcId);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('ep');
    url.searchParams.set('arc', arcId);
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, '', url);
    }
  }, [arcId]);
}
