import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEDIA } from '@/config';
import { goToArc, selectLocation, setShowFiller, setSpoilerLimit, useAtlasStore } from '@/store';
import { IslandPanel } from '@/ui/IslandPanel';
import { stubMedia } from './media';

const state = () => useAtlasStore.getState();
const panel = () => screen.getByRole('complementary');
const arcLinks = () =>
  within(panel())
    .getAllByRole('link')
    .filter((link) => link.getAttribute('href')?.startsWith('?arc='));

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('IslandPanel', () => {
  it('stays closed until an island is chosen', () => {
    render(<IslandPanel />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('names the island and its region, and lists the arcs set there', () => {
    selectLocation('water-7');
    render(<IslandPanel />);
    expect(within(panel()).getByRole('heading', { level: 2 })).toHaveTextContent('Water 7');
    expect(panel()).toHaveTextContent('Paradise, Grand Line');
    expect(arcLinks().map((link) => link.getAttribute('href'))).toEqual([
      '?arc=water-7',
      '?arc=post-enies-lobby',
    ]);
  });

  it('jumps the timeline to an arc when its link is clicked', async () => {
    const user = userEvent.setup();
    goToArc('water-7');
    selectLocation('water-7');
    render(<IslandPanel />);
    expect(arcLinks()[0]).toHaveAttribute('aria-current', 'true');

    await user.click(screen.getByRole('link', { name: /Post-Enies Lobby Arc/ }));
    expect(state().currentArcId).toBe('post-enies-lobby');
    expect(arcLinks()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('links to the island’s wiki page, in a new tab', () => {
    selectLocation('goat-island');
    render(<IslandPanel />);
    const link = screen.getByRole('link', { name: /Read more on the wiki/ });
    expect(link).toHaveAttribute(
      'href',
      'https://onepiece.fandom.com/wiki/Goat_Island_(Non-Canon)',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(panel()).toHaveTextContent('Anime-only place');
  });

  it('leaves out arcs past the spoiler limit, and warns that the wiki doesn’t', () => {
    selectLocation('foosha-village');
    setSpoilerLimit(500);
    const { rerender } = render(<IslandPanel />);
    expect(arcLinks()).toHaveLength(1); // Uta's Past (1029) is locked
    expect(panel()).toHaveTextContent('spoilers included');

    act(() => setSpoilerLimit(null));
    rerender(<IslandPanel />);
    expect(arcLinks()).toHaveLength(2);
    expect(panel()).not.toHaveTextContent('spoilers included');
  });

  it('leaves out anime-only arcs while they’re hidden', () => {
    selectLocation('orange-town');
    setShowFiller(false);
    render(<IslandPanel />);
    expect(arcLinks().map((link) => link.textContent)).toEqual([
      expect.stringContaining('Orange Town Arc'),
    ]);
  });

  it('can’t open an island the viewer hasn’t reached', () => {
    setSpoilerLimit(300);
    selectLocation('wano-country');
    render(<IslandPanel />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('closes with Escape or the close button', async () => {
    const user = userEvent.setup();
    selectLocation('water-7');
    render(<IslandPanel />);
    await user.keyboard('{Escape}');
    expect(state().selectedLocationId).toBeNull();

    act(() => selectLocation('water-7'));
    await user.click(screen.getByRole('button', { name: 'Close island details' }));
    expect(state().selectedLocationId).toBeNull();
  });
});

describe('IslandPanel on phones', () => {
  it('is a modal dialog that keeps Tab inside it', async () => {
    const user = userEvent.setup();
    stubMedia(MEDIA.narrow);
    selectLocation('water-7');
    render(<IslandPanel />);
    const dialog = screen.getByRole('dialog', { name: 'Water 7' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus();

    const close = within(dialog).getByRole('button', { name: 'Close island details' });
    const wiki = within(dialog).getByRole('link', { name: /Read more on the wiki/ });
    wiki.focus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(wiki).toHaveFocus();
  });

  it('stays a plain side panel on wider screens', () => {
    selectLocation('water-7');
    render(<IslandPanel />);
    expect(panel()).not.toHaveAttribute('aria-modal');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
