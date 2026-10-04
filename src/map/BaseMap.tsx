/**
 * The world map's base art: open ocean, the Calm Belts, the Grand Line, the Red Line,
 * a graticule, a compass rose, region labels, and a chart border. All original, drawn
 * as inline SVG from the zones in src/config.ts, so moving a zone there moves the art.
 *
 * It's inline (an SVGOverlay) rather than an <img> so it stays vector-sharp at every
 * zoom and its labels can use the app's web fonts, which SVG images can't load.
 *
 * During the first-visit intro, the Red Line and the Grand Line (with their labels) sit
 * behind clip rectangles that grow to draw them in (src/animation/intro.ts).
 */
import { useLayoutEffect, useRef } from 'react';
import { SVGOverlay } from 'react-leaflet';
import { revealTimeline } from '@/animation/intro';
import { BANDS, BLUE_QUADRANTS, MAP_HEIGHT, MAP_WIDTH, ZONES, type Quadrant } from '@/config';
import { useAtlasStore } from '@/store';
import { compassRose, graticule, neatlineBars, redLineBand } from './baseMapShapes';
import { MAP_BOUNDS } from './coords';
import { MAP_PICTURE_ATTRIBUTES } from './overlay';
import styles from './BaseMap.module.css';

const GRID_SPACING = 250;
const NEATLINE_DEPTH = 14;

const QUADRANT_CENTERS: Record<Quadrant, { x: number; y: number }> = {
  nw: { x: (BANDS.paradise.left + BANDS.redLine.left) / 2, y: BANDS.northCalmBelt.top / 2 },
  ne: { x: (BANDS.redLine.right + BANDS.newWorld.right) / 2, y: BANDS.northCalmBelt.top / 2 },
  sw: {
    x: (BANDS.paradise.left + BANDS.redLine.left) / 2,
    y: (BANDS.southCalmBelt.bottom + MAP_HEIGHT) / 2,
  },
  se: {
    x: (BANDS.redLine.right + BANDS.newWorld.right) / 2,
    y: (BANDS.southCalmBelt.bottom + MAP_HEIGHT) / 2,
  },
};

const BLUE_NAMES = {
  'east-blue': 'East Blue',
  'west-blue': 'West Blue',
  'north-blue': 'North Blue',
  'south-blue': 'South Blue',
} as const;

// Geometry is computed once, at module load.
const RED_LINE_BANDS = [
  redLineBand(BANDS.redLine.left, BANDS.redLine.right, 1),
  redLineBand(0, ZONES.redLineEdge.width, 2),
  redLineBand(MAP_WIDTH - ZONES.redLineEdge.width, MAP_WIDTH, 3),
];
const GRATICULE = graticule(GRID_SPACING);
const NEATLINE = neatlineBars(GRID_SPACING, NEATLINE_DEPTH);

// The compass sits in the south-east sea, clear of that quadrant's label.
const COMPASS = { x: QUADRANT_CENTERS.se.x + 620, y: QUADRANT_CENTERS.se.y + 40, radius: 150 };
const COMPASS_SHAPES = compassRose(COMPASS.x, COMPASS.y, COMPASS.radius);

const CLIP = { redLine: 'intro-clip-red-line', grandLine: 'intro-clip-grand-line' } as const;

export function BaseMap() {
  const introPlaying = useAtlasStore((state) => state.introPlaying);
  const redLineClip = useRef<SVGRectElement>(null);
  const grandLineClip = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    const [redLine, grandLine] = [redLineClip.current, grandLineClip.current];
    if (!introPlaying || !redLine || !grandLine) return;
    const timeline = revealTimeline({ redLine, grandLine });
    return () => {
      timeline.kill();
    };
  }, [introPlaying]);

  // While the intro plays, these groups are clipped to rectangles that start empty.
  const clip = (id: string) => (introPlaying ? `url(#${id})` : undefined);

  return (
    <SVGOverlay bounds={MAP_BOUNDS} attributes={MAP_PICTURE_ATTRIBUTES}>
      <Gradients />
      {introPlaying && (
        <defs>
          <clipPath id={CLIP.redLine}>
            <rect ref={redLineClip} width={MAP_WIDTH} height={0} />
          </clipPath>
          <clipPath id={CLIP.grandLine}>
            <rect ref={grandLineClip} width={0} height={MAP_HEIGHT} />
          </clipPath>
        </defs>
      )}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#basemap-ocean)" />
      <g clipPath={clip(CLIP.grandLine)}>
        <CalmBelts />
        <GrandLine />
      </g>
      <path className={styles.graticule} d={GRATICULE} />
      <g clipPath={clip(CLIP.redLine)}>
        <RedLine />
      </g>
      <CompassRose />
      <BlueLabels />
      <g clipPath={clip(CLIP.grandLine)}>
        <BandLabels />
      </g>
      <g clipPath={clip(CLIP.redLine)}>
        <RedLineLabel />
      </g>
      <Neatline />
    </SVGOverlay>
  );
}

