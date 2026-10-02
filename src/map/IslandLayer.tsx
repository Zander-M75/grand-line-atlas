import { useMapEvents } from 'react-leaflet';
import { useJourney } from '@/hooks/useJourney';
import { useZoomLabels } from '@/hooks/useZoomLabels';
import { selectLocation, useAtlasStore } from '@/store';
import { IslandMarker } from './IslandMarker';

/**
 * The islands on the timeline's arcs, each marked by where it sits in the story so far.
 * Hiding anime-only arcs hides the places only they visit, and islands past the viewer's
 * spoiler limit aren't drawn at all. Clicking an island opens its panel; clicking open sea
 * closes it.
 */
export function IslandLayer() {
  useZoomLabels();
  const { islands } = useJourney();
  const selectedId = useAtlasStore((state) => state.selectedLocationId);
  useMapEvents({ click: () => selectLocation(null) });

  return islands.map(({ location, state }) => (
    <IslandMarker
      key={location.id}
      location={location}
      state={state}
      selected={location.id === selectedId}
      onSelect={selectLocation}
    />
  ));
}
