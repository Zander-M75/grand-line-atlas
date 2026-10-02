import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './Tag.module.css';

/** A small boxed label: "Anime-only", "Now airing". Anime-only ones are violet and hatched. */
export function Tag({ filler = false, children }: { filler?: boolean; children: ReactNode }) {
  return <span className={cx(styles.tag, filler && styles.filler)}>{children}</span>;
}
