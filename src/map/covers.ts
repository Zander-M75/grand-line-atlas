/**
 * The panels floating over the map (the logbook, the island panel) hide part of it. The
 * camera frames things in the part that's left, so an arc or a clicked island never ends up
 * under a panel.
 *
 * Panels mark themselves with a `data-map-cover` attribute. Each one is treated as hugging
 * the map edge it takes the least away from: the logbook is a left-side column on wide
 * screens and a strip across the top on phones; the island panel is a right-side column or a
 * bottom sheet.
 */
import type { MapPoint } from './coords';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** A cover is ignored if heeding it would leave less than this share of the map's width or height. */
const MIN_FREE = 0.3;

/** How far each edge of a `size` view is covered by `rects` (in the same screen pixels). */
export function coverInsets(rects: Rect[], size: MapPoint): Insets {
  const insets = { ...NO_INSETS };
  for (const rect of rects) {
    const options: [keyof Insets, number, number][] = [
      ['left', rect.right, size.x],
      ['right', size.x - rect.left, size.x],
      ['top', rect.bottom, size.y],
      ['bottom', size.y - rect.top, size.y],
    ];
    const [side, amount] = options.reduce((best, option) =>
      option[1] / option[2] < best[1] / best[2] ? option : best,
    );
    insets[side] = Math.max(insets[side], amount);
  }
  if (size.x - insets.left - insets.right < size.x * MIN_FREE) insets.left = insets.right = 0;
  if (size.y - insets.top - insets.bottom < size.y * MIN_FREE) insets.top = insets.bottom = 0;
  return insets;
}

/**
 * The covers over a map, in its container's pixels. They share the map's offset parent (the
 * map area). Hidden covers are skipped.
 */
export function readCovers(container: HTMLElement): Rect[] {
  const area = container.parentElement;
  if (!area) return [];
  return Array.from(area.querySelectorAll<HTMLElement>('[data-map-cover]'))
    .filter((cover) => cover.offsetParent !== null)
    .map((cover) => {
      // Layout boxes, not transformed ones: a panel still sliding in counts where it'll land.
      const left = cover.offsetLeft - container.offsetLeft;
      const top = cover.offsetTop - container.offsetTop;
      return {
        left,
        top,
        right: left + cover.offsetWidth,
        bottom: top + cover.offsetHeight,
      };
    });
}
