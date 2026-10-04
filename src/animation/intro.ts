/**
 * The first-visit intro, about TIMING.intro seconds long: the parchment fog over the chart
 * clears, the Red Line draws itself from pole to pole, the Grand Line sweeps around the world,
 * and the title comes up before the page takes over.
 *
 * Two timelines play it from one script (BEATS): the overlay's (fog and title, in Intro.tsx)
 * and the map's (the coastlines drawing in, in BaseMap.tsx). The overlay's is the clock: when
 * it ends, or is skipped, the intro is over.
 */
import gsap from 'gsap';
import { MAP_HEIGHT, MAP_WIDTH, TIMING } from '@/config';
import { GSAP_EASE } from './easing';

/** When each beat starts and ends, as fractions of TIMING.intro. */
const BEATS = {
  fogClears: [0, 0.32],
  redLine: [0.12, 0.5],
  grandLine: [0.34, 0.74],
  title: [0.56, 0.76],
  handover: [0.88, 1],
} satisfies Record<string, [number, number]>;

/** A beat's start time and duration, in seconds. */
function beat(name: keyof typeof BEATS): [position: number, duration: number] {
  const [start, end] = BEATS[name];
  return [start * TIMING.intro, (end - start) * TIMING.intro];
}

/** The fog clearing and the title rising, then fading as the page takes over. */
export function overlayTimeline(
  { fog, title }: { fog: Element; title: Element },
  onComplete: () => void,
): gsap.core.Timeline {
  const [fogAt, fogFor] = beat('fogClears');
  const [titleAt, titleFor] = beat('title');
  const [handoverAt, handoverFor] = beat('handover');
  return gsap
    .timeline({ onComplete })
    .fromTo(fog, { opacity: 1 }, { opacity: 0, duration: fogFor, ease: GSAP_EASE.fade }, fogAt)
    .fromTo(
      title,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: titleFor, ease: GSAP_EASE.fade },
      titleAt,
    )
    .to(title, { opacity: 0, duration: handoverFor, ease: GSAP_EASE.fade }, handoverAt);
}

/**
 * The Red Line and the Grand Line drawing in, by growing the clip rectangles BaseMap puts
 * over them: the Red Line from north to south, the Grand Line from west to east.
 */
export function revealTimeline({
  redLine,
  grandLine,
}: {
  redLine: SVGRectElement;
  grandLine: SVGRectElement;
}): gsap.core.Timeline {
  const [redAt, redFor] = beat('redLine');
  const [grandAt, grandFor] = beat('grandLine');
  return gsap
    .timeline()
    .fromTo(
      redLine,
      { attr: { height: 0 } },
      { attr: { height: MAP_HEIGHT }, duration: redFor, ease: GSAP_EASE.reveal },
      redAt,
    )
    .fromTo(
      grandLine,
      { attr: { width: 0 } },
      { attr: { width: MAP_WIDTH }, duration: grandFor, ease: GSAP_EASE.reveal },
      grandAt,
    );
}