function Gradients() {
  return (
    <defs>
      {/* Open water: deepest toward the poles, lifting toward the equator. */}
      <linearGradient id="basemap-ocean" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--color-ocean-deep)' }} />
        <stop offset="0.4" style={{ stopColor: 'var(--color-ocean)' }} />
        <stop offset="0.6" style={{ stopColor: 'var(--color-ocean)' }} />
        <stop offset="1" style={{ stopColor: 'var(--color-ocean-deep)' }} />
      </linearGradient>
      {/* Grand Line: fades in and out at its edges instead of stopping hard. */}
      <linearGradient id="basemap-grand-line" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--color-grand-line)', stopOpacity: 0 }} />
        <stop offset="0.16" style={{ stopColor: 'var(--color-grand-line)', stopOpacity: 1 }} />
        <stop offset="0.84" style={{ stopColor: 'var(--color-grand-line)', stopOpacity: 1 }} />
        <stop offset="1" style={{ stopColor: 'var(--color-grand-line)', stopOpacity: 0 }} />
      </linearGradient>
      {/* Calm Belts: a soft sheen across still, glassy water. */}
      <linearGradient id="basemap-calm-sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--color-paper)', stopOpacity: 0 }} />
        <stop offset="0.5" style={{ stopColor: 'var(--color-paper)', stopOpacity: 0.12 }} />
        <stop offset="1" style={{ stopColor: 'var(--color-paper)', stopOpacity: 0 }} />
      </linearGradient>
      {/* Red Line rock: shadowed at the cliff faces, lit along the ridge. */}
      <linearGradient id="basemap-rock" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: 'var(--color-red-line-shadow)' }} />
        <stop offset="0.24" style={{ stopColor: 'var(--color-red-line)' }} />
        <stop offset="0.5" style={{ stopColor: 'var(--color-red-line-light)' }} />
        <stop offset="0.76" style={{ stopColor: 'var(--color-red-line)' }} />
        <stop offset="1" style={{ stopColor: 'var(--color-red-line-shadow)' }} />
      </linearGradient>
    </defs>
  );
}

function CalmBelts() {
  return (
    <g>
      {[BANDS.northCalmBelt, BANDS.southCalmBelt].map((belt) => (
        <g key={belt.top}>
          <rect
            className={styles.calmBelt}
            y={belt.top}
            width={MAP_WIDTH}
            height={belt.bottom - belt.top}
          />
          <rect
            y={belt.top}
            width={MAP_WIDTH}
            height={belt.bottom - belt.top}
            fill="url(#basemap-calm-sheen)"
          />
          <path className={styles.calmBeltEdge} d={`M0 ${belt.top}H${MAP_WIDTH}`} />
          <path className={styles.calmBeltEdge} d={`M0 ${belt.bottom}H${MAP_WIDTH}`} />
        </g>
      ))}
    </g>
  );
}

function GrandLine() {
  // The soft edge bleeds a little way into the Calm Belts on either side.
  const bleed = ZONES.calmBelt.height * 0.4;
  return (
    <rect
      y={BANDS.grandLine.top - bleed}
      width={MAP_WIDTH}
      height={BANDS.grandLine.bottom - BANDS.grandLine.top + bleed * 2}
      fill="url(#basemap-grand-line)"
    />
  );
}

