import { beforeEach, describe, expect, it } from 'vitest';
import {
  goToArc,
  goToIndex,
  selectLastOpenIndex,
  selectVisibleArcs,
  setShowFiller,
  setSpoilerLimit,
  stepArc,
  useAtlasStore,
} from '@/store';

const state = () => useAtlasStore.getState();

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
});

describe('atlas store', () => {
  it('starts at the first arc with anime-only arcs shown', () => {
    expect(state().currentArcId).toBe('romance-dawn');
    expect(state().settings.showFiller).toBe(true);
  });

  it('derives the visible arcs from the filler setting, without copying them', () => {
    const withFiller = selectVisibleArcs(state());
    setShowFiller(false);
    const canonOnly = selectVisibleArcs(state());
    expect(canonOnly.every((arc) => !arc.filler)).toBe(true);
    expect(canonOnly.length).toBeLessThan(withFiller.length);
    // The same array each time, so subscribers don't re-render for nothing.
    expect(selectVisibleArcs(state())).toBe(canonOnly);
  });

  it('steps along the timeline and stops at the ends', () => {
    stepArc(-1);
    expect(state().currentArcId).toBe('romance-dawn');
    stepArc(1);
    expect(state().currentArcId).toBe('orange-town');
    goToIndex(Infinity);
    expect(state().currentArcId).toBe(selectVisibleArcs(state()).at(-1)?.id);
  });

  it('skips anime-only arcs when stepping with them hidden', () => {
    goToArc('loguetown');
    setShowFiller(false);
    stepArc(1);
    expect(state().currentArcId).toBe('reverse-mountain');
  });

  it('moves to the nearest canon arc when filler is hidden while on an anime-only arc', () => {
    goToArc('little-east-blue');
    setShowFiller(false);
    expect(state().currentArcId).toBe('impel-down');
  });

  it('turns filler back on to open an anime-only arc', () => {
    setShowFiller(false);
    goToArc('goat-island');
    expect(state().currentArcId).toBe('goat-island');
    expect(state().settings.showFiller).toBe(true);
  });

  it('refuses locked arcs and steps back when the limit drops', () => {
    goToArc('enies-lobby');
    setSpoilerLimit(200);
    expect(state().currentArcId).toBe('g-8'); // the last arc starting by episode 200
    goToArc('water-7');
    expect(state().currentArcId).toBe('g-8');
    stepArc(1);
    expect(state().currentArcId).toBe('g-8');
    expect(selectVisibleArcs(state())[selectLastOpenIndex(state())]?.id).toBe('g-8');
  });

  it('ignores unknown arc ids', () => {
    goToArc('atlantis');
    expect(state().currentArcId).toBe('romance-dawn');
  });
});
