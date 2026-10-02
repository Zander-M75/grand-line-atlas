/**
 * The crew's ship: an original, generic single-masted sailing ship (not any ship from the
 * series), as a Leaflet marker.
 *
 * At rest it's moored a little way back along the leg it arrived on, so it never hides the
 * island's own marker, tilted along its heading, and bobs gently. While sailing, the voyage
 * animation (src/map/Voyage.tsx) moves it frame by frame, so the marker is driven directly
 * rather than through React props.
 */
import { divIcon, marker, type Map as LeafletMap, type Marker } from 'leaflet';
import { shipTransform } from '@/animation/voyage';
import { TIMING } from '@/config';
import { toLatLng, type MapPoint } from './coords';
import type { ShipPose } from './journey';
import styles from './Ship.module.css';

const SIZE = { width: 40, height: 34 };
/** The middle of the hull, in icon pixels: the point that rides on the route line. */
const HULL = { x: 20, y: 24.5 };
/** How far back from the island the ship sits, in screen pixels. */
export const MOORING = 30;
/** From the hull back to the stern, where the wake starts, in screen pixels. */
export const STERN = 15;

const BOB_STYLE = `--bob-period: ${TIMING.shipBobPeriod}s; --bob-height: ${-TIMING.shipBobPx}px`;

// Drawn facing east (bow on the right). Turned with shipTransform; the hull is the pivot.
const shipSvg = (heading: MapPoint) => `
<span class="${styles.bob}" style="${BOB_STYLE}">
<svg viewBox="0 0 40 34" width="${SIZE.width}" height="${SIZE.height}" aria-hidden="true"
  style="transform: ${shipTransform(heading)}; transform-origin: ${HULL.x}px ${HULL.y}px">
  <path class="${styles.rigging}" d="M33.5 20.5 39 16.5M19 3.5v17" />
  <path class="${styles.flag}" d="M19 3.5 25.5 5 19 6.5Z" />
  <path class="${styles.sail}" d="M11.5 7q7.5 1.5 15 0 2 5.5 0 11-7.5-1.5-15 0 2-5.5 0-11Z" />
  <path class="${styles.hull}" d="M4 20.5h31.5l-5 7.5q-11 1.6-22 0Z" />
</svg>
</span>`;

export interface ShipHandle {
  /** At rest at an island: moored, bobbing. Null hides the ship. */
  moor(pose: ShipPose | null): void;
  /** Underway: the hull sits exactly on `point`, pointing along `heading`. */
  sail(point: MapPoint, heading: MapPoint): void;
  remove(): void;
}

export function createShip(map: LeafletMap): ShipHandle {
  let ship: Marker | null = null;
  let sailing = false;

  const place = (point: MapPoint, icon: Parameters<Marker['setIcon']>[0]) => {
    if (!ship) {
      ship = marker(toLatLng(point.x, point.y), {
        icon,
        interactive: false,
        keyboard: false,
        // Under the islands, so the name of the island it's moored at stays readable.
        zIndexOffset: -1000,
      }).addTo(map);
    } else {
      ship.setIcon(icon);
      ship.setLatLng(toLatLng(point.x, point.y));
    }
  };

  return {
    moor(pose) {
      sailing = false;
      if (!pose) {
        ship?.remove();
        ship = null;
        return;
      }
      const { at, heading } = pose;
      place(
        at,
        divIcon({
          className: styles.ship,
          html: shipSvg(heading),
          iconSize: [SIZE.width, SIZE.height],
          // Anchoring past the hull moves the ship back along its heading, away from the island.
          iconAnchor: [HULL.x + heading.x * MOORING, HULL.y + heading.y * MOORING],
        }),
      );
    },

    sail(point, heading) {
      if (!sailing || !ship) {
        sailing = true;
        place(
          point,
          divIcon({
            className: `${styles.ship} ${styles.sailing}`,
            html: shipSvg(heading),
            iconSize: [SIZE.width, SIZE.height],
            iconAnchor: [HULL.x, HULL.y],
          }),
        );
        return;
      }
      ship.setLatLng(toLatLng(point.x, point.y));
      const svg = ship.getElement()?.querySelector('svg');
      if (svg) svg.style.transform = shipTransform(heading);
    },

    remove() {
      ship?.remove();
      ship = null;
    },
  };
}
