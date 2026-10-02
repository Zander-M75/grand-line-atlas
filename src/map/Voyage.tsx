/**
 * The voyage on the map: the route and the ship, animated as the timeline moves (PLAN.md §7
 * Phase 6). Stepping forward draws the new arc's legs while the ship sails them; stepping back
 * un-draws them. Scrubbing (changes closer together than TIMING.scrubThreshold) holds each
 * step's starting frame and only sails once the timeline settles, so animations never pile up.
 * With reduced motion, everything just appears.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { planVoyageMotion, SNAP, type VoyageMotion, type VoyageView } from '@/animation/voyage';
import { TIMING } from '@/config';
import { useJourney } from '@/hooks/useJourney';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { selectKnownArcs, useAtlasStore } from '@/store';
import { RouteLayer } from './RouteLayer';
import { createShip } from './ship';
import { playVoyage } from './voyageAnimator';
import { createWake, type Wake } from './wake';

export function Voyage() {
  const map = useMap();
  const arcs = useAtlasStore(selectKnownArcs);
  const journey = useJourney();
  const reducedMotion = useReducedMotion();

  // The motion is worked out while rendering, not in an effect, so legs being un-drawn are
  // still there in the very first frame after the change.
  const [shown, setShown] = useState<VoyageView>({ arcs, journey });
  const [motion, setMotion] = useState<VoyageMotion>(SNAP);
  const [finished, setFinished] = useState<VoyageMotion | null>(null);
  if (shown.journey !== journey) {
    setShown({ arcs, journey });
    setMotion(reducedMotion ? SNAP : planVoyageMotion(shown, { arcs, journey }));
  }
  const leaving = motion.kind === 'unsail' && finished !== motion ? motion.legs : [];

  const ship = useMemo(() => createShip(map), [map]);
  useEffect(() => () => ship.remove(), [ship]);

  const routeRef = useRef<SVGGElement>(null);
  const defsRef = useRef<SVGDefsElement>(null);
  const wakeRef = useRef<SVGGElement>(null);
  const wake = useRef<Wake | null>(null);
  const lastChange = useRef(-Infinity);

  useLayoutEffect(() => {
    if (!wake.current && wakeRef.current) wake.current = createWake(wakeRef.current);
    const now = performance.now();
    const scrubbing = now - lastChange.current < TIMING.scrubThreshold * 1000;
    lastChange.current = now;

    return playVoyage(
      {
        map,
        ship,
        wake: wake.current,
        route: routeRef.current,
        defs: defsRef.current,
      },
      journey,
      motion,
      { delay: scrubbing ? TIMING.scrubThreshold : 0, onDone: () => setFinished(motion) },
    );
  }, [map, ship, journey, motion]);

  return (
    <RouteLayer
      legs={journey.legs}
      leaving={leaving}
      routeRef={routeRef}
      defsRef={defsRef}
      wakeRef={wakeRef}
    />
  );
}
