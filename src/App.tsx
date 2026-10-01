import { APP_TITLE } from '@/config';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.shell}>
      <header className={styles.cartouche}>
        <h1 className={styles.title}>{APP_TITLE}</h1>
        <p className={styles.tagline}>The Straw Hat Pirates’ voyage, charted arc by arc</p>
      </header>
    </main>
  );
}
