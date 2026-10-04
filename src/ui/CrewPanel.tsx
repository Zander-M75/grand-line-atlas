/**
 * Who's aboard by the end of the current arc, as typographic cards (no character art).
 * Members who join in this arc are highlighted; anyone joining after the viewer's spoiler
 * limit isn't listed at all, and the count never says how many are still to come.
 *
 * It folds down to a single line (open by default on wide screens, closed on phones), and
 * the folded line still announces a new member. A member's card pops in as they join.
 */
import { m } from 'framer-motion';
import { useId, useMemo, useState } from 'react';
import { POP_SPRING } from '@/animation/easing';
import { MEDIA } from '@/config';
import { crew } from '@/data';
import { crewAboard } from '@/data/spoilers';
import { useMotionTransition } from '@/hooks/useMotionTransition';
import { selectCurrentArc, useAtlasStore } from '@/store';
import { cx } from '@/utils/cx';
import { matchesMedia } from '@/utils/media';
import { ChevronIcon } from './icons';
import styles from './CrewPanel.module.css';

export function CrewPanel() {
  const arc = useAtlasStore(selectCurrentArc);
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const aboard = useMemo(() => crewAboard(crew, arc, limit), [arc, limit]);
  const [open, setOpen] = useState(() => !matchesMedia(MEDIA.narrow));
  const listId = useId();
  const pop = useMotionTransition(POP_SPRING);

  const joining = aboard.filter(({ joinsHere }) => joinsHere);
  const joinNote =
    joining.length === 1
      ? `+ ${joining[0]?.member.name}`
      : joining.length > 1 && `+ ${joining.length} new`;

  return (
    <section className={styles.crew}>
      <h2 className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.title}>Crew</span>
          <span className={styles.count}>{aboard.length} aboard</span>
          {!open && joinNote && <span className={styles.joinNote}>{joinNote}</span>}
          <span className={cx(styles.chevron, open && styles.chevronOpen)}>
            <ChevronIcon />
          </span>
        </button>
      </h2>

      <ul id={listId} className={styles.list} hidden={!open}>
        {aboard.map(({ member, joinsHere }) => (
          // A card appears when its member comes aboard: it pops in if they join here.
          <m.li
            key={member.id}
            className={cx(styles.member, joinsHere && styles.joins)}
            initial={joinsHere ? { opacity: 0, scale: 0.8 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={pop}
          >
            <span className={styles.name}>{member.name}</span>
            <span className={styles.role}>{member.role}</span>
            {joinsHere && (
              <span className={styles.joined}>Aboard from ep. {member.joinedEpisode}</span>
            )}
          </m.li>
        ))}
      </ul>
    </section>
  );
}
