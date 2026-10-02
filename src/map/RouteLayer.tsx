/**
 * The crew's route: legs already sailed in brass, the current arc's legs brighter, legs
 * still ahead not drawn at all. Legs to and from anime-only stops are dotted.
 *
 * It's inline SVG in map pixels (the same space as the base map), so each leg is one real
 * <path> that keeps its shape at every zoom. The voyage animation (src/map/Voyage.tsx) draws
 * legs in and out with masks it adds to these groups, and drops the ship's wake into `wake`.
 */
import type { Ref } from 'react';
import { Pane, SVGOverlay } from 'react-leaflet';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';
import { cx } from '@/utils/cx';
import { MAP_BOUNDS } from './coords';
import { legKey, type LegShape, type LegState } from './journey';
import styles from './RouteLayer.module.css';

interface RouteLayerProps {
  legs: { shape: LegShape; state: LegState }[];
  /** Legs being un-drawn after a step back, drawn as current until they're gone. */
  leaving: LegShape[];
  /** The group holding every leg, each a <g data-leg="from>to"> whose last path is the line. */
  routeRef: Ref<SVGGElement>;
  defsRef: Ref<SVGDefsElement>;
  wakeRef: Ref<SVGGElement>;
}

export function RouteLayer({ legs, leaving, routeRef, defsRef, wakeRef }: RouteLayerProps) {
  const drawn = [...legs, ...leaving.map((shape) => ({ shape, state: 'current' as const }))];

  return (
    // Above the base map (overlay pane, 400), below the islands and ship (marker pane, 600).
    <Pane name="route" style={{ zIndex: 450 }}>
      <SVGOverlay
        bounds={MAP_BOUNDS}
        attributes={{ viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`, 'aria-hidden': 'true' }}
      >
        <defs ref={defsRef} />
        <g ref={wakeRef} className={styles.wake} />
        <g ref={routeRef}>
          {drawn.map(({ shape, state }) => (
            <g
              key={legKey(shape)}
              data-leg={legKey(shape)}
              className={cx(styles[state], shape.leg.filler && styles.filler)}
            >
              <path className={styles.casing} d={shape.d} />
              <path className={styles.line} d={shape.d} />
            </g>
          ))}
        </g>
      </SVGOverlay>
    </Pane>
  );
}
