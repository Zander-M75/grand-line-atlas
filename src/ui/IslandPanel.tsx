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
 */
import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useId, useRef, type MouseEvent, type Ref } from 'react';
import { UI_EASE } from '@/animation/easing';
import { useUiTransition } from '@/animation/ui';
import { TIMING } from '@/config';
import { episodeLabel } from '@/data/arcs';
import { REGION_NAMES, wikiUrl } from '@/data/places';
import { useJourney } from '@/hooks/useJourney';
import { NARROW, useMediaQuery } from '@/hooks/useMediaQuery';
import { goToArc, selectKnownArcs, selectLocation, useAtlasStore } from '@/store';
import type { Arc, Location } from '@/types';
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

  const open = Boolean(island);
  const transition = useUiTransition();
  const narrow = useMediaQuery(NARROW);
  const offset = narrow ? { y: 48 } : { x: 32 };

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
        <m.aside
          key="island-panel"
          ref={panelRef}
          className={styles.panel}
          aria-labelledby={headingId}
          data-map-cover
          // Slides in from the side it's docked to: the right, or the bottom on phones.
          initial={{ opacity: 0, ...offset }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...offset, transition: transition(TIMING.panel * 0.7, UI_EASE.exit) }}
          transition={transition(TIMING.panel)}
        >
          <IslandDetails
            location={island.location}
            arcs={known.filter((arc) => arc.locationIds.includes(island.location.id))}
            currentArcId={currentArc.id}
            limited={limit !== null}
            headingId={headingId}
            headingRef={headingRef}
            onClose={() => close(openerRef.current)}
          />
        </m.aside>
      )}
    </AnimatePresence>
  );
}

interface IslandDetailsProps {
  location: Location;
  /** The arcs set here that the viewer may know about. */
  arcs: Arc[];
  currentArcId: string;
  /** The viewer has a spoiler limit, so the wiki link gets a warning. */
  limited: boolean;
  headingId: string;
  headingRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
}

function IslandDetails({
  location,
  arcs,
  currentArcId,
  limited,
  headingId,
  headingRef,
  onClose,
}: IslandDetailsProps) {
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

      <h3 className={styles.subheading}>{arcs.length === 1 ? 'Arc here' : 'Arcs here'}</h3>
      <ul className={styles.arcs}>
        {arcs.map((arc) => (
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
          <span className={styles.visuallyHidden}> (opens in a new tab)</span>
        </a>
        {limited && (
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
