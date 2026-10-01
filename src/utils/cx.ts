/** Joins class names, skipping the falsy ones: cx(styles.stop, isCurrent && styles.current). */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
