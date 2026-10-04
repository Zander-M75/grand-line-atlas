import 'leaflet/dist/leaflet.css';
import { CRS, latLngBounds, setOptions } from 'leaflet';
import { lazy, Suspense, useEffect, useId, useState } from 'react';
import { MapContainer, useMap, ZoomControl } from 'react-leaflet';
import { FEATURES, ZOOM } from '@/config';
import { locations } from '@/data';
import { useDevToggle } from '@/hooks/useDevToggle';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAtlasStore } from '@/store';
import { BaseMap } from './BaseMap';
import { MAP_BOUNDS } from './coords';
import { DevCoordinateLogger } from './DevCoordinateLogger';
import { FitWorldZoom } from './FitWorldZoom';
import { IslandLayer } from './IslandLayer';
import { OceanEffects } from './OceanEffects';
import { Voyage } from './Voyage';
import styles from './WorldMap.module.css';

const PANNABLE_BOUNDS = latLngBounds(MAP_BOUNDS).pad(ZOOM.panPadding);

// Dev builds only, and loaded on first use: production never ships it.
const DevPositioner = import.meta.env.DEV ? lazy(() => import('./DevPositioner')) : null;

// Loaded (with tsParticles) only once weather is on.
const Weather = lazy(() => import('./Weather'));

/**
 * The Leaflet map, in CRS.Simple pixel space. Leaflet's default attribution is off;
 * credits live in the app footer.
 */
export function WorldMap() {
  const positioning = useDevToggle();
  const reducedMotion = useReducedMotion();
  const weather = useAtlasStore((state) => state.settings.weather);
  // Leaflet reads its animation options once, when the map is made (see LeafletMotion).
  const [reducedAtStart] = useState(reducedMotion);

  return (
    <MapContainer
      className={styles.map}
      crs={CRS.Simple}
      bounds={MAP_BOUNDS}
      // Placeholder until FitWorldZoom computes the real limit for this screen.
      minZoom={-5}
      maxZoom={ZOOM.max}
      zoomSnap={ZOOM.snap}
      zoomDelta={ZOOM.step}
      wheelPxPerZoomLevel={120}
      maxBounds={PANNABLE_BOUNDS}
      maxBoundsViscosity={1}
      attributionControl={false}
      zoomControl={false}
      zoomAnimation={!reducedAtStart}
      fadeAnimation={!reducedAtStart}
      markerZoomAnimation={!reducedAtStart}
    >
      <BaseMap />
      <OceanEffects />
      {DevPositioner && positioning ? (
        // Placing islands: every island, draggable. The route and ship are hidden, since
        // they'd still follow the saved positions while islands move.
        <Suspense fallback={null}>
          <DevPositioner locations={locations} />
        </Suspense>
      ) : (
        <>
          <Voyage />
          <IslandLayer />
          {FEATURES.weather && weather && !reducedMotion && (
            <Suspense fallback={null}>
              <Weather />
            </Suspense>
          )}
        </>
      )}
      <ZoomControl position="bottomright" />
      <FitWorldZoom />
      <LeafletMotion />
      <MapAccessibility />
      {import.meta.env.DEV && <DevCoordinateLogger />}
    </MapContainer>
  );
}

/**
 * What Leaflet leaves out for keyboard and screen reader users. It makes its container a Tab
 * stop (arrow keys pan, plus and minus zoom) but gives it no role, name, or hint about those
 * keys; the hint renders inside the container, hidden, since a description may point at
 * hidden text. Its zoom buttons are links with the button role, which Enter presses but Space
 * doesn't, as a button's should.
 */
function MapAccessibility() {
  const map = useMap();
  const hintId = useId();
  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Voyage map');
    container.setAttribute('aria-describedby', hintId);

    const pressWithSpace = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.key !== ' ' || !(target instanceof HTMLElement)) return;
      if (!target.matches('.leaflet-control a[role="button"]')) return;
      event.preventDefault();
      target.click();
    };
    container.addEventListener('keydown', pressWithSpace);
    return () => container.removeEventListener('keydown', pressWithSpace);
  }, [map, hintId]);
  return (
    <p id={hintId} hidden>
      Arrow keys pan the map, and plus and minus zoom. Each island is a button that opens its
      details.
    </p>
  );
}

/**
 * Leaflet's own motion under reduced motion. The zoom and fade animations are fixed when the
 * map is made (from the setting at load); if the setting changes later, the global CSS rule
 * that stills transitions makes them instant anyway. Panning inertia can change at any time.
 */
function LeafletMotion() {
  const map = useMap();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    setOptions(map, { inertia: !reducedMotion });
  }, [map, reducedMotion]);
  return null;
}
