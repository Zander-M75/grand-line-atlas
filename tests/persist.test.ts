import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSettings, loadSpoilerLimit, saveSettings, saveSpoilerLimit } from '@/store/persist';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('spoiler limit storage', () => {
  it('round-trips an episode and "caught up"', () => {
    saveSpoilerLimit(300);
    expect(loadSpoilerLimit()).toBe(300);
    saveSpoilerLimit(null);
    expect(loadSpoilerLimit()).toBeNull();
  });

  it('reads as unanswered when nothing (or nothing usable) is saved', () => {
    expect(loadSpoilerLimit()).toBeUndefined();
    for (const raw of [
      'not json',
      '42',
      '{}',
      '{"episode":"300"}',
      '{"episode":0}',
      '{"episode":2.5}',
    ]) {
      localStorage.setItem('gla:spoiler-limit', raw);
      expect(loadSpoilerLimit(), raw).toBeUndefined();
    }
  });

  it('fails quietly when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveSpoilerLimit(300)).not.toThrow();
    expect(loadSpoilerLimit()).toBeUndefined();
  });
});

describe('settings storage', () => {
  it('keeps only known settings with the right type', () => {
    localStorage.setItem(
      'gla:settings',
      JSON.stringify({ showFiller: false, reducedMotion: 'yes', sound: true, extra: 1 }),
    );
    expect(loadSettings()).toEqual({ showFiller: false, sound: true });
  });

  it('round-trips settings', () => {
    const settings = { showFiller: false, reducedMotion: true, sound: false, weather: true };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });
});
