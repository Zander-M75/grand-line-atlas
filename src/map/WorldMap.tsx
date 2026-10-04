import 'leaflet/dist/leaflet.css';
import { CRS, latLngBounds, setOptions } from 'leaflet';
import { lazy, Suspense, useEffect, useState } from 'react';
import { MapContainer, useMap, ZoomControl } from 'react-leaflet';
import { ZOOM } from '@/config';
import { locations } from '@/data';
import { useDevToggle } from '@/hooks/useDevToggle';
import { useReducedMotion } from '@/hooks/useReducedMotion';
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

/**
 * The Leaflet map, in CRS.Simple pixel space. Leaflet's default attribution is off;
 * credits live in the app footer.
 */
export function WorldMap() {
  const positioning = useDevToggle();
  const reducedMotion = useReducedMotion();
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
        </>
      )}
      <ZoomControl position="bottomright" />
      <FitWorldZoom />
      <LeafletMotion />
      {import.meta.env.DEV && <DevCoordinateLogger />}
    </MapContainer>
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
