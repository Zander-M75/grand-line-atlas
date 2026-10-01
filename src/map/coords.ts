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
