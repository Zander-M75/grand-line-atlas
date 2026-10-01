import { useEffect } from 'react';
import { goToIndex, stepArc } from '@/store';

/**
 * Arrow keys step through arcs from anywhere on the page, and Home/End jump to the ends,
 * except where those keys already mean something: in text fields and selects, and on the
 * map, where arrows pan. The timeline slider handles its own keys when it has focus.
 */
export function useKeyboardNav() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest(IGNORE)) return;

      const action = ACTIONS[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

const IGNORE =
  'input:not([type=checkbox]), textarea, select, [contenteditable], .leaflet-container';

const ACTIONS: Record<string, () => void> = {
  ArrowLeft: () => stepArc(-1),
  ArrowRight: () => stepArc(1),
  Home: () => goToIndex(0),
  End: () => goToIndex(Infinity),
};
