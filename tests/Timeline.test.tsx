import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { arcs } from '@/data';
import { goToArc, useAtlasStore } from '@/store';
import { Timeline } from '@/ui/Timeline';

const current = () => useAtlasStore.getState().currentArcId;
const heading = () => screen.getByRole('heading', { level: 2 });

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
});

describe('Timeline', () => {
  it('names the current arc and its episodes', () => {
    goToArc('enies-lobby');
    render(<Timeline />);
    expect(heading()).toHaveTextContent('Enies Lobby Arc');
    expect(screen.getByText('Ep. 264–312')).toBeInTheDocument();
  });

  it('steps through arcs with the slider’s arrow keys, and jumps with Home and End', async () => {
    const user = userEvent.setup();
    render(<Timeline />);
    const slider = screen.getByRole('slider', { name: 'Story arc' });
    slider.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(current()).toBe('syrup-village');
    expect(slider).toHaveAttribute('aria-valuenow', '3');
    expect(slider).toHaveAttribute(
      'aria-valuetext',
      'Syrup Village Arc, episodes 9 to 18, East Blue Saga',
    );

    await user.keyboard('{End}');
    expect(current()).toBe(arcs.at(-1)?.id);
    await user.keyboard('{Home}');
    expect(current()).toBe('romance-dawn');
  });

  it('jumps a saga at a time with Page Up and Page Down', async () => {
    const user = userEvent.setup();
    goToArc('water-7');
    render(<Timeline />);
    screen.getByRole('slider').focus();
    await user.keyboard('{PageUp}');
    expect(current()).toBe('ice-hunter'); // first arc of the next saga
    await user.keyboard('{PageDown}{PageDown}');
    expect(current()).toBe('goat-island'); // back two saga starts
  });

  it('steps with the previous and next buttons, disabled at the ends', async () => {
    const user = userEvent.setup();
    render(<Timeline />);
    expect(screen.getByRole('button', { name: 'Previous arc' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next arc' }));
    expect(heading()).toHaveTextContent('Orange Town Arc');
  });

  it('removes anime-only arcs from the slider with the switch', async () => {
    const user = userEvent.setup();
    goToArc('warship-island');
    render(<Timeline />);
    const slider = screen.getByRole('slider');
    expect(screen.getByText('Anime-only')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Anime-only arcs' }));
    expect(heading()).toHaveTextContent('Loguetown Arc');
    expect(slider).toHaveAttribute(
      'aria-valuemax',
      String(arcs.filter((arc) => !arc.filler).length),
    );
  });

  it('notes when an arc leaves the ship behind', () => {
    goToArc('impel-down');
    render(<Timeline />);
    expect(screen.getByText('Away from the ship')).toBeInTheDocument();
  });
});
