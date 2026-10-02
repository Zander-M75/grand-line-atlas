import { describe, expect, it } from 'vitest';
import { arcById, arcs, crew } from '@/data';
import { crewAboard, isInProgress, knownArcs } from '@/data/spoilers';
import type { Arc } from '@/types';

const arc = (id: string): Arc => {
  const found = arcById.get(id);
  if (!found) throw new Error(`No arc ${id} in the generated data`);
  return found;
};
const ids = (list: Arc[]) => list.map(({ id }) => id);
const aboardIds = (arcId: string, limit: number | null) =>
  crewAboard(crew, arc(arcId), limit).map(({ member }) => member.id);

describe('isInProgress', () => {
  it('is true only while the limit falls inside the arc, before its last episode', () => {
    const enies = arc('enies-lobby'); // 264–312
    expect(isInProgress(enies, 300)).toBe(true);
    expect(isInProgress(enies, 264)).toBe(true);
    expect(isInProgress(enies, 312)).toBe(false); // finished
    expect(isInProgress(enies, 263)).toBe(false); // not started
    expect(isInProgress(enies, null)).toBe(false);
  });
});

describe('knownArcs', () => {
  it('drops arcs that start after the limit', () => {
    const known = knownArcs(arcs, 300);
    expect(ids(known).at(-1)).toBe('enies-lobby');
    expect(ids(known)).not.toContain('post-enies-lobby');
  });

  it('cuts the arc in progress to its first stop', () => {
    const known = knownArcs(arcs, 1); // Romance Dawn is episodes 1–3
    expect(ids(known)).toEqual(['romance-dawn']);
    expect(known[0]?.locationIds).toEqual(['foosha-village']);
    // Finished arcs keep every stop.
    expect(knownArcs(arcs, 3)[0]?.locationIds).toEqual(['foosha-village', 'shells-town']);
  });

  it('returns the same array for the same inputs, and the input itself with no limit', () => {
    expect(knownArcs(arcs, 300)).toBe(knownArcs(arcs, 300));
    expect(knownArcs(arcs, null)).toBe(arcs);
  });
});

describe('crewAboard', () => {
  it('lists who has joined by the end of the arc, flagging new members', () => {
    expect(aboardIds('syrup-village', null)).toEqual(['luffy', 'zoro', 'usopp']);
    expect(
      crewAboard(crew, arc('syrup-village'), null)
        .filter(({ joinsHere }) => joinsHere)
        .map(({ member }) => member.id),
    ).toEqual(['usopp']);
  });

  it('hides anyone who joins after the viewer’s limit, even in the current arc', () => {
    // Nami officially joins in episode 44, inside Arlong Park (31–45).
    expect(aboardIds('arlong-park', 40)).not.toContain('nami');
    expect(aboardIds('arlong-park', 44)).toContain('nami');
  });

  it('compares joins by episode, so interleaved arcs get it right', () => {
    // Cidre Guild (895–896) is listed after Wano Country but airs before Jinbe joins (980).
    expect(aboardIds('cidre-guild', null)).not.toContain('jinbe');
    expect(aboardIds('wano-country', null)).toContain('jinbe');
  });
});
