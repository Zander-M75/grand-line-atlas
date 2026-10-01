import { useZoomLabels } from '@/hooks/useZoomLabels';
import type { Location } from '@/types';
import { IslandMarker } from './IslandMarker';

/** Every island on the map. */
export function IslandLayer({ locations }: { locations: Location[] }) {
  useZoomLabels();
  return locations.map((location) => <IslandMarker key={location.id} location={location} />);
}
