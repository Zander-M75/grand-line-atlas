/**
 * The ocean's slow swell: rows of small engraved wave marks over open water, warped by an
 * SVG turbulence filter whose frequency drifts slowly back and forth, so the marks ripple.
 * The Calm Belts get none: still water, as the name says.
 *
 * A turbulence filter is costly to redraw, so the swell redraws at most TIMING.oceanFps times
 * a second (it moves far too slowly to need more), pauses while the map is moving or the tab
 * is hidden, and holds still with reduced motion.
 */
import { useEffect, useRef } from 'react';
import { SVGOverlay, useMap } from 'react-leaflet';
import { BANDS, MAP_HEIGHT, MAP_WIDTH, TIMING, ZONES } from '@/config';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MAP_BOUNDS } from './coords';
import styles from './OceanEffects.module.css';

/** The turbulence's resting frequency (across, down): long, low swells running east-west. */
const FREQUENCY = { x: 0.0055, y: 0.016 };
/** How far the frequency drifts either way over one swell, as a fraction. */
const DRIFT = 0.12;
/** Keeps wave marks off the rock and the chart's border. */
const MARGIN = 24;

// Open water: north of the north Calm Belt, the Grand Line itself, south of the south one,
// each split around the Red Line.
const ROWS = [
  { top: MARGIN, bottom: BANDS.northCalmBelt.top },
  { top: BANDS.grandLine.top, bottom: BANDS.grandLine.bottom },
  { top: BANDS.southCalmBelt.bottom, bottom: MAP_HEIGHT - MARGIN },
];
const COLUMNS = [
  { left: ZONES.redLineEdge.width + MARGIN, right: BANDS.redLine.left - MARGIN },
  { left: BANDS.redLine.right + MARGIN, right: MAP_WIDTH - ZONES.redLineEdge.width - MARGIN },
];

export function OceanEffects() {
  const map = useMap();
  const reducedMotion = useReducedMotion();
  const turbulence = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    const element = turbulence.current;
    if (!element || reducedMotion) return;

    let frame = 0;
    let lastDraw = 0;
    let moving = false;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (moving || now - lastDraw < 1000 / TIMING.oceanFps) return;
      lastDraw = now;
      const phase = (now / 1000 / TIMING.oceanSwellPeriod) * 2 * Math.PI;
      element.setAttribute('baseFrequency', frequency(Math.sin(phase), Math.cos(phase)));
    };
    const start = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };
    const pause = () => (moving = true);
    const resume = () => (moving = false);

    start();
    document.addEventListener('visibilitychange', start);
    map.on('movestart zoomstart', pause);
    map.on('moveend zoomend', resume);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', start);
      map.off('movestart zoomstart', pause);
      map.off('moveend zoomend', resume);
    };
  }, [map, reducedMotion]);

  return (
    <SVGOverlay
      bounds={MAP_BOUNDS}
      attributes={{ viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`, 'aria-hidden': 'true' }}
    >
      <defs>
        {/* Two staggered marks per tile, like the hand-cut waves on an old chart. */}
        <pattern id="ocean-waves" width="112" height="64" patternUnits="userSpaceOnUse">
          <path className={styles.wave} d="M10 18q7-6 14 0t14 0" />
          <path className={styles.wave} d="M66 50q7-6 14 0t14 0" />
        </pattern>
        <filter
          id="ocean-swell"
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
        >
          <feTurbulence
            ref={turbulence}
            type="fractalNoise"
            baseFrequency={frequency(0, 1)}
            numOctaves={2}
            seed={11}
            result="swell"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="swell"
            scale={22}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g filter="url(#ocean-swell)">
        {ROWS.flatMap((row) =>
          COLUMNS.map((column) => (
            <rect
              key={`${row.top}:${column.left}`}
              x={column.left}
              y={row.top}
              width={column.right - column.left}
              height={row.bottom - row.top}
              fill="url(#ocean-waves)"
            />
          )),
        )}
      </g>
    </SVGOverlay>
  );
}

/** The baseFrequency attribute, drifted by -1..1 along each axis. */
function frequency(driftX: number, driftY: number): string {
  const x = FREQUENCY.x * (1 + DRIFT * driftX);
  const y = FREQUENCY.y * (1 + DRIFT * driftY);
  return `${x.toFixed(5)} ${y.toFixed(5)}`;
}
