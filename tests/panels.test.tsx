import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEDIA } from '@/config';
import { goToArc, setSpoilerLimit, useAtlasStore } from '@/store';
import { ArcCard } from '@/ui/ArcCard';
import { CrewPanel } from '@/ui/CrewPanel';
import { SettingsMenu } from '@/ui/SettingsMenu';
import { Timeline } from '@/ui/Timeline';
import { stubMedia } from './media';

const state = () => useAtlasStore.getState();

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ArcCard', () => {
  it('shows the arc, its saga and episodes, and an anime-only badge', () => {
    goToArc('g-8');
    render(<ArcCard />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('G-8 Arc');
    expect(screen.getByText('Sky Island Saga · Ep. 196–206')).toBeInTheDocument();
    expect(screen.getByText('Anime-only')).toBeInTheDocument();
  });

  it('says when the viewer is partway through the arc', () => {
    setSpoilerLimit(300);
    goToArc('enies-lobby');
    render(<ArcCard />);
    expect(screen.getByText(/partway through: up to episode 300/)).toBeInTheDocument();
  });
});

describe('CrewPanel', () => {
  const names = () =>
    within(screen.getByRole('list'))
      .getAllByRole('listitem')
      .map((item) => item.firstChild?.textContent);

  it('lists who’s aboard, and highlights who joins in this arc', () => {
    goToArc('arlong-park');
    render(<CrewPanel />);
    expect(names()).toEqual(['Monkey D. Luffy', 'Roronoa Zoro', 'Nami', 'Usopp', 'Sanji']);
    expect(screen.getByText('5 aboard')).toBeInTheDocument();
    expect(screen.getByText('Aboard from ep. 44')).toBeInTheDocument();
  });

  it('never lists anyone who joins past the spoiler limit', () => {
    setSpoilerLimit(40);
    goToArc('arlong-park');
    render(<CrewPanel />);
    expect(names()).not.toContain('Nami');
    expect(screen.getByText('4 aboard')).toBeInTheDocument();
  });

  it('folds down to one line that still announces a new member', async () => {
    const user = userEvent.setup();
    goToArc('drum-island');
    render(<CrewPanel />);
    const toggle = screen.getByRole('button', { name: /Crew/ });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(toggle).toHaveTextContent('+ Tony Tony Chopper');
  });
});

describe('SettingsMenu', () => {
  it('opens from its button and closes with Escape, back on the button', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu />);
    const button = screen.getByRole('button', { name: 'Settings' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Settings' })).toBeInTheDocument();

    await user.click(screen.getByLabelText('Last episode you’ve watched'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Settings' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('changes the spoiler limit and the display settings', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('Showing everything that’s aired.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Last episode you’ve watched'), '500');
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(state().spoilerLimitEpisode).toBe(500);
    expect(screen.getByText(/Showing up to episode 500/)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Anime-only arcs' }));
    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(state().settings).toMatchObject({ showFiller: false, reducedMotion: true });
  });

  it('opens as a modal dialog on phones, focused and keeping Tab inside', async () => {
    const user = userEvent.setup();
    stubMedia(MEDIA.narrow);
    render(<SettingsMenu />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { name: 'Settings' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(within(dialog).getByRole('link', { name: 'Source on GitHub' })).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Close settings' })).toHaveFocus();
  });

  it('notes that island positions are approximate', async () => {
    const user = userEvent.setup();
    render(<SettingsMenu />);
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText(/Island positions are approximate/)).toBeInTheDocument();
  });
});

describe('Timeline past the spoiler limit', () => {
  it('names only the sagas the viewer has reached', () => {
    act(() => setSpoilerLimit(100));
    const { container } = render(<Timeline />);
    const sagaNames = [...container.querySelectorAll('[class*="sagaName"]')]
      .map((el) => el.textContent)
      .filter(Boolean);
    expect(sagaNames).toEqual(['East Blue', 'Arabasta']);
  });
});
