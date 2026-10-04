/**
 * The island the viewer clicked: where it is, what happens there, the arcs set there (each a
 * link that jumps the timeline to it), and a link to its wiki page. A card on the right on
 * wide screens, a bottom sheet on phones.
 *
 * It only lists what the viewer may know: arcs on the timeline and inside their spoiler
 * limit. An island they can't see on the map can't be open here either.
 *
 * Opening it moves focus to its heading. Escape or the close button hands focus back to the
 * island that opened it. It slides in from the edge it's docked to, and back out on close.
 * On phones the sheet covers much of the map, so it's a modal dialog there: Tab stays inside
 * it until it closes.
 */
import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useId, useRef, type MouseEvent, type Ref } from 'react';
import { MOTION_EASE } from '@/animation/easing';
import { MEDIA, TIMING } from '@/config';
import { episodeLabel } from '@/data/arcs';
import { REGION_NAMES, wikiUrl } from '@/data/places';
import { useJourney } from '@/hooks/useJourney';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMotionTransition } from '@/hooks/useMotionTransition';
import { goToArc, selectKnownArcs, selectLocation, useAtlasStore } from '@/store';
import type { Arc, Location } from '@/types';
import { trapFocus } from '@/utils/focusTrap';
import { CloseIcon, ExternalIcon } from './icons';
import { Tag } from './Tag';
import styles from './IslandPanel.module.css';

export function IslandPanel() {
  const selectedId = useAtlasStore((state) => state.selectedLocationId);
  const known = useAtlasStore(selectKnownArcs);
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  const { islands, arc: currentArc } = useJourney();
  const island = islands.find(({ location }) => location.id === selectedId);

  const panelRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<Element | null>(null);
  const headingId = useId();
  const narrow = useMediaQuery(MEDIA.narrow);
  const transition = useMotionTransition({ duration: TIMING.panel, ease: MOTION_EASE.enter });
  // Off the edge it's docked to: the right side, or the bottom on phones.
  const away = narrow ? { opacity: 0, y: 48 } : { opacity: 0, x: 32 };

  const open = Boolean(island);

  // Move focus into the panel whenever it opens or switches island, remembering what had it.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (active && !panelRef.current?.contains(active)) openerRef.current = active;
    headingRef.current?.focus({ preventScroll: true });
  }, [open, selectedId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Settings (or the spoiler prompt) claims Escape first when it's open.
      if (event.key !== 'Escape' || event.defaultPrevented || useAtlasStore.getState().gate) return;
      close(openerRef.current);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {island && (
        // A section, since <aside> can't take the dialog role.
        <m.section
          key="island-panel"
          ref={panelRef}
          className={styles.panel}
          role={narrow ? 'dialog' : 'complementary'}
          aria-modal={narrow || undefined}
          aria-labelledby={headingId}
          data-covers-map
          onKeyDown={narrow ? trapFocus : undefined}
          initial={away}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={away}
          transition={transition}
        >
          <IslandDetails
            location={island.location}
            arcsHere={known.filter((arc) => arc.locationIds.includes(island.location.id))}
            currentArcId={currentArc.id}
            showSpoilerNote={limit !== null}
            headingId={headingId}
            headingRef={headingRef}
            onClose={() => close(openerRef.current)}
          />
        </m.section>
      )}
    </AnimatePresence>
  );
}

function IslandDetails({
  location,
  arcsHere,
  currentArcId,
  showSpoilerNote,
  headingId,
  headingRef,
  onClose,
}: {
  location: Location;
  arcsHere: Arc[];
  currentArcId: string;
  showSpoilerNote: boolean;
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
}) {
  const region = REGION_NAMES[location.region];
  return (
    <>
      <header className={styles.header}>
        <div>
          {region && <p className={styles.eyebrow}>{region}</p>}
          <h2 ref={headingRef} id={headingId} className={styles.name} tabIndex={-1}>
            {location.name}
          </h2>
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Close island details"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>

      {location.animeOnly && (
        <p>
          <Tag filler>Anime-only place</Tag>
        </p>
      )}
      {location.summary && <p className={styles.summary}>{location.summary}</p>}

      <h3 className={styles.subheading}>{arcsHere.length === 1 ? 'Arc here' : 'Arcs here'}</h3>
      <ul className={styles.arcs}>
        {arcsHere.map((arc) => (
          <li key={arc.id}>
            <ArcLink arc={arc} current={arc.id === currentArcId} />
          </li>
        ))}
      </ul>

      <p className={styles.wiki}>
        <a
          className={styles.wikiLink}
          href={wikiUrl(location.wikiTitle)}
          target="_blank"
          rel="noreferrer"
        >
          Read more on the wiki
          <ExternalIcon />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        {showSpoilerNote && (
          <span className={styles.wikiNote}>
            Wiki pages cover the whole story, spoilers included.
          </span>
        )}
      </p>
    </>
  );
}

/** A real link to the arc's URL (so it can open in a new tab) that jumps the timeline. */
function ArcLink({ arc, current }: { arc: Arc; current: boolean }) {
  const onClick = (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goToArc(arc.id);
  };

  return (
    <a
      className={styles.arcLink}
      href={`?arc=${encodeURIComponent(arc.id)}`}
      aria-current={current ? 'true' : undefined}
      onClick={onClick}
    >
      <span className={styles.arcName}>{arc.name}</span>
      <span className={styles.arcMeta}>
        {current ? 'Showing now' : episodeLabel(arc)}
        {arc.filler && <Tag filler>Anime-only</Tag>}
      </span>
    </a>
  );
}

/** Closes the panel, returning focus to the island (or whatever) that opened it. */
function close(opener: Element | null) {
  if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
  selectLocation(null);
}
