/**
 * The crew's ship: an original, generic single-masted sailing ship (not any ship from the
 * series), moored at the last island the voyage reached. It sits a little way back along the
 * leg it arrived on, so it never hides the island's own marker, and faces the way it sailed.
 */
import { divIcon } from 'leaflet';
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { useJourney } from '@/hooks/useJourney';
import { cx } from '@/utils/cx';
import { toLatLng, type MapPoint } from './coords';
import styles from './Ship.module.css';

const SIZE = { width: 40, height: 34 };
/** The middle of the hull, in icon pixels: the point that rides on the route line. */
const HULL = { x: 20, y: 24.5 };
/** How far back from the island the ship sits, in screen pixels. */
const MOORING = 30;

// Drawn facing east (bow on the right). Mirrored when sailing west.
const SHIP_SVG = `
<svg viewBox="0 0 40 34" width="${SIZE.width}" height="${SIZE.height}" aria-hidden="true">
  <path class="${styles.rigging}" d="M33.5 20.5 39 16.5M19 3.5v17" />
  <path class="${styles.flag}" d="M19 3.5 25.5 5 19 6.5Z" />
  <path class="${styles.sail}" d="M11.5 7q7.5 1.5 15 0 2 5.5 0 11-7.5-1.5-15 0 2-5.5 0-11Z" />
  <path class="${styles.hull}" d="M4 20.5h31.5l-5 7.5q-11 1.6-22 0Z" />
</svg>`;

export function Ship() {
  const { ship } = useJourney();
  if (!ship) return null;
  return <MooredShip at={ship.at} heading={ship.heading} />;
}

function MooredShip({ at, heading }: { at: MapPoint; heading: MapPoint }) {
  const icon = useMemo(
    () =>
      divIcon({
        className: cx(styles.ship, heading.x < 0 && styles.west),
        html: SHIP_SVG,
        iconSize: [SIZE.width, SIZE.height],
        // Anchoring past the hull moves the ship back along its heading, away from the island.
        iconAnchor: [HULL.x + heading.x * MOORING, HULL.y + heading.y * MOORING],
      }),
    [heading.x, heading.y],
  );

  return (
    <Marker
      position={toLatLng(at.x, at.y)}
      icon={icon}
      interactive={false}
      keyboard={false}
      zIndexOffset={1000}
    />
  );
}
