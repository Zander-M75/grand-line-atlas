import { describe, expect, it } from 'vitest';
import { arcById, locationById } from '@/data';
import { knownArcs } from '@/data/spoilers';
import { islandLabel, journeyAt } from '@/map/journey';
import { visibleArcs } from '@/store';
import type { Arc } from '@/types';

const arc = (id: string): Arc => {
  const found = arcById.get(id);
  if (!found) throw new Error(`No arc ${id} in the generated data`);
  return found;
};
const at = (id: string) => {
  const location = locationById.get(id);
  return location && { x: location.x, y: location.y };
};
const stateOf = (journey: ReturnType<typeof journeyAt>, id: string) =>
  journey.islands.find(({ location }) => location.id === id)?.state;

describe('journeyAt', () => {
  const all = visibleArcs(true);
  const canon = visibleArcs(false);

  it('moors the ship at the last stop of the current arc', () => {
    const journey = journeyAt(all, arc('romance-dawn'));
    expect(journey.ship?.at).toEqual(at('shells-town'));
    expect(journey.legs.map(({ state }) => state)).toEqual(['current']);
  });

  it('draws legs already sailed and leaves out the ones ahead', () => {
    const journey = journeyAt(all, arc('syrup-village'));
    expect(journey.legs.map(({ shape, state }) => `${shape.leg.toLocationId}:${state}`)).toEqual([
      'shells-town:traveled',
      'orange-town:traveled',
      'syrup-village:current',
      'island-of-rare-animals:current',
    ]);
  });

  it('keeps the ship at Sabaody through the off-route Summit War arcs', () => {
    const atSabaody = journeyAt(all, arc('sabaody-archipelago')).ship;
    for (const id of ['amazon-lily', 'impel-down', 'marineford', 'post-war']) {
      const journey = journeyAt(all, arc(id));
      expect(journey.ship).toEqual(atSabaody);
      const current = journey.legs.filter(({ state }) => state === 'current');
      expect(current.every(({ shape }) => shape.leg.side)).toBe(true);
    }
    expect(stateOf(journeyAt(all, arc('impel-down')), 'impel-down')).toBe('away');
  });

  it('draws Luffy’s own path through the Summit War as a side route from the ship', () => {
    const side = (id: string, arcs = all) =>
      journeyAt(arcs, arc(id))
        .legs.filter(({ shape }) => shape.leg.side)
        .map(({ shape, state }) => `${shape.leg.toLocationId}:${state}`);
    expect(side('marineford')).toEqual([
      'amazon-lily:traveled',
      'impel-down:traveled',
      'marineford:current',
    ]);
    // Little East Blue airs inside Impel Down but isn't Luffy's path.
    expect(side('little-east-blue')).toEqual(['amazon-lily:traveled', 'impel-down:traveled']);
    expect(side('post-war', canon)).toEqual(side('post-war'));
    expect(side('sabaody-archipelago')).toEqual([]);
  });

  it('frames where an off-route arc happens, not the waiting ship', () => {
    expect(journeyAt(all, arc('utas-past')).focus).toEqual([at('foosha-village')]);
    const impelDown = journeyAt(all, arc('impel-down')).focus;
    expect(impelDown).toContainEqual(at('amazon-lily'));
    expect(impelDown.at(-1)).toEqual(at('impel-down'));
  });

  it('leaves the ship where it was for arcs with no island', () => {
    expect(journeyAt(all, arc('post-arabasta')).ship?.at).toEqual(at('arabasta'));
  });

  it('marks islands as visited, current, or ahead', () => {
    const journey = journeyAt(all, arc('water-7'));
    expect(stateOf(journey, 'jaya')).toBe('visited');
    expect(stateOf(journey, 'water-7')).toBe('current');
    expect(stateOf(journey, 'enies-lobby')).toBe('ahead');
  });

  it('hides islands only anime-only arcs visit when filler is hidden', () => {
    const journey = journeyAt(canon, arc('reverse-mountain'));
    expect(stateOf(journey, 'warship-island')).toBeUndefined();
    expect(stateOf(journey, 'loguetown')).toBe('visited');
    expect(journey.legs.find(({ state }) => state === 'current')?.shape.leg.fromLocationId).toBe(
      'loguetown',
    );
  });

  it('never routes a leg across the Red Line except down to Fish-Man Island', () => {
    for (const arcs of [all, canon]) {
      const last = arcs.at(-1);
      if (!last) throw new Error('No arcs');
      for (const { shape } of journeyAt(arcs, last).legs) {
        const xs = shape.points.map(({ x }) => x);
        const crosses = Math.min(...xs) < 2000 && Math.max(...xs) > 2000;
        const viaFishMan = [shape.leg.fromLocationId, shape.leg.toLocationId].includes(
          'fish-man-island',
        );
        expect(
          crosses && !viaFishMan,
          `${shape.leg.fromLocationId}→${shape.leg.toLocationId}`,
        ).toBe(false);
      }
    }
  });

  it('draws nothing past the viewer’s spoiler limit', () => {
    const known = knownArcs(all, 300);
    const journey = journeyAt(known, arc('enies-lobby'));
    expect(stateOf(journey, 'enies-lobby')).toBe('current');
    expect(stateOf(journey, 'thriller-bark')).toBeUndefined();
    expect(stateOf(journey, 'wano-country')).toBeUndefined();
  });

  it('shows only the first stop of the arc in progress', () => {
    const known = knownArcs(all, 1);
    const journey = journeyAt(known, known[0] ?? arc('romance-dawn'));
    expect(journey.islands.map(({ location }) => location.id)).toEqual(['foosha-village']);
    expect(journey.legs).toEqual([]);
    expect(journey.ship?.at).toEqual(at('foosha-village'));
  });
});

describe('islandLabel', () => {
  const place = (id: string) => {
    const location = locationById.get(id);
    if (!location) throw new Error(`No place ${id} in the generated data`);
    return location;
  };

  it('names the island and where it sits in the story, for screen readers', () => {
    expect(islandLabel(place('syrup-village'), 'visited')).toBe('Syrup Village, visited');
    expect(islandLabel(place('impel-down'), 'away')).toBe(
      'Impel Down, this arc, away from the ship',
    );
    expect(islandLabel(place('goat-island'), 'ahead')).toBe('Goat Island, ahead, anime-only');
  });

  it('is just the name where there is no story (the dev positioner)', () => {
    expect(islandLabel(place('water-7'))).toBe('Water 7');
  });
});
