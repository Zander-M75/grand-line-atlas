/**
 * The app's one store: where the viewer is on the timeline, their spoiler limit, the island
 * they've opened, and settings. Components read it through selectors; changes go through the
 * action functions below, which keep two promises: the current arc is always on the timeline,
 * and never locked.
 */
import { create } from 'zustand';
import { arcById, arcs, firstArc } from '@/data';
import { arcForEpisode, canonArcFor, isLocked } from '@/data/arcs';
import { knownArcs } from '@/data/spoilers';
import type { Arc } from '@/types';
import { loadSettings, loadSpoilerLimit, saveSettings, saveSpoilerLimit } from './persist';

export interface Settings {
  /** Anime-only (filler) arcs on the timeline and the map. */
  showFiller: boolean;
  /** Viewer override; the OS setting applies either way (see useReducedMotion). */
  reducedMotion: boolean;
  sound: boolean;
  weather: boolean;
}

/**
 * The spoiler prompt. "welcome": a first visit, before the viewer has said where they are.
 * "past-limit": a link pointed past their limit. Either way, a linked arc waits in
 * `requestedArcId` until the limit allows it.
 */
export interface Gate {
  reason: 'welcome' | 'past-limit';
  requestedArcId?: string;
}

export interface AtlasState {
  currentArcId: string;
  /** The last episode the viewer has seen; arcs starting after it are locked. Null: no limit. */
  spoilerLimitEpisode: number | null;
  selectedLocationId: string | null;
  settings: Settings;
  /** The spoiler prompt, while it's showing. */
  gate: Gate | null;
}

export const useAtlasStore = create<AtlasState>()(() => ({
  currentArcId: firstArc.id,
  spoilerLimitEpisode: null,
  selectedLocationId: null,
  settings: { showFiller: true, reducedMotion: false, sound: false, weather: true },
  gate: null,
}));

// ---------------------------------------------------------------------------
// Selectors

// The timeline shows every arc or only canon ones. Both lists are fixed, so selecting one
// returns the same array each time and components re-render only when the choice flips.
const CANON_ARCS = arcs.filter((arc) => !arc.filler);

export function visibleArcs(showFiller: boolean): Arc[] {
  return showFiller ? arcs : CANON_ARCS;
}

export const selectVisibleArcs = (state: AtlasState): Arc[] =>
  visibleArcs(state.settings.showFiller);

/**
 * The visible arcs the viewer may know about: locked arcs left out, the arc in progress cut
 * to its setup (see src/data/spoilers.ts). Everything on the map comes from this list.
 */
export const selectKnownArcs = (state: AtlasState): Arc[] =>
  knownArcs(selectVisibleArcs(state), state.spoilerLimitEpisode);

export const selectCurrentArc = (state: AtlasState): Arc =>
  arcById.get(state.currentArcId) ?? firstArc;

/**
 * The last arc on the timeline the viewer may open. Arcs are sorted by first episode, so the
 * unlocked ones always come first.
 */
export const selectLastOpenIndex = (state: AtlasState): number =>
  Math.max(
    0,
    selectVisibleArcs(state).findLastIndex((arc) => !isLocked(arc, state.spoilerLimitEpisode)),
  );

/**
 * Where the viewer is in the story: the arc their limit episode falls in (the canon one, if
 * an anime-only arc airs inside it), or the last arc they may open. With no limit, the last
 * arc. It's where the timeline lands when something asks to go past the limit.
 */
export const selectFrontierArc = (state: AtlasState): Arc => {
  const arcs = selectVisibleArcs(state);
  const limit = state.spoilerLimitEpisode;
  return (
    (limit !== null ? arcForEpisode(arcs, limit) : undefined) ??
    arcs[selectLastOpenIndex(state)] ??
    firstArc
  );
};

// ---------------------------------------------------------------------------
// Timeline actions

/**
 * Opens an arc. Locked arcs are refused. Asking for an anime-only arc while they're hidden
 * turns them back on, so a shared link to one still works.
 */
export function goToArc(arcId: string) {
  const arc = arcById.get(arcId);
  const { spoilerLimitEpisode, settings } = useAtlasStore.getState();
  if (!arc || isLocked(arc, spoilerLimitEpisode)) return;
  useAtlasStore.setState({
    currentArcId: arc.id,
    settings: arc.filler && !settings.showFiller ? { ...settings, showFiller: true } : settings,
  });
}

