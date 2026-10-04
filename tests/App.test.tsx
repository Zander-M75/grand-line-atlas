import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';
import { APP_TITLE } from '@/config';

describe('App', () => {
  it('shows the app title as the page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: APP_TITLE })).toBeInTheDocument();
  });

  it('starts the Tab order with a link that skips the map, straight to the timeline', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to the timeline' });
    expect(skip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('slider', { name: 'Story arc' })).toHaveFocus();
    expect(window.location.hash).toBe('');
  });
});
