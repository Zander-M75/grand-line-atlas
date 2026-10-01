import { describe, expect, it } from 'vitest';
import { arcById, arcs } from '@/data';
import { arcForEpisode, canonArcFor, episodeLabel, isLocked } from '@/data/arcs';
import type { Arc } from '@/types';

const arc = (id: string): Arc => {
  const found = arcById.get(id);
  if (!found) throw new Error(`No arc ${id} in the generated data`);
  return found;
};

describe('arcForEpisode', () => {
  it('finds the arc an episode belongs to', () => {
    expect(arcForEpisode(arcs, 1)?.id).toBe('romance-dawn');
    expect(arcForEpisode(arcs, 300)?.id).toBe('enies-lobby');
  });

  it('prefers the canon arc when anime-only episodes air inside it', () => {
    // Little East Blue (426–429) airs inside Impel Down (422–456).
    expect(arcForEpisode(arcs, 427)?.id).toBe('impel-down');
    // Cidre Guild (895–896) airs inside Wano Country.
    expect(arcForEpisode(arcs, 895)?.id).toBe('wano-country');
  });

  it('returns an anime-only arc when no canon arc covers the episode', () => {
    expect(arcForEpisode(arcs, 136)?.id).toBe('goat-island');
  });

  it('returns nothing for episodes outside every arc', () => {
    expect(arcForEpisode(arcs, 0)).toBeUndefined();
    expect(arcForEpisode(arcs, 99999)).toBeUndefined();
  });
});

describe('canonArcFor', () => {
  it('lands on the canon arc an anime-only arc airs inside', () => {
    expect(canonArcFor(arcs, arc('little-east-blue'))?.id).toBe('impel-down');
  });

  it('otherwise lands on the last canon arc before it', () => {
    expect(canonArcFor(arcs, arc('warship-island'))?.id).toBe('loguetown');
    expect(canonArcFor(arcs, arc('g-8'))?.id).toBe('skypiea');
  });

  it('leaves canon arcs alone', () => {
    expect(canonArcFor(arcs, arc('water-7'))?.id).toBe('water-7');
  });
});

describe('isLocked', () => {
  it('locks arcs that start after the spoiler limit', () => {
    expect(isLocked(arc('enies-lobby'), 263)).toBe(true);
    expect(isLocked(arc('enies-lobby'), 264)).toBe(false);
    expect(isLocked(arc('enies-lobby'), null)).toBe(false);
  });
});

describe('episodeLabel', () => {
  it('writes the range with an en dash', () => {
    expect(episodeLabel(arc('enies-lobby'))).toBe('Ep. 264–312');
  });
});
