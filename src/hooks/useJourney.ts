import { useMemo } from 'react';
import { firstArc } from '@/data';
import { journeyAt, type Journey } from '@/map/journey';
import { selectKnownArcs, useAtlasStore } from '@/store';

/**
 * The map's view of the voyage at the current arc (see src/map/journey.ts), drawn only from
 * what the viewer's spoiler limit lets them know.
 */
export function useJourney(): Journey {
  const arcs = useAtlasStore(selectKnownArcs);
  const arcId = useAtlasStore((state) => state.currentArcId);
  return useMemo(
    // The current arc is never locked, so it's always known (possibly cut to its setup).
    () => journeyAt(arcs, arcs.find((arc) => arc.id === arcId) ?? firstArc),
    [arcs, arcId],
  );
}
