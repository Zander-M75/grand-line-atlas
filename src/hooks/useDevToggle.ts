import { useEffect, useState } from 'react';

/**
 * Dev builds only: Shift+D flips a flag (the island positioner). Ignored while typing in a
 * field. Always false in production.
 */
export function useDevToggle(): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const typing =
        event.target instanceof HTMLElement && event.target.closest('input, textarea, select');
      if (event.shiftKey && event.code === 'KeyD' && !typing) setOn((value) => !value);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return on;
}
