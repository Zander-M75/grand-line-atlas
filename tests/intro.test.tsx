import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { finishIntro, restoreSaved, setSetting, startIntro, useAtlasStore } from '@/store';
import { loadIntroSeen } from '@/store/persist';
import { Intro } from '@/ui/Intro';
import { SpoilerGate } from '@/ui/SpoilerGate';

const state = () => useAtlasStore.getState();

beforeEach(() => {
  useAtlasStore.setState(useAtlasStore.getInitialState(), true);
});

describe('the intro', () => {
  it('plays on a first visit, before the spoiler prompt', () => {
    restoreSaved();
    startIntro(false);
    render(
      <>
        <SpoilerGate />
        <Intro />
      </>,
    );
    expect(screen.getByText('Click or press any key to skip')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => finishIntro());
    expect(screen.queryByText('Click or press any key to skip')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Where are you in the story?' })).toBeInTheDocument();
  });

  it('plays only once per device', () => {
    startIntro(false);
    finishIntro();
    expect(loadIntroSeen()).toBe(true);
    startIntro(false);
    expect(state().intro).toBe(false);
  });

  it('is skipped entirely with reduced motion, from the device or from settings', () => {
    startIntro(true);
    expect(state().intro).toBe(false);
    setSetting('reducedMotion', true);
    startIntro(false);
    expect(state().intro).toBe(false);
    expect(loadIntroSeen()).toBe(false);
  });
});
