import { divIcon } from 'leaflet';
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { BANDS, ZONES } from '@/config';
import type { Location } from '@/types';
import { fromLatLng, toLatLng, type MapPoint } from './coords';
import styles from './IslandMarker.module.css';

interface IslandMarkerProps {
  location: Location;
  /** Dev positioner only: lets the island be dragged, reporting where it's dropped. */
  onMove?: (point: MapPoint) => void;
}

/** An island: a small chart-style dot, with its name shown at closer zoom levels. */
export function IslandMarker({ location, onMove }: IslandMarkerProps) {
  const variant = markerVariant(location);
  const above = labelGoesAbove(location);
  const draggable = Boolean(onMove);
  const icon = useMemo(
    () =>
      divIcon({
        className: [
          styles.marker,
          styles[variant],
          above && styles.above,
          draggable && styles.draggable,
        ]
          .filter(Boolean)
          .join(' '),
        html: `<span class="${styles.dot}"></span><span class="${styles.label}">${escapeHtml(location.name)}</span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [location.name, variant, above, draggable],
  );

  return (
    <Marker
      position={toLatLng(location.x, location.y)}
      icon={icon}
      title={location.name}
      draggable={draggable}
      eventHandlers={
        onMove ? { dragend: (event) => onMove(fromLatLng(event.target.getLatLng())) } : undefined
      }
    />
  );
}

function markerVariant(location: Location): 'sky' | 'undersea' | 'animeOnly' | 'canon' {
  if (location.region === 'sky') return 'sky';
  if (location.region === 'undersea') return 'undersea';
  return location.animeOnly ? 'animeOnly' : 'canon';
}

/**
 * Labels point away from the Grand Line's centerline: islands just north of it are labeled
 * above, everything else below. Grand Line islands alternate sides, so neighbors' labels
 * land on opposite sides instead of colliding.
 */
function labelGoesAbove(location: Location): boolean {
  if (location.region === 'sky') return true;
  const nearGrandLine =
    location.y >= BANDS.northCalmBelt.top && location.y <= BANDS.southCalmBelt.bottom;
  return nearGrandLine && location.y < ZONES.grandLine.centerY;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
