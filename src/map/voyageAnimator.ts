/**
 * Plays one VoyageMotion (src/animation/voyage.ts) on the drawn route: GSAP tweens a single
 * progress value, and each frame reveals the legs up to the drawing tip (through masks on
 * their groups), moves the ship along the same course just behind the tip, and drops its wake.
 */
import { gsap } from 'gsap';
import type { Map as LeafletMap } from 'leaflet';
import { EASE } from '@/animation/easing';
import { course, drawDuration, type CourseSection, type VoyageMotion } from '@/animation/voyage';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';
import { legKey, type Journey, type LegShape } from './journey';
import { MOORING, STERN, type ShipHandle } from './ship';
import type { Wake } from './wake';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** The reveal mask's width, in screen pixels: wider than the route's widest casing. */
const MASK_WIDTH = 14;

export interface VoyageScene {
  map: LeafletMap;
  ship: ShipHandle;
  wake: Wake | null;
  route: SVGGElement | null;
  defs: SVGDefsElement | null;
}

interface PlayOptions {
  /** Seconds to hold the starting frame before sailing (while the viewer is scrubbing). */
  delay: number;
  /** Called once the motion finishes on its own (not when it's cancelled). */
  onDone: () => void;
}

/**
 * Shows `journey` on the map, animating `motion` into it if it can. Returns a function that
 * stops the animation where it is; whatever plays next sets the scene again from scratch.
 */
export function playVoyage(
  scene: VoyageScene,
  journey: Journey,
  motion: VoyageMotion,
  { delay, onDone }: PlayOptions,
): () => void {
  const { map, ship, wake, route, defs } = scene;
  const rest = () => ship.moor(journey.ship);
  if (motion.kind === 'snap' || !route || !defs) {
    rest();
    return () => {};
  }

  const lineOf = (shape: LegShape) =>
    route.querySelector<SVGPathElement>(`[data-leg="${legKey(shape)}"] > path:last-child`);
  const lines = motion.legs.map(lineOf);
  // No layout engine (tests), or a leg that isn't drawn: just show the result.
  if (lines.some((line) => !line || typeof line.getTotalLength !== 'function')) {
    rest();
    return () => {};
  }
  const legLines = lines as SVGPathElement[];

  const scale = 2 ** map.getZoom();
  const mooring = MOORING / scale;
  const lengths = legLines.map((line) => line.getTotalLength());
  const legsLength = lengths.reduce((sum, length) => sum + length, 0);

  // The ship starts (or, sailing back, ends) moored on the leg before these.
  const mooredOn = motion.kind === 'sail' ? motion.from : motion.to;
  const mooredLine = mooredOn ? lineOf(mooredOn) : null;
  const mooredLength = mooredLine?.getTotalLength() ?? 0;
  const lead = Math.min(mooring, mooredLength);

  const sections: CourseSection[] = [
    ...(mooredLine ? [section(mooredLine, mooredLength - lead, mooredLength)] : []),
    ...legLines.map((line, i) => section(line, 0, lengths[i] ?? 0)),
  ];
  const voyage = course(sections);
  // The ship stops a mooring's length short of the last island, where it rests.
  const shipEnd = voyage.length - Math.min(mooring, lengths.at(-1) ?? 0);

  const masks = legLines.map((line, i) =>
    revealMask(defs, line, lengths[i] ?? 0, MASK_WIDTH / scale),
  );
  const forward = motion.kind === 'sail';
  const progress = { value: forward ? 0 : 1 };
  wake?.reset();

  const frame = () => {
    // The drawing tip runs just ahead of the ship's bow.
    let tip = lead + progress.value * legsLength;
    masks.forEach((mask, i) => {
      const length = lengths[i] ?? 0;
      mask.reveal(Math.min(Math.max(tip, 0), length));
      tip -= length;
    });
    const { point, heading } = voyage.at(progress.value * shipEnd);
    // Sailing back rewinds the voyage: the ship keeps facing the way it originally went.
    ship.sail(point, heading);
    const travel = forward ? heading : { x: -heading.x, y: -heading.y };
    wake?.follow(point, travel, scale, STERN);
  };
  frame();

  const clearMasks = () => masks.forEach((mask) => mask.remove());
  const tween = gsap.to(progress, {
    value: forward ? 1 : 0,
    duration: drawDuration(legsLength),
    delay,
    ease: EASE.sail,
    onUpdate: frame,
    onComplete: () => {
      // Legs sailed back over are gone; keep them hidden until React removes them.
      if (!forward) masks.forEach((mask) => mask.hide());
      clearMasks();
      rest();
      onDone();
    },
  });

  return () => {
    tween.kill();
    clearMasks();
  };
}

function section(line: SVGPathElement, start: number, end: number): CourseSection {
  return {
    start,
    end,
    pointAt: (distance) => {
      const { x, y } = line.getPointAtLength(distance);
      return { x, y };
    },
  };
}

let maskCount = 0;

/**
 * Masks a leg's group so only its first `reveal(distance)` map pixels show: a white stroke
 * along the same path, dashed to that length.
 */
function revealMask(defs: SVGDefsElement, line: SVGPathElement, length: number, width: number) {
  const group = line.parentElement;
  const id = `route-reveal-${++maskCount}`;
  const mask = document.createElementNS(SVG_NS, 'mask');
  mask.id = id;
  setAttributes(mask, {
    maskUnits: 'userSpaceOnUse',
    x: 0,
    y: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  });
  const stroke = document.createElementNS(SVG_NS, 'path');
  setAttributes(stroke, {
    d: line.getAttribute('d') ?? '',
    fill: 'none',
    stroke: '#fff',
    'stroke-width': width,
    'stroke-dasharray': `${length} ${length + 1}`,
    'stroke-dashoffset': length,
  });
  mask.append(stroke);
  defs.append(mask);
  group?.setAttribute('mask', `url(#${id})`);

  return {
    reveal(distance: number) {
      stroke.setAttribute('stroke-dashoffset', String(length - distance));
    },
    hide() {
      group?.setAttribute('visibility', 'hidden');
    },
    remove() {
      group?.removeAttribute('mask');
      mask.remove();
    },
  };
}

function setAttributes(element: Element, attributes: Record<string, string | number>) {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
}
