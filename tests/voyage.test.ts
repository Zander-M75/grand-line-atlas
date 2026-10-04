import { describe, expect, it } from 'vitest';
import { routeKey, sideLegs, voyageLegs, voyageStops } from '@/data/voyage';
import type { Arc } from '@/types';

let order = 0;
const arc = (id: string, locationIds: string[], extra: Partial<Arc> = {}): Arc => ({
  id,
  name: id,
  saga: 'Test Saga',
  order: ++order,
  episodes: [order, order],
  filler: false,
  locationIds,
  summary: '',
  ...extra,
});

const legsOf = (arcs: Arc[]) =>
  voyageLegs(arcs).map((leg) => `${routeKey(leg.fromLocationId, leg.toLocationId)}@${leg.arcId}`);

describe('voyageLegs', () => {
  const loguetown = arc('loguetown', ['loguetown']);
  const warship = arc('warship-island', ['warship-island'], { filler: true });
  const reverse = arc('reverse-mountain', ['reverse-mountain', 'twin-cape']);

  it('connects consecutive stops, each leg leading into the arc it reaches', () => {
    expect(legsOf([loguetown, reverse])).toEqual([
      'loguetown>reverse-mountain@reverse-mountain',
      'reverse-mountain>twin-cape@reverse-mountain',
    ]);
  });

  it('marks legs to and from anime-only stops as filler', () => {
    const legs = voyageLegs([loguetown, warship, reverse]);
    expect(legs.map((leg) => leg.filler)).toEqual([true, true, false]);
  });

  it('reconnects canon islands directly when filler arcs are left out', () => {
    const all = [loguetown, warship, reverse];
    expect(legsOf(all.filter((a) => !a.filler))[0]).toBe(
      'loguetown>reverse-mountain@reverse-mountain',
    );
  });

  it("doesn't move the ship for off-route arcs or arcs with no place", () => {
    const sabaody = arc('sabaody', ['sabaody']);
    const impelDown = arc('impel-down', ['impel-down'], { offRoute: true });
    const atSea = arc('at-sea', []);
    const fishMan = arc('fish-man-island', ['fish-man-island']);
    expect(legsOf([sabaody, impelDown, atSea, fishMan])).toEqual([
      'sabaody>fish-man-island@fish-man-island',
    ]);
  });

  it('treats returning to the same place as a stop, not a leg', () => {
    const sabaody = arc('sabaody', ['sabaody']);
    const returnTo = arc('return-to-sabaody', ['sabaody']);
    expect(voyageStops([sabaody, returnTo])).toHaveLength(2);
    expect(voyageLegs([sabaody, returnTo])).toEqual([]);
  });
});

describe('sideLegs', () => {
  const sabaody = arc('sabaody', ['sabaody']);
  const amazonLily = arc('amazon-lily', ['amazon-lily'], { offRoute: true, sideRoute: true });
  const impelDown = arc('impel-down', ['impel-down'], { offRoute: true, sideRoute: true });
  const flashback = arc('little-east-blue', ['little-east-blue'], { offRoute: true });
  const returnTo = arc('return-to-sabaody', ['sabaody']);
  const later = arc('dressrosa', ['dressrosa']);
  const levely = arc('levely', ['mary-geoise'], { offRoute: true, sideRoute: true });

  const sideOf = (arcs: Arc[]) =>
    sideLegs(arcs).map((leg) => `${routeKey(leg.fromLocationId, leg.toLocationId)}@${leg.arcId}`);

  it('sets out from where the ship waits and runs through the side-route arcs', () => {
    expect(sideOf([sabaody, amazonLily, flashback, impelDown, returnTo])).toEqual([
      'sabaody>amazon-lily@amazon-lily',
      'amazon-lily>impel-down@impel-down',
    ]);
    expect(sideLegs([sabaody, amazonLily]).every((leg) => leg.side)).toBe(true);
  });

  it('starts over from the ship once it puts in somewhere again', () => {
    expect(sideOf([sabaody, amazonLily, returnTo, later, levely])).toEqual([
      'sabaody>amazon-lily@amazon-lily',
      'dressrosa>mary-geoise@levely',
    ]);
  });

  it('is never part of the ship’s own voyage', () => {
    expect(legsOf([sabaody, amazonLily, impelDown, returnTo])).toEqual([]);
  });
});
