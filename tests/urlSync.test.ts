import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { arcFromSearch, restoreFromUrl, useUrlSync } from '@/hooks/useUrlSync';
import { goToArc, setShowFiller, useAtlasStore } from '@/store';

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
  window.history.replaceState(null, '', '/');
});

describe('arcFromSearch', () => {
  it('reads ?arc= by id', () => {
    expect(arcFromSearch('?arc=water-7').id).toBe('water-7');
  });

  it('resolves ?ep= to the arc containing that episode, preferring canon', () => {
    expect(arcFromSearch('?ep=300').id).toBe('enies-lobby');
    expect(arcFromSearch('?ep=427').id).toBe('impel-down');
  });

  it('falls back to the first arc for anything it cannot use', () => {
    for (const search of ['', '?arc=atlantis', '?ep=0', '?ep=99999', '?ep=12abc', '?ep=-4']) {
      expect(arcFromSearch(search).id, search).toBe('romance-dawn');
    }
  });

  it('prefers ?arc= when both are given, and falls through to ?ep= if the id is bad', () => {
    expect(arcFromSearch('?arc=water-7&ep=1').id).toBe('water-7');
    expect(arcFromSearch('?arc=atlantis&ep=300').id).toBe('enies-lobby');
  });
});

describe('restoreFromUrl', () => {
  it('turns anime-only arcs on when the link points to one', () => {
    setShowFiller(false);
    restoreFromUrl('?arc=g-8');
    expect(useAtlasStore.getState().currentArcId).toBe('g-8');
    expect(useAtlasStore.getState().settings.showFiller).toBe(true);
  });
});

describe('useUrlSync', () => {
  it('writes the current arc to the URL without adding history entries', () => {
    window.history.replaceState(null, '', '/?ep=300&utm=x');
    const before = window.history.length;
    restoreFromUrl();
    renderHook(() => useUrlSync());
    expect(window.location.search).toBe('?utm=x&arc=enies-lobby');

    act(() => goToArc('water-7'));
    expect(window.location.search).toBe('?utm=x&arc=water-7');
    expect(window.history.length).toBe(before);
  });
});
