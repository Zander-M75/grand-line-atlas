import { divIcon, type LeafletEvent, type LeafletKeyboardEvent } from 'leaflet';
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { BANDS, ZONES } from '@/config';
import type { Location } from '@/types';
import { cx } from '@/utils/cx';
import { fromLatLng, toLatLng, type MapPoint } from './coords';
import { islandLabel, type IslandState } from './journey';
import styles from './IslandMarker.module.css';

interface IslandMarkerProps {
  location: Location;
  /** Where the island sits in the story so far. Unset in the dev positioner. */
  state?: IslandState;
  /** Its panel is open. */
  selected?: boolean;
  /** Clicking the island (or Enter or Space on it) opens its panel. */
  onSelect?: (locationId: string) => void;
  /** Dev positioner only: lets the island be dragged, reporting where it's dropped. */
  onMove?: (point: MapPoint) => void;
}

/**
 * An island: a small chart-style dot, with its name shown at closer zoom levels (and farther
 * out, on hover or focus). The current arc's islands are ringed in brass and always named;
 * islands still ahead are faded. Leaflet makes each one a focusable button; screen readers
 * hear its name and where it sits in the story (`islandLabel`) instead of the visible label.
 */
export function IslandMarker({ location, state, selected, onSelect, onMove }: IslandMarkerProps) {
  const variant = markerVariant(location);
  const above = labelGoesAbove(location);
  const draggable = Boolean(onMove);
  const spokenName = islandLabel(location, state);
  const icon = useMemo(
    () =>
      divIcon({
        className: cx(
          styles.marker,
          styles[variant],
          state && styles[state],
          selected && styles.selected,
          above && styles.above,
          draggable && styles.draggable,
        ),
        html:
          `<span class="${styles.dot}"></span>` +
          `<span class="${styles.label}" aria-hidden="true">${escapeHtml(location.name)}` +
          (state === 'away' ? `<span class="${styles.note}">Away from the ship</span>` : '') +
          `</span>` +
          `<span class="visually-hidden">${escapeHtml(spokenName)}</span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [location.name, spokenName, variant, state, selected, above, draggable],
  );

  const eventHandlers = useMemo(() => {
    if (onMove) {
      return { dragend: (event: LeafletEvent) => onMove(fromLatLng(event.target.getLatLng())) };
    }
    if (!onSelect) return undefined;
    return {
      click: () => onSelect(location.id),
      // Leaflet makes markers focusable buttons but doesn't press them from the keyboard.
      keydown: ({ originalEvent }: LeafletKeyboardEvent) => {
        if (originalEvent.key !== 'Enter' && originalEvent.key !== ' ') return;
        originalEvent.preventDefault();
        onSelect(location.id);
      },
    };
  }, [location.id, onMove, onSelect]);

  return (
    <Marker
      position={toLatLng(location.x, location.y)}
      icon={icon}
      // ArcCamera pans a focused island into view instead, clear of the panels too.
      autoPanOnFocus={false}
      draggable={draggable}
      eventHandlers={eventHandlers}
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
