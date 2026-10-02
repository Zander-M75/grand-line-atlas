/**
 * The first-visit intro (PLAN.md §7 Phase 6), about TIMING.intro seconds: sea fog over the
 * chart, the Red Line and the Grand Line drawing in as a cross, the title, then the fog lifts
 * onto the map. A click or any key skips it. It plays once per device, and never with reduced
 * motion (see startIntro in the store).
 */
import { gsap } from 'gsap';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { EASE } from '@/animation/easing';
import { APP_TITLE, TIMING } from '@/config';
import { finishIntro, useAtlasStore } from '@/store';
import styles from './Intro.module.css';

/** The sequence, in seconds on a 3.5-second clock; it's scaled to TIMING.intro. */
const BEATS = {
  redLine: { at: 0.2, duration: 1.2 },
  grandLine: { at: 0.8, duration: 1.2 },
  title: { at: 1.6, duration: 0.8 },
  lift: { at: 2.8, duration: 0.7 },
};
const SCRIPT_LENGTH = 3.5;
const SKIP_FADE = 0.3;

export function Intro() {
  const playing = useAtlasStore((state) => state.intro);
  return playing ? <IntroSequence /> : null;
}

function IntroSequence() {
  const root = useRef<HTMLDivElement>(null);
  const redLine = useRef<SVGPathElement>(null);
  const grandLine = useRef<SVGPathElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const lines = [redLine.current, grandLine.current];
    const tl = gsap.timeline({ onComplete: finishIntro });
    tl.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 })
      .set(title.current, { opacity: 0, y: 12 })
      .to(
        redLine.current,
        { strokeDashoffset: 0, ease: EASE.introDraw, duration: BEATS.redLine.duration },
        BEATS.redLine.at,
      )
      .to(
        grandLine.current,
        { strokeDashoffset: 0, ease: EASE.introDraw, duration: BEATS.grandLine.duration },
        BEATS.grandLine.at,
      )
      .to(
        title.current,
        { opacity: 1, y: 0, ease: EASE.introFade, duration: BEATS.title.duration },
        BEATS.title.at,
      )
      .to(
        root.current,
        { opacity: 0, ease: EASE.introFade, duration: BEATS.lift.duration },
        BEATS.lift.at,
      )
      .timeScale(SCRIPT_LENGTH / TIMING.intro);
    timeline.current = tl;
    return () => {
      tl.kill();
    };
  }, []);

  // Any click or key skips ahead: a quick fade, then the app.
  useEffect(() => {
    const skip = (event: Event) => {
      event.preventDefault();
      const tl = timeline.current;
      if (!tl || tl.data === 'skipping') return;
      tl.data = 'skipping';
      tl.pause();
      gsap.to(root.current, { opacity: 0, duration: SKIP_FADE, onComplete: finishIntro });
    };
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  return (
    <div ref={root} className={styles.intro} role="presentation">
      <svg className={styles.chart} viewBox="0 0 400 200" aria-hidden="true">
        {/* pathLength 1: the draw-in tweens a dash offset from 1 to 0, whatever the size. */}
        <path ref={grandLine} className={styles.grandLine} d="M8 100H392" pathLength={1} />
        <path ref={redLine} className={styles.redLine} d="M200 6V194" pathLength={1} />
      </svg>
      <div ref={title} className={styles.title}>
        <h2 className={styles.name}>{APP_TITLE}</h2>
        <p className={styles.tagline}>The Straw Hat Pirates’ voyage, arc by arc</p>
      </div>
      <p className={styles.skip}>Click or press any key to skip</p>
    </div>
  );
}
