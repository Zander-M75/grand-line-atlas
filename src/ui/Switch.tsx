import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Violet when on, like everything else that marks anime-only content. */
  filler?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** An on/off switch: a checkbox with the switch role, labeled by its children. */
export function Switch({
  checked,
  onChange,
  filler = false,
  disabled = false,
  className,
  children,
}: SwitchProps) {
  return (
    <label className={cx(styles.switch, filler && styles.filler, className)}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  );
}
