/**
 * The crew's ship: an original, generic single-masted sailing ship (not any ship from the
 * series). It trails a little behind its point on the route, so when moored it never hides
 * the island's own marker, and it faces (and tilts toward) the way it's sailing.
 *
 * The voyage animation moves it every frame, so it's driven imperatively through a
 * ShipHandle (moor, sail) rather than by props: a Leaflet marker whose position and pose
 * are set directly, with no React render per frame.
 */
import { divIcon, marker as createMarker, type Marker } from 'leaflet';
import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';
import { useMap } from 'react-leaflet';
import { facingFor, shipTransform, type Facing } from '@/animation/ship';
import type { ShipHandle } from '@/animation/sail';
import type { ShipPose } from './journey';
import { toLatLng } from './coords';
import styles from './Ship.module.css';

const SIZE = { width: 40, height: 34 };
/** The middle of the hull, in icon pixels: the point that rides on the route line. */
const HULL = { x: 20, y: 24.5 };

// Drawn facing east (bow on the right). The outer wrapper takes the ship's pose (position
// behind its point, tilt, mirroring); the inner one bobs.
const SHIP_ICON = divIcon({
  className: styles.ship,
  html: `
<div class="${styles.pose}" style="transform-origin: ${HULL.x}px ${HULL.y}px">
  <div class="${styles.bob}">
    <svg viewBox="0 0 40 34" width="${SIZE.width}" height="${SIZE.height}" aria-hidden="true">
      <path class="${styles.rigging}" d="M33.5 20.5 39 16.5M19 3.5v17" />
      <path class="${styles.flag}" d="M19 3.5 25.5 5 19 6.5Z" />
      <path class="${styles.sail}" d="M11.5 7q7.5 1.5 15 0 2 5.5 0 11-7.5-1.5-15 0 2-5.5 0-11Z" />
      <path class="${styles.hull}" d="M4 20.5h31.5l-5 7.5q-11 1.6-22 0Z" />
    </svg>
  </div>
</div>`,
  iconSize: [SIZE.width, SIZE.height],
  iconAnchor: [HULL.x, HULL.y],
});

export function Ship({ ref }: { ref: Ref<ShipHandle> }) {
  const map = useMap();
  const markerRef = useRef<Marker | null>(null);
  const facing = useRef<Facing>('east');

  // A layout effect, so the marker exists before the voyage (the parent) first places it.
  useLayoutEffect(() => {
    markerRef.current = createMarker([0, 0], {
      icon: SHIP_ICON,
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    });
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [map]);

  useImperativeHandle(ref, () => {
    function place(pose: ShipPose, sailing: boolean) {
      const marker = markerRef.current;
      if (!marker) return;
      marker.setLatLng(toLatLng(pose.at.x, pose.at.y));
      if (!map.hasLayer(marker)) marker.addTo(map);

      // Under way, a course running north or south keeps the ship facing the way it was.
      facing.current = facingFor(pose.heading, sailing ? facing.current : undefined);
      const element = marker.getElement();
      if (!element) return;
      element.dataset.sailing = String(sailing);
      const posed = element.firstElementChild;
      if (posed instanceof HTMLElement) {
        posed.style.transform = shipTransform(pose.heading, facing.current);
      }
    }

    return {
      moor: (pose) => (pose ? place(pose, false) : markerRef.current?.remove()),
      sail: (pose) => place(pose, true),
    };
  }, [map]);

  return null;
}
