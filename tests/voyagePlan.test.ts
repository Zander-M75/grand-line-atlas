import { describe, expect, it } from 'vitest';
import { legDuration } from '@/animation/sail';
import { planVoyage } from '@/animation/voyagePlan';
import { TIMING } from '@/config';
import { arcById } from '@/data';
import { knownArcs } from '@/data/spoilers';
import { journeyAt } from '@/map/journey';
import { visibleArcs } from '@/store';
import type { Arc } from '@/types';

const arc = (id: string): Arc => {
  const found = arcById.get(id);
  if (!found) throw new Error(`No arc ${id} in the generated data`);
  return found;
};
const all = visibleArcs(true);
const canon = visibleArcs(false);
const at = (id: string, arcs = all) => journeyAt(arcs, arc(id));
const legNames = (shapes: { leg: { fromLocationId: string; toLocationId: string } }[]) =>
  shapes.map(({ leg }) => `${leg.fromLocationId}>${leg.toLocationId}`);
const animate = { animate: true };

describe('planVoyage', () => {
  it('draws the new arc’s legs when stepping forward', () => {
    const plan = planVoyage(at('orange-town'), at('syrup-village'), animate);
    expect(plan.motion).toBe('draw');
    expect(legNames(plan.moving)).toEqual([
      'orange-town>syrup-village',
      'syrup-village>island-of-rare-animals',
    ]);
    expect(plan.legs.filter(({ motion }) => motion === 'draw')).toHaveLength(2);
  });

  it('animates only the last arc of a jump, drawing the rest at once', () => {
    const plan = planVoyage(at('romance-dawn'), at('arlong-park'), animate);
    expect(legNames(plan.moving)).toEqual(['baratie>arlong-park']);
    // Every leg sailed by then is drawn; only the last one animates.
    expect(plan.legs).toHaveLength(at('arlong-park').legs.length);
    expect(plan.legs.filter(({ motion }) => motion)).toHaveLength(1);
  });

  it('rewinds the legs nearest the ship when stepping back, keeping them drawn until then', () => {
    const plan = planVoyage(at('syrup-village'), at('orange-town'), animate);
    expect(plan.motion).toBe('rewind');
    expect(legNames(plan.moving)).toEqual([
      'orange-town>syrup-village',
      'syrup-village>island-of-rare-animals',
    ]);
    expect(plan.legs.filter(({ motion }) => motion === 'rewind')).toHaveLength(2);
    expect(plan.legs.length).toBe(at('orange-town').legs.length + 2);
  });

  it('rewinds only the first arc past where a long jump back lands', () => {
    const plan = planVoyage(at('arlong-park'), at('orange-town'), animate);
    expect(legNames(plan.moving)).toEqual([
      'orange-town>syrup-village',
      'syrup-village>island-of-rare-animals',
    ]);
  });

  it('leaves the ship in port for an arc away from it', () => {
    const plan = planVoyage(at('sabaody-archipelago'), at('amazon-lily'), animate);
    expect(plan.motion).toBeNull();
    expect(plan.moving).toEqual([]);
  });

  it('marks the voyage’s thresholds as milestones', () => {
    expect(planVoyage(at('warship-island'), at('reverse-mountain'), animate).milestone).toBe(true);
    expect(planVoyage(at('return-to-sabaody'), at('fish-man-island'), animate).milestone).toBe(
      true,
    );
    expect(planVoyage(at('zs-ambition'), at('punk-hazard'), animate).milestone).toBe(true);
    expect(planVoyage(at('loguetown'), at('warship-island'), animate).milestone).toBe(false);
    // Only sailing forward: rewinding over Reverse Mountain is just a rewind.
    expect(planVoyage(at('reverse-mountain'), at('warship-island'), animate).milestone).toBe(false);
  });

  it('just shows the new journey when the voyage itself changes', () => {
    // Hiding anime-only arcs, or a new spoiler limit, gives a different set of legs.
    expect(planVoyage(at('water-7'), at('water-7', canon), animate).motion).toBeNull();
    const limited = knownArcs(all, 300);
    expect(planVoyage(at('water-7'), at('enies-lobby', limited), animate).motion).toBeNull();
  });

  it('animates nothing with animation off or on the first view', () => {
    expect(
      planVoyage(at('orange-town'), at('syrup-village'), { animate: false }).motion,
    ).toBeNull();
    expect(planVoyage(null, at('syrup-village'), animate).motion).toBeNull();
  });
});

describe('legDuration', () => {
  it('scales with length, within its limits', () => {
    expect(legDuration(TIMING.routeDrawPxPerSecond * 1.5)).toBeCloseTo(1.5);
    expect(legDuration(1)).toBe(TIMING.routeDrawMin);
    expect(legDuration(1e6)).toBe(TIMING.routeDrawMax);
  });
});
