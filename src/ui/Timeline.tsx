/**
 * The timeline strip under the map: the current arc's name and episodes, the arc slider
 * (grouped by saga) with previous/next buttons, and the switch for anime-only arcs.
 */
import { episodeLabel } from '@/data/arcs';
import {
  goToIndex,
  selectCurrentArc,
  selectLastOpenIndex,
  selectVisibleArcs,
  setShowFiller,
  stepArc,
  useAtlasStore,
} from '@/store';
import type { Arc } from '@/types';
import { ArcSlider } from './ArcSlider';
import styles from './Timeline.module.css';

export function Timeline() {
  const arcs = useAtlasStore(selectVisibleArcs);
  const arc = useAtlasStore(selectCurrentArc);
  const lastOpen = useAtlasStore(selectLastOpenIndex);
  const showFiller = useAtlasStore((state) => state.settings.showFiller);
  const index = arcs.indexOf(arc);

  return (
    <div className={styles.timeline}>
      <div className={styles.header}>
        <h2 className={styles.arcName}>{arc.name}</h2>
        <p className={styles.details}>
          <span>{episodeLabel(arc)}</span>
          <span className={styles.saga}>{arc.saga}</span>
          <ArcTags arc={arc} />
        </p>
        <label className={styles.fillerSwitch}>
          <input
            type="checkbox"
            role="switch"
            checked={showFiller}
            onChange={(event) => setShowFiller(event.target.checked)}
          />
          Anime-only arcs
        </label>
      </div>

      <div className={styles.controls}>
        <StepButton direction="previous" disabled={index <= 0} onClick={() => stepArc(-1)} />
        <ArcSlider arcs={arcs} value={index} lastOpen={lastOpen} onChange={goToIndex} />
        <StepButton direction="next" disabled={index >= lastOpen} onClick={() => stepArc(1)} />
      </div>
    </div>
  );
}

/** Short notes on what kind of arc this is, and why the ship might not move. */
function ArcTags({ arc }: { arc: Arc }) {
  return (
    <>
      {arc.filler && <span className={styles.fillerTag}>Anime-only</span>}
      {arc.ongoing && <span className={styles.tag}>Now airing</span>}
      {arc.offRoute ? (
        <span className={styles.tag}>Away from the ship</span>
      ) : (
        arc.locationIds.length === 0 && <span className={styles.tag}>No island stop</span>
      )}
    </>
  );
}

function StepButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.step}
      aria-label={direction === 'previous' ? 'Previous arc' : 'Next arc'}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d={direction === 'previous' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'} />
      </svg>
    </button>
  );
}
