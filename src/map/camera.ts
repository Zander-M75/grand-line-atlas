/**
 * Camera geometry: the part of the map the viewer can actually see past the floating panels,
 * and the view that frames a set of points inside it.
 *
 * Panels that cover the map mark themselves with a `data-covers-map` attribute. Each one is
 * treated as covering a whole side: a panel wider than most of the map covers the top or
 * bottom (phones' logbook and island sheet), anything else covers the left or right.
 */
import { latLngBounds, point, type LatLngTuple, type Map as LeafletMap, type Point } from 'leaflet';
import { CAMERA, MAP_HEIGHT, MAP_WIDTH, ZOOM } from '@/config';
import { fromLatLng, keepOnMap, toLatLng, type MapPoint, type Sides } from './coords';

export interface CameraPadding {
  /** Screen pixels to keep clear at the view's top-left and bottom-right corners. */
  topLeft: Point;
  bottomRight: Point;
  /** Screen pixels covered by panels along each side of the map. */
  covered: Sides;
}

export const COVERS_MAP = 'data-covers-map';

/** A panel this much wider than the map covers its top or bottom rather than a side. */
const SPANNING = 0.6;
/** If panels would leave less than this share of the map clear, ignore them. */
const MIN_CLEAR = 0.3;

export function cameraPadding(map: LeafletMap): CameraPadding {
  const size = map.getSize();
  const covered = { top: 0, right: 0, bottom: 0, left: 0 };

  for (const panel of map.getContainer().parentElement?.querySelectorAll(`[${COVERS_MAP}]`) ?? []) {
    if (!(panel instanceof HTMLElement) || panel.offsetWidth === 0) continue;
    // Layout boxes, not getBoundingClientRect: a panel still sliding in counts where it lands.
    const left = panel.offsetLeft;
    const top = panel.offsetTop;
    const right = left + panel.offsetWidth;
    const bottom = top + panel.offsetHeight;
    if (panel.offsetWidth > size.x * SPANNING) {
      if (top + bottom < size.y) covered.top = Math.max(covered.top, bottom);
      else covered.bottom = Math.max(covered.bottom, size.y - top);
    } else if (left + right < size.x) {
      covered.left = Math.max(covered.left, right);
    } else {
      covered.right = Math.max(covered.right, size.x - left);
    }
  }

  const tooCramped =
    size.x - covered.left - covered.right < size.x * MIN_CLEAR ||
    size.y - covered.top - covered.bottom < size.y * MIN_CLEAR;
  if (tooCramped) Object.assign(covered, { top: 0, right: 0, bottom: 0, left: 0 });
  const side = (cover: number) => (cover > 0 ? cover + CAMERA.panelGap : CAMERA.padding);
  return {
    topLeft: point(side(covered.left), side(covered.top)),
    bottomRight: point(side(covered.right), side(covered.bottom)),
    covered,
  };
}

/** Whether every point is already on screen, clear of the panels. */
export function inClearView(map: LeafletMap, points: MapPoint[], padding: CameraPadding): boolean {
  const size = map.getSize();
  return points.every(({ x, y }) => {
    const { x: left, y: top } = map.latLngToContainerPoint(toLatLng(x, y));
    return (
      left >= padding.topLeft.x &&
      top >= padding.topLeft.y &&
      left <= size.x - padding.bottomRight.x &&
      top <= size.y - padding.bottomRight.y
    );
  });
}

/**
 * The view that fits `points` in the clear part of the screen, no closer than `maxZoom`. It
 * shows past the map's edges only as far as it must to keep a point near an edge clear of a
 * panel covering that side (and no farther than the map can be panned).
 */
export function framePoints(
  map: LeafletMap,
  points: MapPoint[],
  padding: CameraPadding,
  maxZoom: number,
): { center: LatLngTuple; zoom: number } {
  const bounds = latLngBounds(points.map(({ x, y }) => toLatLng(x, y)));
  const zoom = Math.min(
    map.getBoundsZoom(bounds, false, padding.topLeft.add(padding.bottomRight)),
    maxZoom,
  );
  // Centering the points in the clear area shifts the view by half the padding difference.
  const shift = padding.bottomRight.subtract(padding.topLeft).divideBy(2);
  const center = map.unproject(map.project(bounds.getCenter(), zoom).add(shift), zoom);

  // How far past each edge the view has to reach to keep the points clear, in map pixels.
  const scale = 2 ** zoom;
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const reach = (needed: number, covered: number, limit: number) =>
    Math.min(Math.max(needed, 0), covered / scale, limit);
  const overscan = {
    top: reach(
      padding.topLeft.y / scale - Math.min(...ys),
      padding.covered.top,
      MAP_HEIGHT * ZOOM.panPadding,
    ),
    right: reach(
      Math.max(...xs) + padding.bottomRight.x / scale - MAP_WIDTH,
      padding.covered.right,
      MAP_WIDTH * ZOOM.panPadding,
    ),
    bottom: reach(
      Math.max(...ys) + padding.bottomRight.y / scale - MAP_HEIGHT,
      padding.covered.bottom,
      MAP_HEIGHT * ZOOM.panPadding,
    ),
    left: reach(
      padding.topLeft.x / scale - Math.min(...xs),
      padding.covered.left,
      MAP_WIDTH * ZOOM.panPadding,
    ),
  };
  const { x, y } = keepOnMap(fromLatLng(center), map.getSize(), zoom, overscan);
  return { center: toLatLng(x, y), zoom };
}

/**
 * How far to pan, in screen pixels, to bring a point into the clear part of the screen
 * (zero if it's already there).
 */
export function panToReveal(map: LeafletMap, at: MapPoint, padding: CameraPadding): Point {
  const size = map.getSize();
  const { x, y } = map.latLngToContainerPoint(toLatLng(at.x, at.y));
  const overshoot = (value: number, min: number, max: number) =>
    min > max ? value - (min + max) / 2 : value < min ? value - min : value > max ? value - max : 0;
  return point(
    overshoot(x, padding.topLeft.x, size.x - padding.bottomRight.x),
    overshoot(y, padding.topLeft.y, size.y - padding.bottomRight.y),
  );
}
