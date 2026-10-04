import { domAnimation, LazyMotion } from 'framer-motion';
import { APP_TITLE } from '@/config';
import { useCrewChime } from '@/hooks/useCrewChime';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useMotionAttribute } from '@/hooks/useReducedMotion';
import { useUrlSync } from '@/hooks/useUrlSync';
import { WorldMap } from '@/map/WorldMap';
import { useAtlasStore } from '@/store';
import { ArcCard } from '@/ui/ArcCard';
import { ARC_SLIDER_ID } from '@/ui/ArcSlider';
import { CrewPanel } from '@/ui/CrewPanel';
import { Footer } from '@/ui/Footer';
import { Intro } from '@/ui/Intro';
import { IslandPanel } from '@/ui/IslandPanel';
import { SettingsMenu } from '@/ui/SettingsMenu';
import { SpoilerGate } from '@/ui/SpoilerGate';
import { Timeline } from '@/ui/Timeline';
import styles from './App.module.css';

/**
 * The page: the map with its floating panels (the logbook top-left, settings and the island
 * panel on the right), the timeline under it, and the footer. While the first-visit intro
 * plays, only the map shows; while it or the spoiler prompt is open, the page is inert.
 *
 * Source order is reading and Tab order: a skip link, the logbook and settings, then the map
 * (one Tab stop per island) and the island panel, the timeline, the footer. The panels float
 * over the map wherever they sit in the source.
 */
export function App() {
  useUrlSync();
  useKeyboardNav();
  useMotionAttribute();
  useCrewChime();
  const gateOpen = useAtlasStore((state) => state.gate !== null);
  const introPlaying = useAtlasStore((state) => state.introPlaying);

  return (
    // Framer Motion's lighter build: `m` components with just the animation features used.
    <LazyMotion features={domAnimation} strict>
      <div
        className={styles.app}
        inert={gateOpen || introPlaying}
        data-intro={introPlaying ? 'playing' : undefined}
      >
        <SkipLink />
        <main className={styles.mapArea}>
          {/* The chart's cartouche: the atlas title, the current arc, and who's aboard. The
              camera keeps what it frames clear of it (data-covers-map, see map/camera.ts). */}
          <div className={styles.logbook} data-covers-map>
            <header className={styles.masthead}>
              <h1 className={styles.title}>{APP_TITLE}</h1>
              <p className={styles.tagline}>The Straw Hat Pirates’ voyage, arc by arc</p>
            </header>
            <ArcCard />
            <CrewPanel />
          </div>
          <SettingsMenu />
          <WorldMap />
          <IslandPanel />
        </main>
        <section className={styles.timelineArea} aria-label="Timeline">
          <Timeline />
        </section>
        <Footer />
      </div>
      <SpoilerGate />
      <Intro />
    </LazyMotion>
  );
}

/**
 * The first Tab stop, shown only when focused: straight to the timeline slider, past the
 * map's islands. It moves focus itself rather than following the link, so the URL never
 * picks up a #fragment.
 */
function SkipLink() {
  return (
    <a
      className={styles.skipLink}
      href={`#${ARC_SLIDER_ID}`}
      onClick={(event) => {
        event.preventDefault();
        document.getElementById(ARC_SLIDER_ID)?.focus();
      }}
    >
      Skip to the timeline
    </a>
  );
}
