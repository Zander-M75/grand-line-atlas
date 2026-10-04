import { beforeEach, describe, expect, it } from 'vitest';
import {
  chooseSpoilerLimit,
  dismissGate,
  finishIntro,
  goToArc,
  goToIndex,
  openLinkedArc,
  restoreSaved,
  selectFrontierArc,
  selectKnownArcs,
  selectLastOpenIndex,
  selectVisibleArcs,
  setSetting,
  setShowFiller,
  setSpoilerLimit,
  startTour,
  stepArc,
  takeTour,
  useAtlasStore,
} from '@/store';
import { loadSettings, loadSpoilerLimit, saveSpoilerLimit } from '@/store/persist';

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

describe('the viewer’s place in the story', () => {
  it('finds the arc their limit falls in, preferring canon over anime-only arcs inside it', () => {
    setSpoilerLimit(1000);
    // Cidre Guild (895–896) is the last arc to start by episode 1000, but they're in Wano.
    expect(selectFrontierArc(state()).id).toBe('wano-country');
    setSpoilerLimit(427);
    expect(selectFrontierArc(state()).id).toBe('impel-down');
    setSpoilerLimit(null);
    expect(selectFrontierArc(state()).id).toBe(selectVisibleArcs(state()).at(-1)?.id);
  });

  it('keeps the known arcs as one stable list per filler setting and limit', () => {
    setSpoilerLimit(300);
    const known = selectKnownArcs(state());
    expect(known.at(-1)?.id).toBe('enies-lobby');
    expect(selectKnownArcs(state())).toBe(known);
  });
});

describe('intro', () => {
  it('plays on a first visit, once', () => {
    restoreSaved();
    expect(state().introPlaying).toBe(true);
    finishIntro();
    expect(state().introPlaying).toBe(false);
    restoreSaved();
    expect(state().introPlaying).toBe(false);
  });

  it('never plays with reduced motion', () => {
    localStorage.setItem('gla:settings', JSON.stringify({ reducedMotion: true }));
    restoreSaved();
    expect(state().introPlaying).toBe(false);
  });
});

describe('spoiler gate', () => {
  it('asks on a first visit, hiding everything past the first episode until answered', () => {
    restoreSaved();
    expect(state().gate).toEqual({ reason: 'welcome' });
    expect(state().spoilerLimitEpisode).toBe(1);
    expect(loadSpoilerLimit()).toBeUndefined(); // the stand-in limit isn't saved
  });

  it('restores a saved limit and settings without asking', () => {
    saveSpoilerLimit(300);
    localStorage.setItem('gla:settings', JSON.stringify({ reducedMotion: true }));
    restoreSaved();
    expect(state().gate).toBeNull();
    expect(state().spoilerLimitEpisode).toBe(300);
    expect(state().settings.reducedMotion).toBe(true);
    expect(state().settings.showFiller).toBe(true);
  });

  it('turns a link past the limit into a question, landing where the viewer is', () => {
    setSpoilerLimit(300);
    openLinkedArc('wano-country');
    expect(state().currentArcId).toBe('enies-lobby');
    expect(state().gate).toEqual({ reason: 'past-limit', requestedArcId: 'wano-country' });
  });

  it('opens the linked arc once the new limit allows it, and saves the answer', () => {
    setSpoilerLimit(300);
    openLinkedArc('wano-country');
    chooseSpoilerLimit(1000);
    expect(state().gate).toBeNull();
    expect(state().currentArcId).toBe('wano-country');
    expect(loadSpoilerLimit()).toBe(1000);
  });

  it('lands where the viewer is if the linked arc is still locked', () => {
    restoreSaved();
    openLinkedArc('wano-country');
    expect(state().gate).toEqual({ reason: 'welcome', requestedArcId: 'wano-country' });
    chooseSpoilerLimit(300);
    expect(state().currentArcId).toBe('enies-lobby');
  });

  it('opens everything for "caught up"', () => {
    restoreSaved();
    chooseSpoilerLimit(null);
    expect(state().spoilerLimitEpisode).toBeNull();
    expect(loadSpoilerLimit()).toBeNull();
  });

  it('can be dismissed without changing the limit', () => {
    setSpoilerLimit(300);
    openLinkedArc('wano-country');
    dismissGate();
    expect(state().gate).toBeNull();
    expect(state().spoilerLimitEpisode).toBe(300);
    expect(state().currentArcId).toBe('enies-lobby');
  });
});

describe('the guided tour', () => {
  it('starts from where the viewer is', () => {
    goToArc('baratie');
    startTour();
    expect(state().touring).toBe(true);
    expect(state().currentArcId).toBe('baratie');
  });

  it('starts over from the first arc at the end of what the viewer may open', () => {
    setSpoilerLimit(300);
    goToIndex(Infinity);
    startTour();
    expect(state().currentArcId).toBe('romance-dawn');
  });

  it('is what a newcomer gets instead of a spoiler limit', () => {
    restoreSaved();
    takeTour();
    expect(state().gate).toBeNull();
    expect(state().spoilerLimitEpisode).toBeNull();
    expect(loadSpoilerLimit()).toBeNull(); // they won't be asked again
    expect(state().currentArcId).toBe('romance-dawn');
    expect(state().touring).toBe(true);
  });
});

describe('settings', () => {
  it('remembers settings the viewer changes', () => {
    setSetting('reducedMotion', true);
    setShowFiller(false);
    expect(loadSettings()).toMatchObject({ reducedMotion: true, showFiller: false });
  });

  it('doesn’t remember filler turned on by a link (that lasts the session)', () => {
    setShowFiller(false);
    goToArc('g-8');
    expect(state().settings.showFiller).toBe(true);
    expect(loadSettings().showFiller).toBe(false);
  });
});
