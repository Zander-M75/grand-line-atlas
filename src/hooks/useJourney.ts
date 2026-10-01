import { useMemo } from 'react';
import { journeyAt, type Journey } from '@/map/journey';
import { selectCurrentArc, useAtlasStore, visibleArcs } from '@/store';

/** The map's view of the voyage at the current arc (see src/map/journey.ts). */
export function useJourney(): Journey {
  const showFiller = useAtlasStore((state) => state.settings.showFiller);
  const arc = useAtlasStore(selectCurrentArc);
  return useMemo(() => journeyAt(visibleArcs(showFiller), arc), [showFiller, arc]);
}
