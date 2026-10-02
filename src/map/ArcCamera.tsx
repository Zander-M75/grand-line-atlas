/**
 * Keeps the current arc in view. On load it opens on the arc; after that it flies only when
 * the arc's legs and islands aren't already in the clear part of the screen (not under a
 * panel), and never zooms in on its own, so it doesn't fight a viewer who has panned or zoomed
 * somewhere. The voyage's three big crossings (CAMERA.dramatic) are the exception: stepping
 * into one always gets a slower, closer flight.
 *
 * While the viewer scrubs the timeline it waits for them to settle, then flies once. With
 * reduced motion it jumps instead of flying.
 *
 * It also nudges the view when an island's panel opens over that island.
 */
import { latLngBounds, point, type Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { CAMERA_EASE_LINEARITY } from '@/animation/easing';
import { isDramatic } from '@/animation/voyage';
import { CAMERA, TIMING } from '@/config';
import { locationById } from '@/data';
import { useJourney } from '@/hooks/useJourney';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAtlasStore } from '@/store';
import { fromLatLng, keepOnMap, toLatLng, type MapPoint } from './coords';
import { coverInsets, readCovers, type Insets } from './covers';

/** Screen pixels kept between a panel and whatever the camera frames beside it. */
const COVER_GAP = 24;

export function ArcCamera() {
  const map = useMap();
  const { arc, legs, focus } = useJourney();
  const reducedMotion = useReducedMotion();
  const shownOrder = useRef<number | null>(null);
  const lastChange = useRef(-Infinity);

  useEffect(() => {
    if (focus.length === 0) return;
    const previousOrder = shownOrder.current;
    shownOrder.current = arc.order;
    if (previousOrder === null) {
      frame(map, focus, CAMERA.arcZoom, { animate: false });
      return;
    }

    const now = performance.now();
    const scrubbing = now - lastChange.current < TIMING.scrubThreshold * 1000;
    lastChange.current = now;

    const current = legs.filter(({ state }) => state === 'current').map(({ shape }) => shape);
    const dramatic =
      !reducedMotion && arc.order > previousOrder && isDramatic(current, CAMERA.dramatic);
    const move = () => {
      if (dramatic) {
        const zoom = Math.max(map.getZoom(), CAMERA.arcZoom);
        frame(map, focus, zoom, {
          animate: true,
          duration: TIMING.cameraFlyDramatic,
          dramatic: true,
        });
      } else if (!inClearView(map, focus)) {
        frame(map, focus, map.getZoom(), { animate: !reducedMotion, duration: TIMING.cameraFly });
      }
    };
    if (!scrubbing) {
      move();
      return;
    }
    const settle = window.setTimeout(move, TIMING.scrubThreshold * 1000);
    return () => window.clearTimeout(settle);
  }, [map, arc.order, legs, focus, reducedMotion]);

  // An island's panel opening on top of the island: pan it back into the clear.
  const selectedId = useAtlasStore((state) => state.selectedLocationId);
  useEffect(() => {
    const location = selectedId ? locationById.get(selectedId) : undefined;
    if (!location) return;
    if (inClearView(map, [location])) return;
    const target = map.latLngToContainerPoint(toLatLng(location.x, location.y));
    const size = map.getSize();
    const insets = padded(coverInsets(readCovers(map.getContainer()), size), COVER_GAP);
    const clear = {
      x: insets.left + (size.x - insets.left - insets.right) / 2,
      y: insets.top + (size.y - insets.top - insets.bottom) / 2,
    };
    map.panBy(point(target.x - clear.x, target.y - clear.y), { animate: !reducedMotion });
  }, [map, selectedId, reducedMotion]);

  return null;
}

/**
 * Whether `points` are all on screen, clear of the screen's edges and not under a panel. The
 * panels are checked as the boxes they are, so a short logbook doesn't rule out the whole
 * left side of the screen below it.
 */
function inClearView(map: LeafletMap, points: MapPoint[]): boolean {
  const size = map.getSize();
  const covers = readCovers(map.getContainer());
  const marginX = size.x * 0.05;
  const marginY = size.y * 0.05;
  return points.every(({ x, y }) => {
    const at = map.latLngToContainerPoint(toLatLng(x, y));
    const onScreen =
      at.x >= marginX && at.x <= size.x - marginX && at.y >= marginY && at.y <= size.y - marginY;
    const covered = covers.some(
      (cover) =>
        at.x >= cover.left - COVER_GAP &&
        at.x <= cover.right + COVER_GAP &&
        at.y >= cover.top - COVER_GAP &&
        at.y <= cover.bottom + COVER_GAP,
    );
    return onScreen && !covered;
  });
}

/**
 * Fits `points` into the clear part of the view (CAMERA.padding from the edges, and clear of
 * the panels), no closer than `maxZoom`, without showing past the map's edges. Dramatic moves
 * always fly; others fly only when the zoom has to change.
 */
function frame(
  map: LeafletMap,
  points: MapPoint[],
  maxZoom: number,
  {
    animate,
    duration = TIMING.cameraFly,
    dramatic = false,
  }: { animate: boolean; duration?: number; dramatic?: boolean },
) {
  const size = map.getSize();
  const covers = coverInsets(readCovers(map.getContainer()), size);
  const insets = {
    top: Math.max(CAMERA.padding, covers.top + COVER_GAP),
    right: Math.max(CAMERA.padding, covers.right + COVER_GAP),
    bottom: Math.max(CAMERA.padding, covers.bottom + COVER_GAP),
    left: Math.max(CAMERA.padding, covers.left + COVER_GAP),
  };
  const bounds = latLngBounds(points.map(({ x, y }) => toLatLng(x, y)));
  const fitZoom = map.getBoundsZoom(
    bounds,
    false,
    point(insets.left + insets.right, insets.top + insets.bottom),
  );
  const zoom = Math.min(fitZoom, maxZoom);

  // Center the points in the clear part, which sits off the view's own center. Only the
  // uncovered part has to stay on the map: what's under a panel may run past its edge.
  const scale = 2 ** zoom;
  const middle = fromLatLng(bounds.getCenter());
  const shift = (by: Insets, sign: 1 | -1, from: MapPoint) => ({
    x: from.x + (sign * (by.left - by.right)) / 2 / scale,
    y: from.y + (sign * (by.top - by.bottom)) / 2 / scale,
  });
  const uncovered = keepOnMap(
    shift(covers, 1, shift(insets, -1, middle)),
    { x: size.x - covers.left - covers.right, y: size.y - covers.top - covers.bottom },
    zoom,
  );
  const center = shift(covers, -1, uncovered);
  const target = toLatLng(center.x, center.y);
  if (!animate) {
    map.setView(target, zoom, { animate: false });
  } else if (zoom === map.getZoom() && !dramatic) {
    // Same zoom: a plain pan, which Leaflet animates by sliding the map (cheap), where
    // flyTo would redraw every layer each frame as it arcs out and back in.
    map.panTo(target, { animate: true, duration, easeLinearity: CAMERA_EASE_LINEARITY });
  } else {
    map.flyTo(target, zoom, { duration, easeLinearity: CAMERA_EASE_LINEARITY });
  }
}

function padded(insets: Insets, gap: number): Insets {
  return {
    top: insets.top && insets.top + gap,
    right: insets.right && insets.right + gap,
    bottom: insets.bottom && insets.bottom + gap,
    left: insets.left && insets.left + gap,
  };
}
