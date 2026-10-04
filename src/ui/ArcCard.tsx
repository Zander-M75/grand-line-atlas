/**
 * The current arc: saga, episodes, what kind of arc it is, and a short summary. If the
 * viewer's spoiler limit falls inside it, it says so (the summary only covers the setup).
 * Chapter numbers stay out of the UI; the anime is the source of truth.
 *
 * Moving to another arc cross-fades the old card into the new one.
 */
import { AnimatePresence, m, useIsPresent } from 'framer-motion';
import { useId, type Ref } from 'react';
import { MOTION_EASE } from '@/animation/easing';
import { TIMING } from '@/config';
import { episodeLabel } from '@/data/arcs';
import { isInProgress } from '@/data/spoilers';
import { useMotionTransition } from '@/hooks/useMotionTransition';
import { selectCurrentArc, useAtlasStore } from '@/store';
import type { Arc } from '@/types';
import { cx } from '@/utils/cx';
import { ArcTags } from './ArcTags';
import styles from './ArcCard.module.css';

export function ArcCard() {
  const arc = useAtlasStore(selectCurrentArc);
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const headingId = useId();
  const inProgress = limit !== null && isInProgress(arc, limit);

  return (
    // On phones the timeline right under the map already names the arc, so the card keeps
    // only what the timeline doesn't say, and folds away if that's nothing.
    <section
      className={cx(styles.card, !arc.summary && !inProgress && styles.nothingMore)}
      aria-labelledby={headingId}
    >
      {/* popLayout: the outgoing card steps out of the flow and fades over the incoming one. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <ArcSlide key={arc.id} arc={arc} limit={inProgress ? limit : null} headingId={headingId} />
      </AnimatePresence>
    </section>
  );
}

function ArcSlide({
  arc,
  limit,
  headingId,
  ref,
}: {
  arc: Arc;
  limit: number | null;
  headingId: string;
  /** AnimatePresence's popLayout mode measures the slide through this. */
  ref?: Ref<HTMLDivElement>;
}) {
  const transition = useMotionTransition({ duration: TIMING.arcCardFade, ease: MOTION_EASE.fade });
  // While it fades out, the outgoing slide is just a picture: hidden from assistive tech, and
  // without the heading id, so only the current arc is ever announced.
  const present = useIsPresent();
  const hasTags = arc.filler || arc.ongoing || arc.offRoute || arc.locationIds.length === 0;

  return (
    <m.div
      ref={ref}
      className={styles.slide}
      aria-hidden={present ? undefined : true}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <p className={styles.eyebrow}>
        {arc.saga} · {episodeLabel(arc)}
      </p>
      <h2 id={present ? headingId : undefined} className={styles.name}>
        {arc.name}
      </h2>
      {hasTags && (
        <p className={styles.tags}>
          <ArcTags arc={arc} />
        </p>
      )}
      {arc.summary && <p className={styles.summary}>{arc.summary}</p>}
      {limit !== null && (
        <p className={styles.progress}>You’re partway through: up to episode {limit}.</p>
      )}
    </m.div>
  );
}
