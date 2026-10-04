/**
 * What the app remembers between visits, in localStorage: the viewer's spoiler limit, their
 * settings, and whether they've seen the intro. Storage can be missing, full, or blocked
 * (private windows, strict privacy settings), so every read and write is wrapped and fails
 * quietly: the app then just asks again (or plays the intro again) next time.
 */
import type { Settings } from './index';
import { STORAGE_KEYS } from './storageKeys';

const KEYS = STORAGE_KEYS;

/**
 * The settings remembered between visits. Sound isn't one of them: it only ever starts
 * because the viewer turned it on during this visit, never by itself on a later one.
 */
const SAVED_SETTINGS = ['showFiller', 'reducedMotion', 'weather'] as const;

/**
 * The episode the viewer said they're up to: a number, null for "caught up", or undefined
 * if they've never answered (or it can't be read).
 */
export function loadSpoilerLimit(): number | null | undefined {
  const saved = read(KEYS.spoilerLimit);
  if (!isRecord(saved) || !('episode' in saved)) return undefined;
  const { episode } = saved;
  if (episode === null) return null;
  return Number.isInteger(episode) && (episode as number) >= 1 ? (episode as number) : undefined;
}

export function saveSpoilerLimit(episode: number | null) {
  write(KEYS.spoilerLimit, { episode });
}

/** Saved settings, keeping only the known ones with the right type. */
export function loadSettings(): Partial<Settings> {
  const saved = read(KEYS.settings);
  if (!isRecord(saved)) return {};
  const settings: Partial<Settings> = {};
  for (const key of SAVED_SETTINGS) {
    if (typeof saved[key] === 'boolean') settings[key] = saved[key];
  }
  return settings;
}

export function saveSettings(settings: Settings) {
  write(KEYS.settings, Object.fromEntries(SAVED_SETTINGS.map((key) => [key, settings[key]])));
}

export function loadIntroSeen(): boolean {
  return read(KEYS.introSeen) === true;
}

export function saveIntroSeen() {
  write(KEYS.introSeen, true);
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Not saved; the viewer will be asked again next visit.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
