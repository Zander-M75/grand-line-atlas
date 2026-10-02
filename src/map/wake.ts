/**
 * The ship's wake: a few small foam dots dropped behind it while it sails, each fading as the
 * ship moves on. A fixed pool of circles is reused, so a long voyage never adds DOM nodes.
 */
import { TIMING, WAKE } from '@/config';
import type { MapPoint } from './coords';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface Wake {
  /**
   * The ship is at `point`, moving along `travel` (a unit vector), at `scale` screen pixels
   * per map pixel. Drops a dot `behind` screen pixels back whenever it has gone far enough.
   */
  follow(point: MapPoint, travel: MapPoint, scale: number, behind: number): void;
  /** Forgets the last drop, so the next voyage starts its wake fresh. */
  reset(): void;
}

export function createWake(group: SVGGElement): Wake {
  const dots = Array.from({ length: WAKE.dots }, () => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    group.append(dot);
    return dot;
  });
  let next = 0;
  let last: MapPoint | null = null;

  return {
    follow(point, travel, scale, behind) {
      if (last && Math.hypot(point.x - last.x, point.y - last.y) * scale < WAKE.spacing) return;
      last = point;
      const dot = dots[next];
      next = (next + 1) % dots.length;
      if (!dot?.animate) return;
      dot.setAttribute('cx', String(point.x - (travel.x * behind) / scale));
      dot.setAttribute('cy', String(point.y - (travel.y * behind) / scale));
      dot.setAttribute('r', String(WAKE.radius / scale));
      dot.animate(
        [
          { opacity: 0.7, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(2.2)' },
        ],
        { duration: TIMING.wakeFade * 1000, easing: 'ease-out', fill: 'forwards' },
      );
    },
    reset() {
      last = null;
    },
  };
}
