/**
 * The crew's route: legs already sailed in brass, the current arc's legs brighter, legs
 * still ahead not drawn at all. Legs to and from anime-only stops are dotted, and Luffy's
 * own path through the Summit War, away from the ship, is dashed.
 *
 * It's inline SVG in map pixels (the same space as the base map), so each leg is one real
 * <path> that keeps its shape at every zoom. Legs the voyage animation is drawing or
 * rewinding are handed to it through `elements`; it rewrites their path data each frame.
 */
import type { Ref } from 'react';
import { Pane, SVGOverlay } from 'react-leaflet';
import { legKey, type LegElements } from '@/animation/sail';
import type { PlannedLeg } from '@/animation/voyagePlan';
import { cx } from '@/utils/cx';
import { MAP_BOUNDS } from './coords';
import { MAP_PICTURE_ATTRIBUTES } from './overlay';
import styles from './RouteLayer.module.css';

interface RouteLayerProps {
  legs: PlannedLeg[];
  /** Filled with the elements of each animating leg, by legKey. */
  elements: Map<string, LegElements>;
  /** The group the ship's wake is drawn into. */
  wakeRef: Ref<SVGGElement>;
}

export function RouteLayer({ legs, elements, wakeRef }: RouteLayerProps) {
  return (
    // Above the base map (overlay pane, 400), below the islands and ship (marker pane, 600).
    <Pane name="route" style={{ zIndex: 450 }}>
      <SVGOverlay bounds={MAP_BOUNDS} attributes={MAP_PICTURE_ATTRIBUTES}>
        {legs.map(({ shape, state, motion }) => {
          const key = legKey(shape);
          // An animating leg is its own element (keyed by its motion), so it starts from its
          // first frame, and a leg that stops animating comes back as a fresh, whole path.
          const register = motion
            ? (group: SVGGElement) => {
                const [casing, line] = group.querySelectorAll('path');
                if (casing && line) elements.set(key, { casing, line });
                return () => {
                  elements.delete(key);
                };
              }
            : undefined;
          const d = motion === 'draw' ? '' : shape.d;
          return (
            <g
              key={motion ? `${key}:${motion}` : key}
              ref={register}
              className={cx(
                styles[state],
                shape.leg.filler && styles.filler,
                shape.leg.side && styles.side,
              )}
            >
              <path className={styles.casing} d={d} />
              <path className={styles.line} d={d} />
            </g>
          );
        })}
        {/* Over the legs: the wake falls on the line the ship has just drawn. */}
        <g ref={wakeRef} className={styles.wake} />
      </SVGOverlay>
    </Pane>
  );
}
