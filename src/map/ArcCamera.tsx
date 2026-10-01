/**
 * Keeps the current arc in view. On load it opens on the arc; after that it moves only when
 * the arc's legs and islands aren't already on screen, and never zooms in on its own, so it
 * doesn't fight a viewer who has panned or zoomed somewhere.
 */
import { latLngBounds, point, type Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { CAMERA } from '@/config';
import { useJourney } from '@/hooks/useJourney';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { fromLatLng, keepOnMap, toLatLng, type MapPoint } from './coords';

export function ArcCamera() {
  const map = useMap();
  const { focus } = useJourney();
  const reducedMotion = useReducedMotion();
  const opened = useRef(false);

  useEffect(() => {
    if (focus.length === 0) return;

    if (!opened.current) {
      opened.current = true;
      frame(map, focus, CAMERA.arcZoom, false);
      return;
    }
    // "In view" means clear of the screen's edges, not just barely on it.
    const bounds = latLngBounds(focus.map(({ x, y }) => toLatLng(x, y)));
    if (!map.getBounds().pad(-0.1).contains(bounds)) {
      frame(map, focus, map.getZoom(), !reducedMotion);
    }
  }, [map, focus, reducedMotion]);

  return null;
}

/** Fits `points` in view, no closer than `maxZoom`, without showing past the map's edges. */
function frame(map: LeafletMap, points: MapPoint[], maxZoom: number, animate: boolean) {
  const bounds = latLngBounds(points.map(({ x, y }) => toLatLng(x, y)));
  const padding = point(CAMERA.padding * 2, CAMERA.padding * 2);
  const zoom = Math.min(map.getBoundsZoom(bounds, false, padding), maxZoom);
  const { x, y } = keepOnMap(fromLatLng(bounds.getCenter()), map.getSize(), zoom);
  map.setView(toLatLng(x, y), zoom, { animate });
}
