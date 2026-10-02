import { describe, expect, it } from 'vitest';
import { coverInsets, NO_INSETS } from '@/map/covers';

const desktop = { x: 1440, y: 750 };
const phone = { x: 375, y: 560 };

describe('coverInsets', () => {
  it('treats a tall panel in a corner as a side column', () => {
    const logbook = { left: 16, top: 16, right: 368, bottom: 420 };
    expect(coverInsets([logbook], desktop)).toEqual({ ...NO_INSETS, left: 368 });
  });

  it('treats a full-width strip as covering the top, and a sheet as covering the bottom', () => {
    const logbook = { left: 12, top: 12, right: 319, bottom: 150 };
    const sheet = { left: 0, top: 340, right: 375, bottom: 560 };
    expect(coverInsets([logbook, sheet], phone)).toEqual({
      ...NO_INSETS,
      top: 150,
      bottom: 220,
    });
  });

  it('covers both sides when panels sit on both', () => {
    const logbook = { left: 16, top: 16, right: 368, bottom: 420 };
    const island = { left: 1080, top: 72, right: 1424, bottom: 600 };
    expect(coverInsets([logbook, island], desktop)).toEqual({
      ...NO_INSETS,
      left: 368,
      right: 360,
    });
  });

  it('ignores covers that would leave too little of the map to frame in', () => {
    const wide = { left: 16, top: 16, right: 700, bottom: 740 };
    const island = { left: 760, top: 72, right: 1424, bottom: 600 };
    expect(coverInsets([wide, island], desktop)).toEqual(NO_INSETS);
  });
});