/** Opens the arc at a timeline position, clamped to the arcs the viewer may open. */
export function goToIndex(index: number) {
  const state = useAtlasStore.getState();
  const clamped = Math.min(Math.max(index, 0), selectLastOpenIndex(state));
  const arc = selectVisibleArcs(state)[clamped];
  if (arc) goToArc(arc.id);
}

/** Moves along the timeline: -1 for the previous arc, 1 for the next. */
export function stepArc(delta: number) {
  const state = useAtlasStore.getState();
  const index = selectVisibleArcs(state).findIndex((arc) => arc.id === state.currentArcId);
  goToIndex(index + delta);
}

/**
 * Opens an arc a link points to. If it's past the viewer's limit, it goes to where they are in
 * the story and asks about the limit instead, keeping the arc to open once the limit allows it.
 */
export function openLinkedArc(arcId: string) {
  const arc = arcById.get(arcId);
  const { spoilerLimitEpisode, gate } = useAtlasStore.getState();
  if (!arc) return;
  if (!isLocked(arc, spoilerLimitEpisode)) {
    goToArc(arc.id);
    return;
  }
  goToArc(selectFrontierArc(useAtlasStore.getState()).id);
  useAtlasStore.setState({
    gate: { reason: gate?.reason ?? 'past-limit', requestedArcId: arc.id },
  });
}

// ---------------------------------------------------------------------------
// Settings and the spoiler limit

/** Shows or hides anime-only arcs. Hiding them while on one moves to the nearest canon arc. */
export function setShowFiller(showFiller: boolean) {
  const { settings, currentArcId } = useAtlasStore.getState();
  const current = arcById.get(currentArcId) ?? firstArc;
  const landing = showFiller ? current : (canonArcFor(arcs, current) ?? current);
  useAtlasStore.setState({ settings: { ...settings, showFiller }, currentArcId: landing.id });
  saveSettings(useAtlasStore.getState().settings);
}

/** Changes any other setting, and remembers it for next time. */
export function setSetting(key: Exclude<keyof Settings, 'showFiller'>, value: boolean) {
  const settings = { ...useAtlasStore.getState().settings, [key]: value };
  useAtlasStore.setState({ settings });
  saveSettings(settings);
}

/**
 * Sets the spoiler limit for this session (not saved). If the current arc is now locked,
 * steps back to where the viewer is in the story.
 */
export function setSpoilerLimit(episode: number | null) {
  useAtlasStore.setState({ spoilerLimitEpisode: episode });
  const state = useAtlasStore.getState();
  if (isLocked(selectCurrentArc(state), episode)) goToArc(selectFrontierArc(state).id);
}

/**
 * The viewer's answer to "what episode are you on?" (null: caught up), from the spoiler gate
 * or settings. It's saved for next time, closes the gate, and opens the arc a link asked for
 * if the new limit allows it. If not, the timeline goes to where the viewer is in the story.
 */
export function chooseSpoilerLimit(episode: number | null) {
  const requested = arcById.get(useAtlasStore.getState().gate?.requestedArcId ?? '');
  saveSpoilerLimit(episode);
  setSpoilerLimit(episode);
  useAtlasStore.setState({ gate: null });
  if (!requested) return;
  goToArc(
    isLocked(requested, episode) ? selectFrontierArc(useAtlasStore.getState()).id : requested.id,
  );
}

/** Closes the "past your limit" prompt without changing anything. */
export function dismissGate() {
  useAtlasStore.setState({ gate: null });
}

/**
 * Restores the viewer's saved settings and spoiler limit. On a first visit there's no limit
 * yet: nothing past the first episode shows until they answer the welcome prompt.
 */
export function restoreSaved() {
  const { settings } = useAtlasStore.getState();
  useAtlasStore.setState({ settings: { ...settings, ...loadSettings() } });

  const saved = loadSpoilerLimit();
  if (saved === undefined) {
    setSpoilerLimit(firstArc.episodes[0]);
    useAtlasStore.setState({ gate: { reason: 'welcome' } });
  } else {
    setSpoilerLimit(saved);
  }
}

// ---------------------------------------------------------------------------
// Islands

/** Opens an island's panel, or closes it with null. */
export function selectLocation(locationId: string | null) {
  useAtlasStore.setState({ selectedLocationId: locationId });
}
