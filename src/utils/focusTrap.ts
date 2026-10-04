import type { KeyboardEvent } from 'react';

const TABBABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * The elements Tab reaches inside `container`, in order. (Nothing in the app uses a positive
 * tabindex, so document order is Tab order.)
 */
export function tabbables(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.closest('[hidden], [inert]') &&
      element.checkVisibility?.() !== false,
  );
}

/**
 * A keydown handler that keeps Tab inside the element it's attached to: Tab from the last
 * control wraps to the first, and Shift+Tab from the first (or from anything Tab can't reach,
 * such as a panel heading that was focused on open) wraps to the last.
 */
export function trapFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return;
  const items = tabbables(event.currentTarget);
  const first = items[0];
  const last = items.at(-1);
  if (!first || !last) return;

  const active = document.activeElement;
  const leaving = event.shiftKey
    ? active === first || !items.some((item) => item === active)
    : active === last;
  if (!leaving) return;
  event.preventDefault();
  (event.shiftKey ? last : first).focus();
}
