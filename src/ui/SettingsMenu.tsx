/**
 * The settings button and the panel it opens: the spoiler limit, display options, and the
 * About notes (approximate positions, credits). It's a disclosure: the panel follows the
 * button in tab order. Escape, the close button, or a click outside closes it.
 *
 * Weather and sound switches arrive with those features in Phase 6, so nothing here offers
 * a setting that doesn't do anything yet.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { APP_TITLE, LINKS } from '@/config';
import { meta } from '@/data';
import { useSystemReducedMotion } from '@/hooks/useReducedMotion';
import { chooseSpoilerLimit, setSetting, setShowFiller, useAtlasStore } from '@/store';
import { CloseIcon, SettingsIcon } from './icons';
import { SpoilerForm } from './SpoilerForm';
import { Switch } from './Switch';
import styles from './SettingsMenu.module.css';

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault(); // so the island panel doesn't close too
    close();
  };

  return (
    <div ref={rootRef} className={styles.settings} onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <SettingsIcon />
        <span className={styles.triggerLabel}>Settings</span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel} role="group" aria-labelledby={headingId}>
          <header className={styles.header}>
            <h2 id={headingId} className={styles.heading}>
              Settings
            </h2>
            <button
              type="button"
              className={styles.close}
              aria-label="Close settings"
              onClick={close}
            >
              <CloseIcon />
            </button>
          </header>
          <SpoilerSection />
          <DisplaySection />
          <AboutSection />
        </div>
      )}
    </div>
  );
}

function SpoilerSection() {
  const limit = useAtlasStore((state) => state.spoilerLimitEpisode);
  return (
    <section className={styles.section}>
      <h3 className={styles.subheading}>Spoilers</h3>
      <p className={styles.status} aria-live="polite">
        {limit === null
          ? 'Showing everything that’s aired.'
          : `Showing up to episode ${limit}. Arcs that start later are locked.`}
      </p>
      <SpoilerForm initial={limit} submitLabel="Update" onChoose={chooseSpoilerLimit} />
    </section>
  );
}

function DisplaySection() {
  const settings = useAtlasStore((state) => state.settings);
  const systemReduced = useSystemReducedMotion();
  return (
    <section className={styles.section}>
      <h3 className={styles.subheading}>Display</h3>
      <Switch filler checked={settings.showFiller} onChange={setShowFiller}>
        Anime-only arcs
      </Switch>
      <Switch
        checked={settings.reducedMotion || systemReduced}
        onChange={(on) => setSetting('reducedMotion', on)}
      >
        Reduce motion
      </Switch>
      {systemReduced && (
        <p className={styles.note}>Your device already asks for reduced motion, so it stays on.</p>
      )}
    </section>
  );
}

function AboutSection() {
  return (
    <section className={styles.section}>
      <h3 className={styles.subheading}>About</h3>
      <p>
        {APP_TITLE} follows the Straw Hat Pirates through the One Piece anime, arc by arc,
        anime-only arcs included. Island positions are approximate: the series’ own geography isn’t
        consistent.
      </p>
      <p className={styles.note}>
        Data through episode {meta.latestAiredEpisode}, as of {formatDate(meta.asOf)}.
      </p>
      <ul className={styles.credits}>
        <li>
          Story data from the{' '}
          <a className={styles.link} href={LINKS.wiki} target="_blank" rel="noreferrer">
            One Piece Fandom wiki
          </a>
          , under{' '}
          <a className={styles.link} href={LINKS.wikiLicense} target="_blank" rel="noreferrer">
            CC-BY-SA
          </a>
          . Summaries are written for this project.
        </li>
        <li>Map, ship, and icons are original artwork, drawn in code.</li>
        <li>Fonts: IM Fell English and Atkinson Hyperlegible Next (SIL Open Font License).</li>
        <li>
          Unofficial fan project, not affiliated with Eiichiro Oda, Shueisha, or Toei Animation.{' '}
          <a className={styles.link} href={LINKS.repo} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
          .
        </li>
      </ul>
    </section>
  );
}

/** "2026-10-01" → "October 1, 2026". Parsed as a calendar date, so no time zone shifts it. */
function formatDate(isoDate: string): string {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
