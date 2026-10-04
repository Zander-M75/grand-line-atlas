/**
 * The timeline strip under the map: the current arc's name and episodes, the button that plays
 * the guided tour, the switch for anime-only arcs, and the arc slider (grouped by saga) with
 * previous/next buttons. It also announces each new arc to screen readers.
 */
import { useEffect, useRef } from 'react';
import { crew } from '@/data';
import { episodeLabel, spokenArc } from '@/data/arcs';
import { crewAboard } from '@/data/spoilers';
import {
  goToIndex,
  selectCurrentArc,
  selectLastOpenIndex,
  selectVisibleArcs,
  setShowFiller,
  startTour,
  stepArc,
  stopTour,
  useAtlasStore,
} from '@/store';
import type { Arc } from '@/types';
import { cx } from '@/utils/cx';
import { ARC_SLIDER_ID, ArcSlider } from './ArcSlider';
import { ArcTags } from './ArcTags';
import { PauseIcon, PlayIcon } from './icons';
import { Switch } from './Switch';
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
        <TourButton disabled={lastOpen === 0} />
        <Switch
          className={styles.fillerSwitch}
          filler
          checked={showFiller}
          onChange={setShowFiller}
        >
          Anime-only arcs
        </Switch>
      </div>

      <div className={styles.controls}>
        <StepButton direction="previous" disabled={index <= 0} onClick={() => stepArc(-1)} />
        <ArcSlider arcs={arcs} value={index} lastOpen={lastOpen} onChange={goToIndex} />
        <StepButton direction="next" disabled={index >= lastOpen} onClick={() => stepArc(1)} />
      </div>
      <ArcAnnouncer arc={arc} />
    </div>
  );
}

/**
 * Tells screen readers about each new arc, however the viewer got there: the step buttons,
 * the arrow keys anywhere on the page, an island's arc links. The slider announces its own
 * value, so while it has focus this only adds who comes aboard. The arc the page opens on
 * isn't news, so it stays quiet until the first change.
 */
function ArcAnnouncer({ arc }: { arc: Arc }) {
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const regionRef = useRef<HTMLParagraphElement>(null);
  const announcedRef = useRef(arc);

  useEffect(() => {
    if (announcedRef.current === arc || !regionRef.current) return;
    announcedRef.current = arc;
    const onSlider = document.activeElement?.id === ARC_SLIDER_ID;
    const joins = crewAboard(crew, arc, limit)
      .filter(({ joinsHere }) => joinsHere)
      .map(({ member }) => `${member.name} comes aboard.`);
    // Written straight to the DOM: React renders nothing inside the region, so it never
    // re-renders the page just to change what's announced.
    regionRef.current.textContent = [onSlider ? '' : `${spokenArc(arc)}.`, ...joins]
      .filter(Boolean)
      .join(' ');
  }, [arc, limit]);

  // A status region: polite, and read as a whole each time it changes.
  return <p ref={regionRef} className="visually-hidden" role="status" />;
}

/**
 * Plays the voyage by itself, an arc at a time, or pauses it. With nothing past the first arc
 * to sail to (a spoiler limit inside it), there's nothing to play.
 */
function TourButton({ disabled }: { disabled: boolean }) {
  const touring = useAtlasStore((state) => state.touring);
  return (
    <button
      type="button"
      className={cx(styles.tour, touring && styles.touring)}
      disabled={disabled}
      onClick={() => (touring ? stopTour() : startTour())}
    >
      {touring ? <PauseIcon /> : <PlayIcon />}
      {touring ? 'Pause' : 'Play voyage'}
    </button>
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
