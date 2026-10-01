/**
 * App-wide constants: the title, the map's coordinate space and zones, animation
 * timings, and feature switches. Layout and timing tweaks happen here, not in components.
 *
 * The Node data scripts import this file too (auto-layout reads the zones), so it
 * must stay free of browser- and Vite-only APIs such as `window` or `import.meta.env`,
 * and its imports need explicit `.ts` extensions so Node can load it natively.
 */
import type { Region } from './types.ts';

export const APP_TITLE = 'Grand Line Atlas';

// ---------------------------------------------------------------------------
// Map space (PLAN.md §6)
//
// All coordinates are map pixels in the base SVG's space: origin at the top-left,
// x grows right, y grows down. Converting to Leaflet's [lat, lng] happens in one
// helper (toLatLng) and nowhere else.
// ---------------------------------------------------------------------------

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 2000;

/**
 * The world is a cylinder flattened onto a rectangle. The Red Line runs down the middle,
 * where the Grand Line crosses it at Mary Geoise (Fish-Man Island lies beneath). The left
 * and right map edges are the same meridian: the far side of the Red Line, where Reverse
 * Mountain stands. The voyage reads left to right: Paradise fills the west half of the
 * Grand Line, the New World the east half.
 */
export const ZONES = {
  /** The central Red Line band. */
  redLine: { centerX: 2000, width: 120 },
  /** How much of the Red Line shows at each map edge, where it wraps around. */
  redLineEdge: { width: 60 },
  grandLine: { centerY: 1000, height: 260 },
  /** Height of each Calm Belt; one sits directly above the Grand Line and one directly below. */
  calmBelt: { height: 70 },
  reverseMountain: { x: 60, y: 1000 },
} as const;

/** Derived bands, in map pixels. Read these rather than recomputing from ZONES. */
export const BANDS = {
  grandLine: {
    top: ZONES.grandLine.centerY - ZONES.grandLine.height / 2,
    bottom: ZONES.grandLine.centerY + ZONES.grandLine.height / 2,
  },
  northCalmBelt: {
    top: ZONES.grandLine.centerY - ZONES.grandLine.height / 2 - ZONES.calmBelt.height,
    bottom: ZONES.grandLine.centerY - ZONES.grandLine.height / 2,
  },
  southCalmBelt: {
    top: ZONES.grandLine.centerY + ZONES.grandLine.height / 2,
    bottom: ZONES.grandLine.centerY + ZONES.grandLine.height / 2 + ZONES.calmBelt.height,
  },
  redLine: {
    left: ZONES.redLine.centerX - ZONES.redLine.width / 2,
    right: ZONES.redLine.centerX + ZONES.redLine.width / 2,
  },
  /** West half of the Grand Line: from Reverse Mountain to the Red Line. */
  paradise: {
    left: ZONES.redLineEdge.width,
    right: ZONES.redLine.centerX - ZONES.redLine.width / 2,
  },
  /** East half of the Grand Line: from the Red Line to the map's east edge. */
  newWorld: {
    left: ZONES.redLine.centerX + ZONES.redLine.width / 2,
    right: MAP_WIDTH - ZONES.redLineEdge.width,
  },
} as const;

/**
 * Zoom levels follow Leaflet's CRS.Simple: at zoom 0 one map pixel is one screen pixel,
 * and each step doubles or halves that. The farthest-out zoom isn't fixed: it's whatever
 * fits the whole map in the viewport, recomputed when the window resizes.
 */
export const ZOOM = {
  max: 1,
  /** Zoom levels snap to multiples of this (fractional zoom lets the map fit any screen). */
  snap: 0.25,
  /** How far one press of +/- or one wheel notch zooms. */
  step: 0.5,
  /** How far past the map's edge the view may pan, as a fraction of the map's size. */
  panPadding: 0.1,
  /** Island names show from this zoom in; farther out, islands are dots only. */
  labels: -0.5,
} as const;

/** How the camera frames the current arc. */
export const CAMERA = {
  /** On load, the camera opens on the current arc at this zoom (or farther out, to fit it). */
  arcZoom: 0,
  /** Screen pixels kept clear around whatever the camera frames. */
  padding: 72,
} as const;

export type Quadrant = 'nw' | 'ne' | 'sw' | 'se';
type Blue = Extract<Region, `${string}-blue`>;

/**
 * Which quadrant each Blue occupies (north/south of the Calm Belts, west/east of the Red Line).
 * East Blue sits north-west so the journey starts near Reverse Mountain and reads left to right.
 * Opposite Blues sit diagonally from each other.
 */
export const BLUE_QUADRANTS: Record<Blue, Quadrant> = {
  'east-blue': 'nw',
  'north-blue': 'ne',
  'south-blue': 'sw',
  'west-blue': 'se',
};

// ---------------------------------------------------------------------------
// Animation timings. All durations are in seconds, the unit GSAP, Framer Motion,
// and Leaflet's flyTo share. Easing curves live in src/animation/.
// ---------------------------------------------------------------------------

export const TIMING = {
  /** Route segments draw at this speed, clamped to the min/max duration below. */
  routeDrawPxPerSecond: 900,
  routeDrawMin: 0.6,
  routeDrawMax: 2.4,
  cameraFly: 1.2,
  /** Crossing Reverse Mountain, descending to Fish-Man Island, entering the New World. */
  cameraFlyDramatic: 2.4,
  shipBobPeriod: 2.6,
  shipBobPx: 2.5,
  islandPulsePeriod: 2,
  panel: 0.28,
  arcCardFade: 0.22,
  intro: 3.5,
  /** Timeline changes closer together than this count as scrubbing: snap, don't animate. */
  scrubThreshold: 0.25,
} as const;

// ---------------------------------------------------------------------------
// Feature switches: whether an optional feature ships at all. Viewers can still
// turn enabled ones off in Settings.
// ---------------------------------------------------------------------------

export const FEATURES = {
  intro: true,
  weather: true,
  sound: true,
} as const;
