import { useEffect, useRef } from 'react';
import { chime } from '@/audio/sea';
import { crew } from '@/data';
import { crewAboard } from '@/data/spoilers';
import { selectCurrentArc, useAtlasStore } from '@/store';

/**
 * Rings the chime when the timeline moves to an arc where someone joins the crew (someone
 * the viewer's spoiler limit lets them see). Silent unless sound is on.
 */
export function useCrewChime() {
  const arc = useAtlasStore(selectCurrentArc);
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const previous = useRef(arc);

  useEffect(() => {
    if (arc === previous.current) return;
    previous.current = arc;
    if (crewAboard(crew, arc, limit).some(({ joinsHere }) => joinsHere)) chime();
  }, [arc, limit]);
}
