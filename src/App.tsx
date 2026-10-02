import { APP_TITLE } from '@/config';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useMotionAttribute } from '@/hooks/useReducedMotion';
import { useUrlSync } from '@/hooks/useUrlSync';
import { WorldMap } from '@/map/WorldMap';
import { useAtlasStore } from '@/store';
import { ArcCard } from '@/ui/ArcCard';
import { CrewPanel } from '@/ui/CrewPanel';
import { Footer } from '@/ui/Footer';
import { IslandPanel } from '@/ui/IslandPanel';
import { SettingsMenu } from '@/ui/SettingsMenu';
import { SpoilerGate } from '@/ui/SpoilerGate';
import { Timeline } from '@/ui/Timeline';
import styles from './App.module.css';

/**
 * The page: the map with its floating panels (the logbook top-left, settings and the island
 * panel on the right), the timeline under it, and the footer. While the spoiler prompt is
 * open, everything behind it is inert.
 */
export function App() {
  useUrlSync();
  useKeyboardNav();
  useMotionAttribute();
  const gateOpen = useAtlasStore((state) => state.gate !== null);

  return (
    <>
      <div className={styles.app} inert={gateOpen}>
        <main className={styles.mapArea}>
          <WorldMap />
          {/* The chart's cartouche: the atlas title, the current arc, and who's aboard. */}
          <div className={styles.logbook}>
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
    </>
  );
}