function RedLine() {
  return (
    <g>
      {RED_LINE_BANDS.map((band, i) => (
        <g key={i}>
          <path d={band.outline} fill="url(#basemap-rock)" />
          <path className={styles.hachures} d={band.hachures} />
        </g>
      ))}
    </g>
  );
}

function CompassRose() {
  const { x, y, radius } = COMPASS;
  return (
    <g className={styles.compass}>
      <circle className={styles.compassRing} cx={x} cy={y} r={radius} />
      <circle className={styles.compassRing} cx={x} cy={y} r={radius * 0.86} />
      <path className={styles.compassRing} d={COMPASS_SHAPES.ticks} />
      <path className={styles.compassShaded} d={COMPASS_SHAPES.minorShaded} />
      <path className={styles.compassLit} d={COMPASS_SHAPES.minorLit} />
      <path className={styles.compassShaded} d={COMPASS_SHAPES.majorShaded} />
      <path className={styles.compassLit} d={COMPASS_SHAPES.majorLit} />
      <text className={styles.compassNorth} x={x} y={y - radius - 22} textAnchor="middle">
        N
      </text>
    </g>
  );
}

/** The four Blues, lettered across their quadrants. */
function BlueLabels() {
  return (
    <g>
      {Object.entries(BLUE_QUADRANTS).map(([blue, quadrant]) => (
        <text
          key={blue}
          className={`${styles.label} ${styles.blueLabel}`}
          x={QUADRANT_CENTERS[quadrant].x}
          y={QUADRANT_CENTERS[quadrant].y}
          textAnchor="middle"
        >
          {BLUE_NAMES[blue as keyof typeof BLUE_NAMES]}
        </text>
      ))}
    </g>
  );
}

/** Paradise and the New World along the Grand Line, and the two Calm Belts. */
function BandLabels() {
  const grandLineBaseline = ZONES.grandLine.centerY + 18;
  const calmBeltBaseline = (belt: { top: number; bottom: number }) =>
    (belt.top + belt.bottom) / 2 + 9;

  return (
    <g>
      <text
        className={`${styles.label} ${styles.grandLineLabel}`}
        x={(BANDS.paradise.left + BANDS.paradise.right) / 2}
        y={grandLineBaseline}
        textAnchor="middle"
      >
        Paradise
      </text>
      <text
        className={`${styles.label} ${styles.grandLineLabel}`}
        x={(BANDS.newWorld.left + BANDS.newWorld.right) / 2}
        y={grandLineBaseline}
        textAnchor="middle"
      >
        New World
      </text>

      <text
        className={`${styles.label} ${styles.calmBeltLabel}`}
        x={QUADRANT_CENTERS.nw.x}
        y={calmBeltBaseline(BANDS.northCalmBelt)}
        textAnchor="middle"
      >
        Calm Belt
      </text>
      <text
        className={`${styles.label} ${styles.calmBeltLabel}`}
        x={QUADRANT_CENTERS.se.x}
        y={calmBeltBaseline(BANDS.southCalmBelt)}
        textAnchor="middle"
      >
        Calm Belt
      </text>
    </g>
  );
}

/** Reads bottom to top, lettered up the rock like a mountain range. */
function RedLineLabel() {
  return (
    <text
      className={`${styles.label} ${styles.redLineLabel}`}
      x={ZONES.redLine.centerX}
      y={BANDS.northCalmBelt.top / 2}
      textAnchor="middle"
      dominantBaseline="central"
      transform={`rotate(-90 ${ZONES.redLine.centerX} ${BANDS.northCalmBelt.top / 2})`}
    >
      Red Line
    </text>
  );
}

function Neatline() {
  return (
    <g>
      <path className={styles.neatlineBars} d={NEATLINE} />
      <rect className={styles.neatlineRule} width={MAP_WIDTH} height={MAP_HEIGHT} />
      <rect
        className={styles.neatlineRule}
        x={NEATLINE_DEPTH}
        y={NEATLINE_DEPTH}
        width={MAP_WIDTH - NEATLINE_DEPTH * 2}
        height={MAP_HEIGHT - NEATLINE_DEPTH * 2}
      />
    </g>
  );
}
