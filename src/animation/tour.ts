/**
 * The guided tour's pace (see src/map/TourPacer.tsx): how long it stays on an arc before
 * sailing on. Plain data in, plain numbers out, so the pace can be tested without a browser.
 */
import { TIMING } from '@/config';
import type { Arc } from '@/types';
import { legDuration } from './sail';
import type { VoyagePlan } from './voyagePlan';

/** How long a plan takes to play: its moving legs sail one after another. */
export function voyageDuration(plan: VoyagePlan): number {
  return plan.moving.reduce((total, { track }) => total + legDuration(track.length), 0);
}

/** Time to read an arc's summary in the logbook. */
export function readingTime(arc: Arc): number {
  const words = arc.summary.trim().split(/\s+/).length;
  return words / TIMING.tourWordsPerSecond;
}

/**
 * How long the tour stays on the arc a plan arrives at: the voyage there, a pause, then time
 * to read about it. Under reduced motion nothing animates, so it's just the pause and reading.
 */
export function tourHold(plan: VoyagePlan): number {
  return voyageDuration(plan) + TIMING.tourPause + readingTime(plan.journey.arc);
}
