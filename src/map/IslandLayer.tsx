import { useJourney } from '@/hooks/useJourney';
import { useZoomLabels } from '@/hooks/useZoomLabels';
import { IslandMarker } from './IslandMarker';

/**
 * The islands on the timeline's arcs, each marked by where it sits in the story so far.
 * Hiding anime-only arcs hides the places only they visit.
 */
export function IslandLayer() {
  useZoomLabels();
  const { islands } = useJourney();
  return islands.map(({ location, state }) => (
    <IslandMarker key={location.id} location={location} state={state} />
  ));
}
