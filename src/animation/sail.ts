/**
 * Playing a voyage plan (see voyagePlan.ts) with GSAP: each moving leg draws itself (or
 * un-draws, rewinding) while the ship rides along its leading edge, dropping a short wake.
 *
 * The leg's path data is rewritten every frame to the stretch sailed so far, rather than
 * revealed with a stroke-dashoffset: the route's strokes are non-scaling and anime-only legs
 * are dotted, and both would fight a dash-based reveal. Cutting the curve keeps the line's
 * own dots and weight exactly as they are when it's still.
 */
import gsap from 'gsap';
import { TIMING } from '@/config';
import { routeKey } from '@/data/voyage';
import type { LegShape, ShipPose } from '@/map/journey';
import { headingAt, partialPath, pointAt, type Track } from '@/utils/track';
import { GSAP_EASE } from './easing';
import { SHIP_STERN, SHIP_TRAIL } from './ship';
import type { VoyagePlan } from './voyagePlan';

/** The two strokes that draw one leg: a dark casing under the colored line. */
export interface LegElements {
  casing: SVGPathElement;
  line: SVGPathElement;
}

/** What the ship needs from whoever draws it. */
export interface ShipHandle {
  /** At rest, moored at `pose` and bobbing gently. Null takes the ship off the map. */
  moor(pose: ShipPose | null): void;
  /** Under way at `pose`. Called every frame while sailing. */
  sail(pose: ShipPose): void;
}

export interface SailTargets {
  /** The moving legs' elements, by legKey. */
  legs: ReadonlyMap<string, LegElements>;
  ship: ShipHandle | null;
  /** Where wake dots go: a group in the route's SVG, in map pixels. */
  wake: SVGGElement | null;
  /** Screen pixels per map pixel at the current zoom. */
  scale: () => number;
}

/** Wake dots are dropped this far apart, in screen pixels. */
const WAKE_SPACING = 11;

export function legKey(shape: LegShape): string {
  return routeKey(shape.leg.fromLocationId, shape.leg.toLocationId);
}

/** How long a leg takes to sail: proportional to its length, within limits. */
export function legDuration(length: number): number {
  const duration = length / TIMING.routeDrawPxPerSecond;
  return Math.min(Math.max(duration, TIMING.routeDrawMin), TIMING.routeDrawMax);
}

/**
 * Puts everything where the plan starts and returns the timeline that plays it, or null if
 * nothing moves (the ship is simply moored where the journey leaves it).
 */
export function sail(plan: VoyagePlan, targets: SailTargets): gsap.core.Timeline | null {
  const { ship } = targets;
  const rest = plan.journey.ship;
  const forward = plan.motion === 'draw';
  const legs = forward ? plan.moving : plan.moving.toReversed();
  if (plan.motion === null || legs.length === 0) {
    ship?.moor(rest);
    return null;
  }

  // Where each leg starts: nothing drawn yet going forward, all of it when rewinding.
  for (const shape of plan.moving) {
    draw(targets.legs.get(legKey(shape)), shape.track, forward ? 0 : shape.track.length);
  }
  const [first] = legs;
  if (first) ship?.sail(poseAt(first.track, forward ? 0 : first.track.length));

  const timeline = gsap.timeline({ onComplete: () => ship?.moor(rest) });
  for (const shape of legs) {
    const { track } = shape;
    const elements = targets.legs.get(legKey(shape));
    const wake = forward && targets.wake ? wakeTrail(targets.wake, targets.scale) : undefined;
    const position = { along: forward ? 0 : track.length };
    timeline.to(position, {
      along: forward ? track.length : 0,
      duration: legDuration(track.length),
      ease: GSAP_EASE.sail,
      onUpdate: () => {
        draw(elements, track, position.along);
        ship?.sail(poseAt(track, position.along));
        wake?.(track, position.along);
      },
    });
  }
  return timeline;
}

function draw(elements: LegElements | undefined, track: Track, along: number) {
  if (!elements) return;
  const d = partialPath(track, along);
  elements.casing.setAttribute('d', d);
  elements.line.setAttribute('d', d);
}

function poseAt(track: Track, along: number): ShipPose {
  return { at: pointAt(track, along), heading: headingAt(track, along) };
}

/**
 * A wake: small dots dropped behind the ship's stern as it sails, each fading out on its
 * own. Spacing is in screen pixels, so the wake looks the same at every zoom.
 */
function wakeTrail(group: SVGGElement, scale: () => number) {
  let lastDrop = -Infinity;
  return (track: Track, along: number) => {
    const pixel = 1 / scale();
    if (along - lastDrop < WAKE_SPACING * pixel) return;
    lastDrop = along;
    const behind = along - (SHIP_TRAIL + SHIP_STERN) * pixel;
    if (behind > 0) dropWakeDot(group, pointAt(track, behind));
  };
}

function dropWakeDot(group: SVGGElement, { x, y }: { x: number; y: number }) {
  // A zero-length line with round caps: a dot whose size is set in screen pixels by CSS.
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  dot.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}h0.01`);
  group.append(dot);
  gsap.to(dot, {
    opacity: 0,
    duration: TIMING.wakeFade,
    ease: GSAP_EASE.fade,
    onComplete: () => dot.remove(),
  });
}
