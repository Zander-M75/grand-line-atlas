import { MAP_HEIGHT, MAP_WIDTH } from '@/config';

/**
 * Attributes for the map's SVG overlays (base map, ocean, route, weather). They're pictures:
 * hidden from assistive tech, and out of the Tab order. An inline <svg> clips whatever
 * overflows it, and Chrome makes a clipping element a keyboard-focusable scroller, so without
 * an explicit tabindex each overlay is an unnamed Tab stop.
 */
export const PICTURE_ATTRIBUTES = { 'aria-hidden': 'true', tabindex: '-1' } as const;

/** The same, for an overlay drawn in map pixels across the whole map. */
export const MAP_PICTURE_ATTRIBUTES = {
  ...PICTURE_ATTRIBUTES,
  viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,
} as const;
