import { describe, expect, it } from 'vitest';
import {
  course,
  drawDuration,
  isDramatic,
  planVoyageMotion,
  shipTransform,
  type VoyageView,
} from '@/animation/voyage';
import { CAMERA, TIMING } from '@/config';
import { arcById } from '@/data';
import { journeyAt, legKey } from '@/map/journey';
import { visibleArcs } from '@/store';
import type { Arc } from '@/types';

const all = visibleArcs(true);
const canon = visibleArcs(false);

const view = (id: string, arcs: Arc[] = all): VoyageView => {
  const arc = arcById.get(id);
  if (!arc) throw new Error(`No arc ${id} in the generated data`);
  return { arcs, journey: journeyAt(arcs, arc) };
};
const keys = (motion: ReturnType<typeof planVoyageMotion>) =>
  motion.kind === 'snap' ? [] : motion.legs.map(legKey);

describe('planVoyageMotion', () => {
  it('sails the next arc’s legs on a step forward, starting from the leg the ship was on', () => {
    const motion = planVoyageMotion(view('romance-dawn'), view('orange-town'));
    expect(motion.kind).toBe('sail');
    expect(keys(motion)).toEqual(['shells-town>orange-town']);
    expect(motion.kind === 'sail' && motion.from && legKey(motion.from)).toBe(
      'foosha-village>shells-town',
    );
  });

  it('sails every leg of an arc with several stops', () => {
    expect(keys(planVoyageMotion(view('orange-town'), view('syrup-village')))).toEqual([
      'orange-town>syrup-village',
      'syrup-village>island-of-rare-animals',
    ]);
  });

  it('on a jump forward, animates only the final arc’s legs', () => {
    expect(keys(planVoyageMotion(view('romance-dawn'), view('arlong-park')))).toEqual([
      'baratie>arlong-park',
    ]);
  });

  it('un-draws the arc being left on a step back, ending moored on the leg before', () => {
    const motion = planVoyageMotion(view('orange-town'), view('romance-dawn'));
    expect(motion.kind).toBe('unsail');
    expect(keys(motion)).toEqual(['shells-town>orange-town']);
    expect(motion.kind === 'unsail' && motion.to && legKey(motion.to)).toBe(
      'foosha-village>shells-town',
    );
  });

  it('un-draws the arc being left when stepping back onto an arc that stays put', () => {
    // Buggy Side Story (off-route) comes right before Loguetown and doesn't move the ship.
    expect(keys(planVoyageMotion(view('loguetown'), view('buggy-side-story')))).toEqual([
      'arlong-park>loguetown',
    ]);
  });

  it('snaps on a jump back, when the arc list changes, and on first show', () => {
    expect(planVoyageMotion(view('arlong-park'), view('romance-dawn')).kind).toBe('snap');
    expect(planVoyageMotion(view('loguetown', all), view('reverse-mountain', canon)).kind).toBe(
      'snap',
    );
    expect(planVoyageMotion(null, view('loguetown')).kind).toBe('snap');
  });

  it('snaps when the new arc doesn’t move the ship', () => {
    expect(planVoyageMotion(view('arlong-park'), view('buggy-side-story')).kind).toBe('snap');
    expect(planVoyageMotion(view('sabaody-archipelago'), view('amazon-lily')).kind).toBe('snap');
  });
});

describe('isDramatic', () => {
  const legsOf = (id: string) =>
    view(id)
      .journey.legs.filter(({ state }) => state === 'current')
      .map(({ shape }) => shape);

  it('flags the climb up Reverse Mountain, the dive to Fish-Man Island, and the New World', () => {
    expect(isDramatic(legsOf('reverse-mountain'), CAMERA.dramatic)).toBe(true);
    expect(isDramatic(legsOf('fish-man-island'), CAMERA.dramatic)).toBe(true);
    expect(isDramatic(legsOf('punk-hazard'), CAMERA.dramatic)).toBe(true);
  });

  it('leaves ordinary legs alone', () => {
    expect(isDramatic(legsOf('orange-town'), CAMERA.dramatic)).toBe(false);
    expect(isDramatic(legsOf('dressrosa'), CAMERA.dramatic)).toBe(false);
  });
});

describe('drawDuration', () => {
  it('scales with length, within the min and max', () => {
    expect(drawDuration(0)).toBe(TIMING.routeDrawMin);
    expect(drawDuration(TIMING.routeDrawPxPerSecond * 1.5)).toBeCloseTo(1.5);
    expect(drawDuration(1e6)).toBe(TIMING.routeDrawMax);
  });
});

describe('course', () => {
  // Two straight sections: east 10px from the origin, then south 10px from (10, 0).
  const east = { start: 0, end: 10, pointAt: (d: number) => ({ x: d, y: 0 }) };
  const south = { start: 0, end: 10, pointAt: (d: number) => ({ x: 10, y: d }) };

  it('joins sections end to end', () => {
    const voyage = course([east, south]);
    expect(voyage.length).toBe(20);
    expect(voyage.at(5).point).toEqual({ x: 5, y: 0 });
    expect(voyage.at(15).point).toEqual({ x: 10, y: 5 });
  });

  it('heads the way the course runs', () => {
    const voyage = course([east, south]);
    expect(voyage.at(5).heading).toEqual({ x: 1, y: 0 });
    expect(voyage.at(15).heading).toEqual({ x: 0, y: 1 });
  });

  it('starts a section partway along its path, and clamps past the ends', () => {
    const voyage = course([{ ...east, start: 6 }, south]);
    expect(voyage.length).toBe(14);
    expect(voyage.at(0).point).toEqual({ x: 6, y: 0 });
    expect(voyage.at(-5).point).toEqual({ x: 6, y: 0 });
    expect(voyage.at(99).point).toEqual({ x: 10, y: 10 });
  });
});

describe('shipTransform', () => {
  it('sails east level, and mirrors to sail west', () => {
    expect(shipTransform({ x: 1, y: 0 })).toBe('rotate(0deg)');
    expect(shipTransform({ x: -1, y: 0 })).toBe('rotate(0deg) scaleX(-1)');
  });

  it('dips the bow heading down-chart and lifts it heading up, either way', () => {
    const down = Math.SQRT1_2;
    expect(shipTransform({ x: down, y: down })).toBe('rotate(35deg)');
    expect(shipTransform({ x: -down, y: down })).toBe('rotate(-35deg) scaleX(-1)');
    expect(shipTransform({ x: 0.97, y: -0.24 })).toMatch(/^rotate\(-1[34]\.\ddeg\)$/);
  });
});
