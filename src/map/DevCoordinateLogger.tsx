import { useMapEvents } from 'react-leaflet';
import { fromLatLng } from './coords';

/**
 * Dev only: logs the map-pixel coordinates of every click, for placing things by hand.
 * WorldMap renders it behind `import.meta.env.DEV`, so it's dropped from production builds.
 */
export function DevCoordinateLogger() {
  useMapEvents({
    click(event) {
      const { x, y } = fromLatLng(event.latlng);
      console.log('[map]', { x: Math.round(x), y: Math.round(y) });
    },
  });
  return null;
}
