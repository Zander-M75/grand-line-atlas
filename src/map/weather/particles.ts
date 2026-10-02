/**
 * The particle side of the weather, loaded on first use (tsParticles is only fetched once a
 * weather zone comes into view with weather on). Each kind is a small, slow effect in the
 * chart's own colors.
 */
import { tsParticles, type ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import type { WeatherKind } from '@/config';

/** The last load in flight: the plugins register once, then zones load one after another. */
let queue: Promise<unknown> | null = null;
let zoneCount = 0;

const BASE: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: 'transparent' },
  detectRetina: true,
  fpsLimit: 60,
  pauseOnBlur: true,
  pauseOnOutsideViewport: true,
};

const KINDS: Record<WeatherKind, ISourceOptions> = {
  // Drum Island: steady, light snowfall drifting a little with the wind.
  snow: {
    particles: {
      number: { value: 90, density: { enable: true, width: 300, height: 300 } },
      paint: { color: { value: '#f4efe2' } },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.45, max: 0.9 } },
      size: { value: { min: 1, max: 2.8 } },
      move: {
        enable: true,
        direction: 'bottom',
        speed: { min: 0.4, max: 1.1 },
        drift: { min: -0.3, max: 0.3 },
        straight: false,
        outModes: { default: 'out' },
      },
    },
  },
  // Thriller Bark: slow banks of pale mist, thinning and thickening.
  fog: {
    particles: {
      number: { value: 16, density: { enable: true, width: 300, height: 300 } },
      paint: { color: { value: '#c9ccc3' } },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.08, max: 0.28 },
        animation: { enable: true, speed: 0.15, sync: false },
      },
      size: { value: { min: 22, max: 48 } },
      move: {
        enable: true,
        direction: 'right',
        speed: { min: 0.1, max: 0.3 },
        straight: false,
        outModes: { default: 'out' },
      },
    },
  },
  // The sky over Skypiea: a few gold glints, twinkling in place.
  sparkle: {
    particles: {
      number: { value: 24, density: { enable: true, width: 300, height: 300 } },
      paint: { color: { value: ['#f2cf7a', '#fff6dc'] } },
      shape: { type: 'star', options: { star: { sides: 4, inset: 3 } } },
      opacity: {
        value: { min: 0.1, max: 1 },
        animation: { enable: true, speed: 0.8, sync: false },
      },
      size: { value: { min: 1.5, max: 3 } },
      move: { enable: true, speed: 0.08, direction: 'none', outModes: { default: 'bounce' } },
    },
  },
};

export interface WeatherEffect {
  stop(): void;
}

/** Starts `kind` filling `element`. Stop it when the zone leaves the screen. */
export async function startWeather(
  element: HTMLElement,
  kind: WeatherKind,
): Promise<WeatherEffect> {
  queue ??= loadSlim(tsParticles);
  // Each needs its own id: without one, tsParticles can reuse an id and replace a running zone.
  const id = `weather-${kind}-${++zoneCount}`;
  const loading = queue.then(() =>
    tsParticles.load({ id, element, options: { ...BASE, ...KINDS[kind] } }),
  );
  queue = loading.catch(() => undefined);
  const container = await loading;
  return { stop: () => container?.destroy() };
}
