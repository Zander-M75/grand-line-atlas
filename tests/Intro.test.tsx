import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAtlasStore } from '@/store';
import { loadIntroSeen } from '@/store/persist';
import { Intro } from '@/ui/Intro';

const state = () => useAtlasStore.getState();

beforeEach(() => {
  useAtlasStore.setState({ ...useAtlasStore.getInitialState(), introPlaying: true }, true);
});

describe('Intro', () => {
  it('shows nothing unless it’s playing', () => {
    useAtlasStore.setState({ introPlaying: false });
    const { container } = render(<Intro />);
    expect(container).toBeEmptyDOMElement();
  });

  it('can be skipped from the keyboard, and won’t play again', () => {
    render(<Intro />);
    expect(screen.getByRole('button', { name: 'Skip intro' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(state().introPlaying).toBe(false);
    expect(loadIntroSeen()).toBe(true);
  });

  it('can be skipped with a click anywhere', () => {
    const { container } = render(<Intro />);
    fireEvent.click(container.firstElementChild as Element);
    expect(state().introPlaying).toBe(false);
  });

  it('ignores a modifier key on its own', () => {
    render(<Intro />);
    fireEvent.keyDown(window, { key: 'Shift' });
    expect(state().introPlaying).toBe(true);
  });
});
