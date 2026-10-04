/**
 * Keeps the voyage in view, clear of the panels floating over the map.
 *
 * - It opens on the current arc. When the intro plays first, it opens on the whole world and
 *   then flies down to the arc as the intro hands over.
 * - After that it moves only when the arc's legs and islands aren't comfortably on screen,
 *   and never zooms in on its own, so it doesn't fight a viewer who has panned or zoomed
 *   somewhere. Milestone crossings (Reverse Mountain, Fish-Man Island, the New World) are the
 *   exception: a slower flight that always moves in close on the crossing.
 * - While the timeline is being scrubbed, it waits until the scrubbing stops, then moves once.
 * - An island whose panel opens over it is panned back into view.
 *
 * With reduced motion every move is a jump (setView) instead of a flight (flyTo).
 */
import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { CAMERA, TIMING } from '@/config';
import { locationById } from '@/data';
import type { VoyagePlan } from '@/animation/voyagePlan';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAtlasStore } from '@/store';
import { cameraPadding, framePoints, inClearView, panToReveal } from './camera';

export function ArcCamera({ plan }: { plan: VoyagePlan }) {
  const map = useMap();
  const reducedMotion = useReducedMotion();
  const introPlaying = useAtlasStore((state) => state.introPlaying);
  const selectedId = useAtlasStore((state) => state.selectedLocationId);

  const framed = useRef<VoyagePlan | null>(null);
  const lastChange = useRef(-Infinity);
  // Whether this visit began with the intro, so the first framing is a flight, not a cut.
  const afterIntro = useRef(introPlaying);

  useEffect(() => {
    const { focus } = plan.journey;
    if (introPlaying || focus.length === 0 || plan === framed.current) return;

    if (!framed.current) {
      framed.current = plan;
      const target = framePoints(map, focus, cameraPadding(map), CAMERA.arcZoom);
      if (afterIntro.current && !reducedMotion) {
        map.flyTo(target.center, target.zoom, { duration: TIMING.cameraAfterIntro });
      } else {
        map.setView(target.center, target.zoom, { animate: false });
      }
      return;
    }
    framed.current = plan;

    // Changes in quick succession are scrubbing: hold the camera until they stop.
    const now = performance.now();
    const scrubbing = now - lastChange.current < TIMING.scrubThreshold * 1000;
    lastChange.current = now;
    if (!scrubbing) {
      follow(map, plan, !reducedMotion);
      return;
    }
    const timer = window.setTimeout(
      () => follow(map, plan, !reducedMotion),
      TIMING.scrubThreshold * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [map, plan, introPlaying, reducedMotion]);

  // Opening an island's panel can cover the island (on phones, the sheet covers the bottom
  // of the map): pan it back into the clear.
  useEffect(() => {
    const location = selectedId ? locationById.get(selectedId) : undefined;
    if (!location) return;
    const offset = panToReveal(map, location, cameraPadding(map));
    if (offset.x !== 0 || offset.y !== 0) map.panBy(offset, { animate: !reducedMotion });
  }, [map, selectedId, reducedMotion]);

  return null;
}

/** Brings the plan's arc into view if it isn't already (milestones: always, and slower). */
function follow(map: LeafletMap, plan: VoyagePlan, animate: boolean) {
  const { focus } = plan.journey;
  const padding = cameraPadding(map);
  const milestone = plan.milestone && animate;
  if (!milestone && inClearView(map, focus, padding)) return;

  const maxZoom = milestone ? CAMERA.milestoneZoom : map.getZoom();
  const target = framePoints(map, focus, padding, maxZoom);
  if (!animate) {
    map.setView(target.center, target.zoom, { animate: false });
    return;
  }
  map.flyTo(target.center, target.zoom, {
    duration: milestone ? TIMING.cameraFlyDramatic : TIMING.cameraFly,
  });
}
