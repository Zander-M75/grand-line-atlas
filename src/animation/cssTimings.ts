/**
 * The timings that CSS animations use, published from TIMING (src/config.ts) as custom
 * properties on <html>, so a duration is set in one place whether JavaScript or CSS runs it.
 */
import { TIMING } from '@/config';

export const CSS_TIMINGS = {
  '--timing-ship-bob': `${TIMING.shipBobPeriod}s`,
  '--ship-bob-px': `${TIMING.shipBobPx}px`,
  '--timing-island-pulse': `${TIMING.islandPulsePeriod}s`,
  '--timing-intro-handover': `${TIMING.introHandover}s`,
} as const;

export function applyCssTimings(root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(CSS_TIMINGS)) root.style.setProperty(name, value);
}
