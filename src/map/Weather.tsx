/**
 * Weather around a few islands (WEATHER in config.ts): snow over Drum Island, fog drifting
 * around Thriller Bark, and a glitter of light over Skypiea. Each is a small patch of
 * particles (tsParticles) pinned to its island, growing and shrinking with the map.
 *
 * A patch only runs while it could be seen: its island is on the map (on the timeline and
 * inside the spoiler limit), on screen, and the map is zoomed in far enough. Leaving any of
 * those stops it and frees its canvas.
 *
 * This module and tsParticles are loaded only when weather is on (see WorldMap), and never
 * with reduced motion.
 */
import { tsParticles, type Container, type ISourceOptions } from '@tsparticles/engine';
import { loadBasic } from '@tsparticles/basic';
import { loadStarShape } from '@tsparticles/shape-star';
import { latLngBounds, type LatLngBounds } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Pane, SVGOverlay, useMap, useMapEvents } from 'react-leaflet';
import { WEATHER, type WeatherKind } from '@/config';
import { useJourney } from '@/hooks/useJourney';
import type { Location } from '@/types';
import { toLatLng } from './coords';
import { PICTURE_ATTRIBUTES } from './overlay';
import styles from './Weather.module.css';

/** Counts loads, for unique ids: tsParticles replaces any container that shares an id. */
let loads = 0;

// The particle features the patches use, loaded once with this module.
const engineReady = (async () => {
  await loadBasic(tsParticles);
  await loadStarShape(tsParticles);
})();

export default function Weather() {
  const map = useMap();
  const { islands } = useJourney();
  const [view, setView] = useState(() => ({ bounds: map.getBounds(), zoom: map.getZoom() }));
  useMapEvents({
    moveend: () => setView({ bounds: map.getBounds(), zoom: map.getZoom() }),
  });

  const spots = islands.flatMap(({ location }) => {
    const kind = (WEATHER.spots as Record<string, WeatherKind>)[location.id];
    const bounds = patchBounds(location);
    const visible = view.zoom >= WEATHER.minZoom && view.bounds.intersects(bounds);
    return kind && visible ? [{ location, kind, bounds }] : [];
  });

  return (
    // Over the route, under the islands and the ship.
    <Pane name="weather" style={{ zIndex: 550, pointerEvents: 'none' }}>
      {spots.map(({ location, kind, bounds }) => (
        <Patch key={location.id} kind={kind} bounds={bounds} />
      ))}
    </Pane>
  );
}

/**
 * One patch: an overlay covering the island's surroundings, holding a particle canvas that
 * fills it. It has no viewBox, so as the map zooms the canvas is resized, not stretched.
 */
function Patch({ kind, bounds }: { kind: WeatherKind; bounds: LatLngBounds }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    // Each run gets its own stage with its own id, so a run still loading when it's cleaned
    // up can't take the next run's canvas down with it.
    const stage = document.createElement('div');
    stage.id = `weather-${kind}-${++loads}`;
    stage.className = styles.stage ?? '';
    host.current.append(stage);
    let container: Container | undefined;
    let stopped = false;
    void engineReady
      .then(() => tsParticles.load({ element: stage, options: OPTIONS[kind] }))
      .then((loaded) => {
        if (stopped) loaded?.destroy();
        else container = loaded;
      });

    return () => {
      stopped = true;
      container?.destroy();
      stage.remove();
    };
  }, [kind]);

  return (
    <SVGOverlay bounds={bounds} attributes={PICTURE_ATTRIBUTES}>
      <foreignObject width="100%" height="100%">
        <div ref={host} className={styles[kind]} />
      </foreignObject>
    </SVGOverlay>
  );
}

function patchBounds({ x, y }: Location): LatLngBounds {
  const r = WEATHER.radius;
  return latLngBounds([toLatLng(x - r, y + r), toLatLng(x + r, y - r)]);
}

// ---------------------------------------------------------------------------
// The weather itself. Sizes and speeds are in screen pixels; counts are per 400 × 400
// screen pixels, so a patch looks equally dense at every zoom.

const COMMON = {
  fullScreen: { enable: false },
  background: { color: 'transparent' },
  detectRetina: true,
  fpsLimit: 60,
  pauseOnOutsideViewport: true,
} satisfies ISourceOptions;

const density = (value: number) => ({ value, density: { enable: true, width: 400, height: 400 } });

const OPTIONS: Record<WeatherKind, ISourceOptions> = {
  // Flakes drifting down, small and soft.
  snow: {
    ...COMMON,
    particles: {
      number: density(70),
      paint: { color: { value: '#f4f1e8' } },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.45, max: 0.95 } },
      size: { value: { min: 1, max: 2.6 } },
      move: {
        enable: true,
        direction: 'bottom',
        speed: { min: 0.4, max: 1.1 },
        drift: { min: -0.4, max: 0.4 },
        straight: false,
        outModes: 'out',
      },
    },
  },
  // Big, faint, slow puffs; the patch blurs them into banks of fog.
  fog: {
    ...COMMON,
    particles: {
      number: density(20),
      paint: { color: { value: ['#c9d3d4', '#aab7b9'] } },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.1, max: 0.22 } },
      size: { value: { min: 26, max: 52 } },
      move: { enable: true, direction: 'right', speed: { min: 0.08, max: 0.25 }, outModes: 'out' },
    },
  },
  // Pinpricks of light twinkling as they rise.
  sparkle: {
    ...COMMON,
    particles: {
      number: density(50),
      paint: { color: { value: ['#f2cf7a', '#fff6d8'] } },
      shape: { type: 'star', options: { star: { sides: 4, inset: 3 } } },
      opacity: {
        value: { min: 0.05, max: 1 },
        animation: { enable: true, speed: 0.9, sync: false },
      },
      size: { value: { min: 1.2, max: 3 } },
      move: { enable: true, direction: 'top', speed: { min: 0.05, max: 0.2 }, outModes: 'out' },
    },
  },
};
