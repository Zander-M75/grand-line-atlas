/**
 * Leaflet's own zoom animation (mouse wheel, pinch, the +/− buttons) follows reduced motion
 * too: with it on, zooming jumps straight to the new level.
 *
 * Leaflet only reads its zoomAnimation option when the map is created, but it checks the
 * private `_zoomAnimated` flag on every zoom, so that's what changes here. Layers added while
 * it's off skip their zoom transitions until the page reloads, which only shows if the viewer
 * turns reduced motion back off mid-visit.
 */
import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function MapMotion() {
  const map = useMap();
  const reducedMotion = useReducedMotion();
  // Whether Leaflet animates zooms in this browser at all, as it decided at startup.
  const capable = useRef<boolean | null>(null);
  useEffect(() => {
    capable.current ??= zoomAnimated(map);
    setZoomAnimated(map, capable.current && !reducedMotion);
  }, [map, reducedMotion]);
  return null;
}

type LeafletInternals = { _zoomAnimated: boolean };

function zoomAnimated(map: LeafletMap): boolean {
  return (map as unknown as LeafletInternals)._zoomAnimated;
}

function setZoomAnimated(map: LeafletMap, animated: boolean) {
  (map as unknown as LeafletInternals)._zoomAnimated = animated;
}
