/**
 * The page footer: credit for the wiki's story data (CC-BY-SA), a note that the art is
 * original, the unofficial-fan-project disclaimer, and the repo link. One line on wide
 * screens, two on narrower ones (credits, then disclaimer); on phones the extras drop out.
 */
import { LINKS } from '@/config';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.line}>
        <span className={styles.group}>
          Story data from the{' '}
          <a className={styles.link} href={LINKS.wiki} target="_blank" rel="noreferrer">
            One Piece Fandom wiki
          </a>{' '}
          (
          <a className={styles.link} href={LINKS.wikiLicense} target="_blank" rel="noreferrer">
            CC-BY-SA
          </a>
          )<span className={styles.wide}> · Map and icons are original</span>
        </span>
        <span className={styles.group}>
          Unofficial fan project
          <span className={styles.wide}>
            , not affiliated with Eiichiro Oda, Shueisha, or Toei Animation
          </span>{' '}
          ·{' '}
          <a className={styles.link} href={LINKS.repo} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </span>
      </p>
    </footer>
  );
}
