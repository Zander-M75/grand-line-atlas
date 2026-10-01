/**
 * The crew's route: legs already sailed in brass, the current arc's legs brighter, legs
 * still ahead not drawn at all. Legs to and from anime-only stops are dotted.
 *
 * It's inline SVG in map pixels (the same space as the base map), so each leg is one real
 * <path> that keeps its shape at every zoom, ready for drawing and sailing animations.
 */
import { Pane, SVGOverlay } from 'react-leaflet';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';
import { routeKey } from '@/data/voyage';
import { useJourney } from '@/hooks/useJourney';
import { cx } from '@/utils/cx';
import { MAP_BOUNDS } from './coords';
import styles from './RouteLayer.module.css';

export function RouteLayer() {
  const { legs } = useJourney();

  return (
    // Above the base map (overlay pane, 400), below the islands and ship (marker pane, 600).
    <Pane name="route" style={{ zIndex: 450 }}>
      <SVGOverlay
        bounds={MAP_BOUNDS}
        attributes={{ viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`, 'aria-hidden': 'true' }}
      >
        {legs.map(({ shape, state }) => (
          <g
            key={routeKey(shape.leg.fromLocationId, shape.leg.toLocationId)}
            className={cx(styles[state], shape.leg.filler && styles.filler)}
          >
            <path className={styles.casing} d={shape.d} />
            <path className={styles.line} d={shape.d} />
          </g>
        ))}
      </SVGOverlay>
    </Pane>
  );
}
