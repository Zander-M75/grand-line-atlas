import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tabbables, trapFocus } from '@/utils/focusTrap';

function Panel() {
  return (
    <>
      <button type="button">Before</button>
      <div data-testid="panel" onKeyDown={trapFocus}>
        <h2 tabIndex={-1}>Heading</h2>
        <button type="button">First</button>
        <button type="button" disabled>
          Disabled
        </button>
        <div hidden>
          <button type="button">Hidden</button>
        </div>
        <a href="#somewhere">Middle</a>
        <input aria-label="Last" />
      </div>
      <button type="button">After</button>
    </>
  );
}

describe('tabbables', () => {
  it('lists what Tab reaches, skipping disabled, hidden, and tabindex -1 elements', () => {
    render(<Panel />);
    expect(
      tabbables(screen.getByTestId('panel')).map((el) => el.textContent || el.ariaLabel),
    ).toEqual(['First', 'Middle', 'Last']);
  });
});

describe('trapFocus', () => {
  it('wraps Tab from the last control to the first, and Shift+Tab back', async () => {
    const user = userEvent.setup();
    render(<Panel />);
    screen.getByLabelText('Last').focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByLabelText('Last')).toHaveFocus();
  });

  it('wraps Shift+Tab from a focused heading, and leaves Tab within the panel alone', async () => {
    const user = userEvent.setup();
    render(<Panel />);
    screen.getByRole('heading').focus();
    await user.tab({ shift: true });
    expect(screen.getByLabelText('Last')).toHaveFocus();

    screen.getByRole('button', { name: 'First' }).focus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Middle' })).toHaveFocus();
  });
});
