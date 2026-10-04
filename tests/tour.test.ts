import { describe, expect, it } from 'vitest';
import { legDuration } from '@/animation/sail';
import { readingTime, tourHold, voyageDuration } from '@/animation/tour';
import { planVoyage } from '@/animation/voyagePlan';
import { TIMING } from '@/config';
import { arcById } from '@/data';
import { journeyAt } from '@/map/journey';
import { visibleArcs } from '@/store';
import type { Arc } from '@/types';

const arc = (id: string): Arc => {
  const found = arcById.get(id);
  if (!found) throw new Error(`No arc ${id} in the generated data`);
  return found;
};
const at = (id: string) => journeyAt(visibleArcs(true), arc(id));

describe('the tour’s pace', () => {
  it('times a voyage as its moving legs, sailed one after another', () => {
    const plan = planVoyage(at('orange-town'), at('syrup-village'), { animate: true });
    expect(plan.moving.length).toBeGreaterThan(1);
    const legs = plan.moving.map(({ track }) => legDuration(track.length));
    expect(voyageDuration(plan)).toBeCloseTo(legs.reduce((total, leg) => total + leg));
  });

  it('stays on an arc for its voyage, a pause, and time to read about it', () => {
    const plan = planVoyage(at('orange-town'), at('syrup-village'), { animate: true });
    expect(tourHold(plan)).toBeCloseTo(
      voyageDuration(plan) + TIMING.tourPause + readingTime(arc('syrup-village')),
    );
  });

  it('only pauses and reads when nothing animates (reduced motion)', () => {
    const plan = planVoyage(at('orange-town'), at('syrup-village'), { animate: false });
    expect(voyageDuration(plan)).toBe(0);
    expect(tourHold(plan)).toBeCloseTo(TIMING.tourPause + readingTime(arc('syrup-village')));
  });

  it('gives longer summaries more reading time', () => {
    const short = { ...arc('romance-dawn'), summary: 'Five words in this one.' };
    const long = { ...short, summary: 'Ten words in this one, twice as many as before.' };
    expect(readingTime(short)).toBeCloseTo(5 / TIMING.tourWordsPerSecond);
    expect(readingTime(long)).toBeCloseTo(2 * readingTime(short));
  });
});
