/**
 * The living ocean (PLAN.md §7 Phase 6): faint wave marks over open water, warped by an SVG
 * turbulence filter so they ripple. The Calm Belts have no marks, so they stay glassy.
 *
 * The plan animates the filter's base frequency directly, but a turbulence filter over the
 * whole map costs tens of milliseconds to redraw, which drops frames on every update. Instead
 * there are two copies of the marks, each warped by a fixed filter at a different base
 * frequency, cross-fading slowly into each other: the swell drifts between the two states,
 * and the browser only fades two finished layers (no filter redraws, except when zooming).
 * The fade is a CSS animation (its period, TIMING.oceanPeriod, is set on the map by WorldMap),
 * so it stops with reduced motion and in background tabs.
 *
 * While the zoom changes (a camera flight, a wheel zoom), the marks step aside: a flight
 * redraws every layer each frame, and the filter is the costliest of them.
 */
import { useEffect, useState } from 'react';
import { Pane, SVGOverlay, useMap, useMapEvents } from 'react-leaflet';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';
import { MAP_BOUNDS } from './coords';
import { wavePath } from './oceanShapes';
import styles from './OceanEffects.module.css';

const WAVES = wavePath();

/** The two swell states: the noise's base frequency (x, y) and seed for each. */
const SWELLS = [
  { frequency: '0.009 0.022', seed: 7, className: styles.swellA },
  { frequency: '0.0105 0.019', seed: 11, className: styles.swellB },
];

export function OceanEffects() {
  const map = useMap();
  const [zooming, setZooming] = useState(false);
  useMapEvents({
    zoomstart: () => setZooming(true),
    zoomend: () => setZooming(false),
  });
  useEffect(() => {
    map.getPane('ocean')?.classList.toggle(styles.zooming ?? '', zooming);
  }, [map, zooming]);

  return (
    // Over the base map (overlay pane, 400), under the route (450).
    <Pane name="ocean" style={{ zIndex: 420, pointerEvents: 'none' }}>
      {SWELLS.map(({ frequency, seed, className }, i) => (
        <SVGOverlay
          key={seed}
          bounds={MAP_BOUNDS}
          className={className}
          attributes={{ viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`, 'aria-hidden': 'true' }}
        >
          <filter
            id={`ocean-swell-${i}`}
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={frequency}
              numOctaves={1}
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={10}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <path className={styles.waves} d={WAVES} filter={`url(#ocean-swell-${i})`} />
        </SVGOverlay>
      ))}
    </Pane>
  );
}
