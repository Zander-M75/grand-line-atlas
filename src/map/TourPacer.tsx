/**
 * Paces the guided tour: once the voyage to an arc has played and there's been time to read
 * about it (src/animation/tour.ts), it steps the timeline to the next arc, until the last one
 * the viewer may open.
 *
 * The viewer takes the helm by navigating: the timeline moving by any other means (the slider,
 * the step buttons, the arrow keys, an island's arc links), or a hand on the map (a drag, a
 * zoom, a click, its keys). Either one stops the tour.
 *
 * The wait runs on GSAP's clock, the one the voyage itself plays on, so while the tab is hidden
 * the tour pauses with the animations instead of sailing on unseen.
 */
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { tourHold } from '@/animation/tour';
import type { VoyagePlan } from '@/animation/voyagePlan';
import { TIMING } from '@/config';
import { selectLastOpenIndex, selectVisibleArcs, stepArc, stopTour, useAtlasStore } from '@/store';

export function TourPacer({ plan }: { plan: VoyagePlan }) {
  const map = useMap();
  const touring = useAtlasStore((state) => state.touring);
  // The arc the tour last sailed to, or started on. Null while it isn't running.
  const tourArc = useRef<string | null>(null);

  useEffect(() => {
    if (!touring) {
      tourArc.current = null;
      return;
    }
    const arcId = plan.journey.arc.id;
    const starting = tourArc.current === null;
    if (!starting && arcId !== tourArc.current) {
      stopTour(); // the viewer moved the timeline
      return;
    }

    const state = useAtlasStore.getState();
    const arcs = selectVisibleArcs(state);
    const index = arcs.findIndex((arc) => arc.id === arcId);
    const next = arcs[index + 1];
    if (index >= selectLastOpenIndex(state) || !next) {
      stopTour(); // the end of the voyage, or of what the viewer has seen
      return;
    }

    tourArc.current = arcId;
    // A tour from the first arc gives it time to be read; one started partway along the
    // timeline sails on right away.
    const wait = starting && index > 0 ? TIMING.tourLead : tourHold(plan);
    const call = gsap.delayedCall(wait, () => {
      tourArc.current = next.id;
      stepArc(1);
    });
    return () => {
      call.kill();
    };
  }, [touring, plan]);

  // A hand on the map stops the tour. Moving focus (Tab, and the modifier keys) doesn't.
  useEffect(() => {
    if (!touring) return;
    const container = map.getContainer();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!FOCUS_KEYS.has(event.key)) stopTour();
    };
    container.addEventListener('pointerdown', stopTour);
    container.addEventListener('wheel', stopTour, { passive: true });
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('pointerdown', stopTour);
      container.removeEventListener('wheel', stopTour);
      container.removeEventListener('keydown', onKeyDown);
    };
  }, [map, touring]);

  return null;
}

const FOCUS_KEYS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta']);
