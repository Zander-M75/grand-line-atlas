/**
 * The first-visit intro (see src/animation/intro.ts): a parchment fog clears off the chart,
 * the Red Line and the Grand Line draw themselves in on the map below, and the title rises,
 * then the page takes over and the camera flies down to the first arc.
 *
 * It plays once per device, never with reduced motion (the store decides, before the first
 * render), and any click or keypress skips it. The page behind it is inert until it ends.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { overlayTimeline } from '@/animation/intro';
import { APP_TITLE } from '@/config';
import { finishIntro, useAtlasStore } from '@/store';
import styles from './Intro.module.css';

/** Keys that don't count as "a keypress" on their own. */
const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

export function Intro() {
  const playing = useAtlasStore((state) => state.introPlaying);
  return playing ? <IntroOverlay /> : null;
}

function IntroOverlay() {
  const fog = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    if (!fog.current || !title.current) return;
    const played = overlayTimeline({ fog: fog.current, title: title.current }, finishIntro);
    timeline.current = played;
    skipButton.current?.focus({ preventScroll: true });
    return () => {
      played.kill();
    };
  }, []);

  // Skipping jumps to the end, which finishes the intro.
  const skip = () => timeline.current?.progress(1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (MODIFIERS.has(event.key) || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      timeline.current?.progress(1);
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, []);

  return (
    <div className={styles.intro} onClick={skip}>
      <div ref={fog} className={styles.fog} />
      <div ref={title} className={styles.title} aria-hidden="true">
        <p className={styles.name}>{APP_TITLE}</p>
        <p className={styles.tagline}>The Straw Hat Pirates’ voyage, arc by arc</p>
      </div>
      <button ref={skipButton} type="button" className={styles.skip} onClick={skip}>
        Skip intro
      </button>
    </div>
  );
}
