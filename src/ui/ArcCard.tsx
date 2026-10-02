/**
 * The current arc: saga, episodes, what kind of arc it is, and a short summary. If the
 * viewer's spoiler limit falls inside it, it says so (the summary only covers the setup).
 * Chapter numbers stay out of the UI; the anime is the source of truth. Each arc fades in as
 * the timeline reaches it.
 */
import { m } from 'framer-motion';
import { useId } from 'react';
import { useUiTransition } from '@/animation/ui';
import { TIMING } from '@/config';
import { episodeLabel } from '@/data/arcs';
import { isInProgress } from '@/data/spoilers';
import { selectCurrentArc, useAtlasStore } from '@/store';
import { cx } from '@/utils/cx';
import { ArcTags } from './ArcTags';
import styles from './ArcCard.module.css';

export function ArcCard() {
  const arc = useAtlasStore(selectCurrentArc);
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const headingId = useId();
  const transition = useUiTransition();
  const hasTags = arc.filler || arc.ongoing || arc.offRoute || arc.locationIds.length === 0;
  const inProgress = limit !== null && isInProgress(arc, limit);

  return (
    // On phones the timeline right under the map already names the arc, so the card keeps
    // only what the timeline doesn't say, and folds away if that's nothing.
    // Keyed by arc, so each new arc fades in over the last.
    <m.section
      key={arc.id}
      className={cx(styles.card, !arc.summary && !inProgress && styles.nothingMore)}
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition(TIMING.arcCardFade)}
    >
      <p className={styles.eyebrow}>
        {arc.saga} · {episodeLabel(arc)}
      </p>
      <h2 id={headingId} className={styles.name}>
        {arc.name}
      </h2>
      {hasTags && (
        <p className={styles.tags}>
          <ArcTags arc={arc} />
        </p>
      )}
      {arc.summary && <p className={styles.summary}>{arc.summary}</p>}
      {inProgress && (
        <p className={styles.progress}>You’re partway through: up to episode {limit}.</p>
      )}
    </m.section>
  );
}
