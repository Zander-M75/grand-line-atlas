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

/** An amount for each side of a rectangle. */
export interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const NO_OVERSCAN: Sides = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * The view center closest to `center` that keeps the whole view on the map. Where the view
 * is wider (or taller) than the map, it centers the map instead. In CRS.Simple, one map
 * pixel is 2^zoom screen pixels.
 *
 * `overscan` lets the view run past each edge of the map by that many map pixels: the
 * camera allows it where a panel covers that side of the screen anyway.
 */
export function keepOnMap(
  center: MapPoint,
  viewSize: MapPoint,
  zoom: number,
  overscan: Sides = NO_OVERSCAN,
): MapPoint {
  const scale = 2 ** zoom;
  const clamp = (value: number, view: number, mapSize: number, before: number, after: number) => {
    const half = view / 2 / scale;
    const min = half - before;
    const max = mapSize - half + after;
    return min > max ? (min + max) / 2 : Math.min(Math.max(value, min), max);
  };
  return {
    x: clamp(center.x, viewSize.x, MAP_WIDTH, overscan.left, overscan.right),
    y: clamp(center.y, viewSize.y, MAP_HEIGHT, overscan.top, overscan.bottom),
  };
}
