import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { openLinkedArc, restoreSaved, setSpoilerLimit, useAtlasStore } from '@/store';
import { loadSpoilerLimit, saveIntroSeen } from '@/store/persist';
import { SpoilerGate } from '@/ui/SpoilerGate';

const state = () => useAtlasStore.getState();
const episodeField = () => screen.getByLabelText('Last episode you’ve watched');

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
  // A first visit plays the intro before asking; these tests start once it has played.
  saveIntroSeen();
});

describe('SpoilerGate', () => {
  it('waits for the intro on the very first visit', () => {
    localStorage.clear();
    restoreSaved();
    const { container } = render(<SpoilerGate />);
    expect(state().introPlaying).toBe(true);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing once the viewer has answered', () => {
    const { container } = render(<SpoilerGate />);
    expect(container).toBeEmptyDOMElement();
  });

  it('asks a first-time viewer, with the episode field ready to type in', () => {
    restoreSaved();
    render(<SpoilerGate />);
    expect(screen.getByRole('dialog', { name: 'Where are you in the story?' })).toBeInTheDocument();
    expect(episodeField()).toHaveFocus();
  });

  it('saves the episode the viewer enters and closes', async () => {
    const user = userEvent.setup();
    restoreSaved();
    render(<SpoilerGate />);
    await user.type(episodeField(), '300{Enter}');
    expect(state().spoilerLimitEpisode).toBe(300);
    expect(loadSpoilerLimit()).toBe(300);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refuses anything that isn’t an episode number', async () => {
    const user = userEvent.setup();
    restoreSaved();
    render(<SpoilerGate />);
    await user.type(episodeField(), 'abc{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an episode number');
    expect(episodeField()).toHaveAttribute('aria-invalid', 'true');
    expect(state().gate).not.toBeNull();
  });

  it('takes an arc instead, starting from its first episode', async () => {
    const user = userEvent.setup();
    restoreSaved();
    render(<SpoilerGate />);
    await user.selectOptions(screen.getByLabelText('Or the arc you’re on'), 'water-7');
    expect(episodeField()).toHaveValue('229');
    await user.click(screen.getByRole('button', { name: 'Set sail' }));
    expect(state().spoilerLimitEpisode).toBe(229);
  });

  it('opens everything for "I’m caught up"', async () => {
    const user = userEvent.setup();
    restoreSaved();
    render(<SpoilerGate />);
    await user.click(screen.getByRole('button', { name: 'I’m caught up' }));
    expect(state().spoilerLimitEpisode).toBeNull();
    expect(state().gate).toBeNull();
  });

  it('needs an answer on a first visit: Escape doesn’t close it', async () => {
    const user = userEvent.setup();
    restoreSaved();
    render(<SpoilerGate />);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('explains a link past the limit without naming the arc, and lets the viewer stay', async () => {
    const user = userEvent.setup();
    setSpoilerLimit(300);
    openLinkedArc('wano-country');
    render(<SpoilerGate />);
    const dialog = screen.getByRole('dialog', { name: 'This link goes past your episode' });
    // The prompt's own words don't name the arc (the picker lists every arc, by design).
    expect(dialog).toHaveAccessibleDescription(/starts after episode 300/);
    expect(dialog).not.toHaveAccessibleDescription(/wano/i);
    expect(episodeField()).toHaveValue('300');

    await user.keyboard('{Escape}');
    expect(state().gate).toBeNull();
    expect(state().spoilerLimitEpisode).toBe(300);
  });
});
