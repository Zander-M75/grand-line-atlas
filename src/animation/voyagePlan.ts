/**
 * What changes on the map when the timeline moves, and which part of it animates.
 *
 * Moving forward adds the legs newly sailed; moving back takes legs away. Only the last step
 * of a move animates (PLAN.md §7, Phase 6): jumping ten arcs ahead draws the first nine arcs'
 * legs at once and sails only the final arc's, and jumping back rewinds only the legs nearest
 * where the ship ends up. Anything else (anime-only arcs toggled, a new spoiler limit, reduced
 * motion, the first view) shows the new journey as it is.
 *
 * Plain data in, plain data out, so the rules can be tested without a browser.
 */
import { locationById } from '@/data';
import type { Journey, LegShape, LegState } from '@/map/journey';
import type { Region } from '@/types';

/** Draw: the leg draws itself from its start. Rewind: it un-draws back to its start. */
export type LegMotion = 'draw' | 'rewind';

export interface PlannedLeg {
  shape: LegShape;
  state: LegState;
  /** Set on the legs this change animates. */
  motion?: LegMotion;
}

export interface VoyagePlan {
  /** Where the timeline is now. */
  journey: Journey;
  /** Every leg to draw, in sailing order: the journey's own, then any being rewound. */
  legs: PlannedLeg[];
  /** The legs that animate, in sailing order (a rewind plays them backward). */
  moving: LegShape[];
  /** How `moving` animates; null when nothing does. */
  motion: LegMotion | null;
  /**
   * The ship sailing forward across one of the voyage's thresholds: over Reverse Mountain
   * into the Grand Line, down to Fish-Man Island, or up into the New World.
   */
  milestone: boolean;
}

export function planVoyage(
  previous: Journey | null,
  next: Journey,
  { animate }: { animate: boolean },
): VoyagePlan {
  const still: VoyagePlan = {
    journey: next,
    legs: next.legs,
    moving: [],
    motion: null,
    milestone: false,
  };
  // A different voyage (the arcs on the timeline changed) has different legs: nothing to
  // animate between them.
  if (!animate || !previous || previous.voyage !== next.voyage) return still;

  const from = previous.arc.order;
  const to = next.arc.order;

  if (to > from) {
    const moving = lastArcsLegs(next.legs.filter(({ shape }) => shape.leg.arcOrder > from));
    if (moving.length === 0) return still;
    return {
      journey: next,
      legs: next.legs.map((leg) => (moving.includes(leg.shape) ? { ...leg, motion: 'draw' } : leg)),
      moving,
      motion: 'draw',
      milestone: moving.some(
        ({ leg }) => !leg.side && crossesThreshold(leg.fromLocationId, leg.toLocationId),
      ),
    };
  }

  if (to < from) {
    const removed = previous.legs.filter(({ shape }) => shape.leg.arcOrder > to);
    const moving = firstArcsLegs(removed);
    if (moving.length === 0) return still;
    return {
      journey: next,
      legs: [
        ...next.legs,
        ...removed
          .filter(({ shape }) => moving.includes(shape))
          .map((leg) => ({ ...leg, motion: 'rewind' as const })),
      ],
      moving,
      motion: 'rewind',
      milestone: false,
    };
  }

  return still;
}

/** The legs of the latest arc among `legs`. */
function lastArcsLegs(legs: PlannedLeg[]): LegShape[] {
  const last = Math.max(...legs.map(({ shape }) => shape.leg.arcOrder));
  return legs.filter(({ shape }) => shape.leg.arcOrder === last).map(({ shape }) => shape);
}

/** The legs of the earliest arc among `legs`. */
function firstArcsLegs(legs: PlannedLeg[]): LegShape[] {
  const first = Math.min(...legs.map(({ shape }) => shape.leg.arcOrder));
  return legs.filter(({ shape }) => shape.leg.arcOrder === first).map(({ shape }) => shape);
}

function crossesThreshold(fromLocationId: string, toLocationId: string): boolean {
  const from = locationById.get(fromLocationId)?.region;
  const to = locationById.get(toLocationId)?.region;
  const overReverseMountain = isBlue(from) && to === 'red-line';
  const downToFishManIsland = to === 'undersea';
  const intoNewWorld = to === 'new-world' && from !== 'new-world';
  return overReverseMountain || downToFishManIsland || intoNewWorld;
}

function isBlue(region: Region | undefined): boolean {
  return region?.endsWith('-blue') ?? false;
}
