/**
 * The crew's voyage on the map: the route, the ship, and the camera that follows them.
 *
 * When the timeline moves, it plans the change (src/animation/voyagePlan.ts) and plays it
 * (src/animation/sail.ts): the newest legs draw themselves while the ship sails along them,
 * or un-draw as the ship backs up when the timeline goes back. A change that arrives while
 * another is still playing cuts it short (it finishes at once), so changes never queue up.
 * The guided tour takes its pace from the same plan.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { sail, type LegElements, type ShipHandle } from '@/animation/sail';
import { planVoyage } from '@/animation/voyagePlan';
import { useJourney } from '@/hooks/useJourney';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAtlasStore } from '@/store';
import { ArcCamera } from './ArcCamera';
import { RouteLayer } from './RouteLayer';
import { Ship } from './Ship';
import { TourPacer } from './TourPacer';

export function Voyage() {
  const map = useMap();
  const journey = useJourney();
  const reducedMotion = useReducedMotion();
  const introPlaying = useAtlasStore((state) => state.introPlaying);

  const [plan, setPlan] = useState(() => planVoyage(null, journey, { animate: false }));
  if (plan.journey !== journey) {
    setPlan(planVoyage(plan.journey, journey, { animate: !reducedMotion && !introPlaying }));
  }

  const ship = useRef<ShipHandle>(null);
  const wake = useRef<SVGGElement>(null);
  const [legElements] = useState(() => new Map<string, LegElements>());

  useLayoutEffect(() => {
    const timeline = sail(plan, {
      legs: legElements,
      ship: ship.current,
      wake: wake.current,
      scale: () => map.getZoomScale(map.getZoom(), 0),
    });
    return () => {
      timeline?.progress(1).kill();
    };
  }, [map, plan, legElements]);

  return (
    <>
      <RouteLayer legs={plan.legs} elements={legElements} wakeRef={wake} />
      <Ship ref={ship} />
      <ArcCamera plan={plan} />
      <TourPacer plan={plan} />
    </>
  );
}
