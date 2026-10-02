import 'leaflet/dist/leaflet.css';
import { CRS, latLngBounds } from 'leaflet';
import { lazy, Suspense, type CSSProperties } from 'react';
import { MapContainer, ZoomControl } from 'react-leaflet';
import { TIMING, ZOOM } from '@/config';
import { locations } from '@/data';
import { useDevToggle } from '@/hooks/useDevToggle';
import { ArcCamera } from './ArcCamera';
import { BaseMap } from './BaseMap';
import { MAP_BOUNDS } from './coords';
import { DevCoordinateLogger } from './DevCoordinateLogger';
import { FitWorldZoom } from './FitWorldZoom';
import { IslandLayer } from './IslandLayer';
import { MapMotion } from './MapMotion';
import { OceanEffects } from './OceanEffects';
import { Voyage } from './Voyage';
import { WeatherLayer } from './weather/WeatherLayer';
import styles from './WorldMap.module.css';

// Timings the map's CSS animations read: the island pulse, and each half of the ocean swell.
const MAP_STYLE = {
  '--island-pulse-period': `${TIMING.islandPulsePeriod}s`,
  '--ocean-period': `${TIMING.oceanPeriod / 2}s`,
} as CSSProperties;

const PANNABLE_BOUNDS = latLngBounds(MAP_BOUNDS).pad(ZOOM.panPadding);

// Dev builds only, and loaded on first use: production never ships it.
const DevPositioner = import.meta.env.DEV ? lazy(() => import('./DevPositioner')) : null;

/**
 * The Leaflet map, in CRS.Simple pixel space. Leaflet's default attribution is off;
 * credits live in the app footer.
 */
export function WorldMap() {
  const positioning = useDevToggle();

  return (
    <MapContainer
      className={styles.map}
      style={MAP_STYLE}
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
          <WeatherLayer />
        </>
      )}
      <ZoomControl position="bottomright" />
      <FitWorldZoom />
      <ArcCamera />
      <MapMotion />
      {import.meta.env.DEV && <DevCoordinateLogger />}
    </MapContainer>
  );
}
