import { domAnimation, LazyMotion } from 'framer-motion';
import { APP_TITLE } from '@/config';
import { useCrewChime } from '@/hooks/useCrewChime';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useMotionAttribute } from '@/hooks/useReducedMotion';
import { useUrlSync } from '@/hooks/useUrlSync';
import { WorldMap } from '@/map/WorldMap';
import { useAtlasStore } from '@/store';
import { ArcCard } from '@/ui/ArcCard';
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
        <main className={styles.mapArea}>
          <WorldMap />
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
