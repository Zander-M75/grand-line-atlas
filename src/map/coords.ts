import type { LatLngBoundsLiteral, LatLngTuple } from 'leaflet';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';

/**
 * The one place map pixels and Leaflet coordinates meet. Nothing else converts inline.
 *
 * Map pixels use the base map's own space: origin top-left, y grows down.
 * Leaflet's CRS.Simple takes [lat, lng] = [y, x] with y growing *up*, so y is flipped.
 */

export interface MapPoint {
  x: number;
  y: number;
}

export function toLatLng(x: number, y: number): LatLngTuple {
  return [MAP_HEIGHT - y, x];
}

export function fromLatLng(latLng: { lat: number; lng: number }): MapPoint {
  return { x: latLng.lng, y: MAP_HEIGHT - latLng.lat };
}

/** The whole map, as Leaflet bounds: [[0, 0], [MAP_HEIGHT, MAP_WIDTH]]. */
export const MAP_BOUNDS: LatLngBoundsLiteral = [toLatLng(0, MAP_HEIGHT), toLatLng(MAP_WIDTH, 0)];

/**
 * The view center closest to `center` that keeps the whole view on the map. Where the view
 * is wider (or taller) than the map, it centers the map instead. In CRS.Simple, one map
 * pixel is 2^zoom screen pixels.
 */
export function keepOnMap(center: MapPoint, viewSize: MapPoint, zoom: number): MapPoint {
  const scale = 2 ** zoom;
  const clamp = (value: number, halfView: number, mapSize: number) =>
    halfView * 2 >= mapSize ? mapSize / 2 : Math.min(Math.max(value, halfView), mapSize - halfView);
  return {
    x: clamp(center.x, viewSize.x / 2 / scale, MAP_WIDTH),
    y: clamp(center.y, viewSize.y / 2 / scale, MAP_HEIGHT),
  };
}
