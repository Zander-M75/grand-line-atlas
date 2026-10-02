import { useEffect } from 'react';
import type { Soundscape } from '@/audio/soundscape';
import { crew } from '@/data';
import { crewAboard } from '@/data/spoilers';
import { selectCurrentArc, useAtlasStore } from '@/store';

let soundscape: Soundscape | null = null;

/**
 * Plays the optional sound while it's on in Settings (it's off by default). Nothing ever
 * starts on its own: audio waits for a click or key press after sound is turned on, even when
 * a saved setting turns it on at load. The waves pause while the tab is hidden, and a chime
 * plays when the timeline steps forward into an arc where someone joins the crew.
 */
export function useSound() {
  const on = useAtlasStore((state) => state.settings.sound);

  useEffect(() => {
    if (!on) {
      soundscape?.pause();
      return;
    }
    let cancelled = false;
    const start = async () => {
      const { createSoundscape } = await import('@/audio/soundscape');
      if (cancelled) return;
      soundscape ??= createSoundscape();
      if (!document.hidden) soundscape.play();
    };
    const onVisibility = () => (document.hidden ? soundscape?.pause() : soundscape?.play());

    // Turning the switch on is itself a click, so audio can usually start right away.
    const gestures = ['pointerdown', 'keydown'] as const;
    const onGesture = () => {
      gestures.forEach((type) => window.removeEventListener(type, onGesture));
      void start();
    };
    if (navigator.userActivation?.isActive) void start();
    else gestures.forEach((type) => window.addEventListener(type, onGesture));
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      gestures.forEach((type) => window.removeEventListener(type, onGesture));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [on]);

  useEffect(
    () =>
      useAtlasStore.subscribe((state, previous) => {
        if (!state.settings.sound || state.currentArcId === previous.currentArcId) return;
        const arc = selectCurrentArc(state);
        if (arc.order <= selectCurrentArc(previous).order) return;
        const joins = crewAboard(crew, arc, state.spoilerLimitEpisode).some((m) => m.joinsHere);
        if (joins) soundscape?.chime();
      }),
    [],
  );
}
