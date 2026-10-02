import { domAnimation, LazyMotion } from 'framer-motion';
import { APP_TITLE } from '@/config';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useMotionAttribute } from '@/hooks/useReducedMotion';
import { useSound } from '@/hooks/useSound';
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
 * panel on the right), the timeline under it, and the footer. While the intro or the spoiler
 * prompt is showing, everything behind it is inert.
 */
export function App() {
  useUrlSync();
  useKeyboardNav();
  useMotionAttribute();
  useSound();
  const covered = useAtlasStore((state) => state.gate !== null || state.intro);

  return (
    // Framer Motion's DOM animations, without its larger feature set (`strict`: only the
    // lightweight `m` components are allowed).
    <LazyMotion features={domAnimation} strict>
      <div className={styles.app} inert={covered}>
        <main className={styles.mapArea}>
          <WorldMap />
          {/* The chart's cartouche: the atlas title, the current arc, and who's aboard. */}
          <div className={styles.logbook} data-map-cover>
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
