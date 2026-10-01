import { APP_TITLE } from '@/config';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useUrlSync } from '@/hooks/useUrlSync';
import { WorldMap } from '@/map/WorldMap';
import { Timeline } from '@/ui/Timeline';
import styles from './App.module.css';

export function App() {
  useUrlSync();
  useKeyboardNav();

  return (
    <div className={styles.app}>
      <main className={styles.mapArea}>
        <WorldMap />
        <header className={styles.cartouche}>
          <h1 className={styles.title}>{APP_TITLE}</h1>
          <p className={styles.tagline}>The Straw Hat Pirates’ voyage, charted arc by arc</p>
        </header>
      </main>
      <section className={styles.timelineArea} aria-label="Timeline">
        <Timeline />
      </section>
    </div>
  );
}
