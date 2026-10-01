import 'leaflet/dist/leaflet.css';
import { CRS, latLngBounds } from 'leaflet';
import { lazy, Suspense } from 'react';
import { MapContainer, ZoomControl } from 'react-leaflet';
import { ZOOM } from '@/config';
import { locations } from '@/data';
import { useDevToggle } from '@/hooks/useDevToggle';
import { BaseMap } from './BaseMap';
import { MAP_BOUNDS } from './coords';
import { DevCoordinateLogger } from './DevCoordinateLogger';
import { FitWorldZoom } from './FitWorldZoom';
import { IslandLayer } from './IslandLayer';
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
    >
      <BaseMap />
      {DevPositioner && positioning ? (
        <Suspense fallback={null}>
          <DevPositioner locations={locations} />
        </Suspense>
      ) : (
        <IslandLayer locations={locations} />
      )}
      <ZoomControl position="bottomright" />
      <FitWorldZoom />
      {import.meta.env.DEV && <DevCoordinateLogger />}
    </MapContainer>
  );
}
