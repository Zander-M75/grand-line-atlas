/**
 * The app's one store: where the viewer is on the timeline, their spoiler limit, and settings.
 * Components read it through selectors; changes go through the action functions below,
 * which keep two promises: the current arc is always on the timeline, and never locked.
 */
import { create } from 'zustand';
import { arcById, arcs, firstArc } from '@/data';
import { canonArcFor, isLocked } from '@/data/arcs';
import type { Arc } from '@/types';

export interface Settings {
  /** Anime-only (filler) arcs on the timeline and the map. */
  showFiller: boolean;
  /** Viewer override; the OS setting applies either way (see useReducedMotion). */
  reducedMotion: boolean;
  sound: boolean;
  weather: boolean;
}

export interface AtlasState {
  currentArcId: string;
  /** The last episode the viewer has seen; arcs starting after it are locked. Null: no limit. */
  spoilerLimitEpisode: number | null;
  selectedLocationId: string | null;
  settings: Settings;
}

export const useAtlasStore = create<AtlasState>()(() => ({
  currentArcId: firstArc.id,
  spoilerLimitEpisode: null,
  selectedLocationId: null,
  settings: { showFiller: true, reducedMotion: false, sound: false, weather: true },
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

// ---------------------------------------------------------------------------
// Actions

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

/** Shows or hides anime-only arcs. Hiding them while on one moves to the nearest canon arc. */
export function setShowFiller(showFiller: boolean) {
  const { settings, currentArcId } = useAtlasStore.getState();
  const current = arcById.get(currentArcId) ?? firstArc;
  const landing = showFiller ? current : (canonArcFor(arcs, current) ?? current);
  useAtlasStore.setState({ settings: { ...settings, showFiller }, currentArcId: landing.id });
}

/** Sets the spoiler limit. If the current arc is now locked, steps back to the last open one. */
export function setSpoilerLimit(episode: number | null) {
  useAtlasStore.setState({ spoilerLimitEpisode: episode });
  const state = useAtlasStore.getState();
  if (isLocked(selectCurrentArc(state), episode)) goToIndex(selectLastOpenIndex(state));
}
