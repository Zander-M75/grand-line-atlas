/**
 * Weather around three islands (WEATHER in src/config.ts): snow at Drum Island, fog at
 * Thriller Bark, sparkles in the sky over Skypiea. A zone runs only while it's on screen at a
 * close enough zoom, for islands the viewer's spoiler limit shows, with weather on in Settings,
 * and never with reduced motion. tsParticles loads the first time a zone starts.
 */
import { latLngBounds, svgOverlay, type LatLngBounds } from 'leaflet';
import { useEffect, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { WEATHER, type WeatherKind } from '@/config';
import { useJourney } from '@/hooks/useJourney';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAtlasStore } from '@/store';
import { cx } from '@/utils/cx';
import { toLatLng } from '../coords';
import styles from './WeatherLayer.module.css';

const PANE = 'weather';

export function WeatherLayer() {
  const map = useMap();
  const on = useAtlasStore((state) => state.settings.weather);
  const reducedMotion = useReducedMotion();
  const { islands } = useJourney();
  const [view, setView] = useState(() => ({ zoom: map.getZoom(), bounds: map.getBounds() }));
  useMapEvents({
    moveend: () => setView({ zoom: map.getZoom(), bounds: map.getBounds() }),
  });

  // The zones' own pane, made once: above the islands and ship (markers are 600), and never
  // in the way of a click.
  useState(() => {
    if (map.getPane(PANE)) return;
    const pane = map.createPane(PANE);
    pane.style.zIndex = '620';
    pane.style.pointerEvents = 'none';
  });

  if (!on || reducedMotion || view.zoom < WEATHER.minZoom) return null;
  return WEATHER.zones.map(({ locationId, kind, radius }) => {
    const island = islands.find(({ location }) => location.id === locationId)?.location;
    if (!island || !view.bounds.intersects(zoneBounds(island.x, island.y, radius))) return null;
    return <WeatherZone key={locationId} kind={kind} x={island.x} y={island.y} radius={radius} />;
  });
}

function zoneBounds(x: number, y: number, radius: number): LatLngBounds {
  return latLngBounds([toLatLng(x - radius, y + radius), toLatLng(x + radius, y - radius)]);
}

interface WeatherZoneProps {
  kind: WeatherKind;
  /** The island, in map pixels, and how far the weather reaches around it. */
  x: number;
  y: number;
  radius: number;
}

/** One zone: a box on the map, sized with it as it zooms, holding the particle canvas. */
function WeatherZone({ kind, x, y, radius }: WeatherZoneProps) {
  const map = useMap();

  useEffect(() => {
    const element = document.createElement('div');
    element.className = cx(styles.zone, styles[kind]);
    // Leaflet's SVG overlay positions and sizes any element it's given, a <div> included.
    const layer = svgOverlay(element as unknown as SVGElement, zoneBounds(x, y, radius), {
      pane: PANE,
    }).addTo(map);
    let stopped = false;
    let stop = () => {};
    void import('./particles').then(async ({ startWeather }) => {
      if (stopped) return;
      const effect = await startWeather(element, kind);
      if (stopped) effect.stop();
      else stop = () => effect.stop();
    });
    return () => {
      stopped = true;
      stop();
      layer.remove();
    };
  }, [map, kind, x, y, radius]);

  return null;
}
