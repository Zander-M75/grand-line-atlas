import { describe, expect, it } from 'vitest';
import { BANDS } from '@/config';
import { wavePath } from '@/map/oceanShapes';

/** The start point of every wave mark in the path. */
const marks = () =>
  [...wavePath().matchAll(/M(-?[\d.]+) (-?[\d.]+)/g)].map(([, x, y]) => ({
    x: Number(x),
    y: Number(y),
  }));

describe('wavePath', () => {
  it('scatters marks over open water, the same way every time', () => {
    expect(marks().length).toBeGreaterThan(200);
    expect(wavePath()).toBe(wavePath());
  });

  it('keeps the Calm Belts and the Red Line still', () => {
    const inBand = (y: number, band: { top: number; bottom: number }) =>
      y >= band.top && y <= band.bottom;
    for (const { x, y } of marks()) {
      expect(inBand(y, BANDS.northCalmBelt)).toBe(false);
      expect(inBand(y, BANDS.southCalmBelt)).toBe(false);
      expect(x + 28 > BANDS.redLine.left && x < BANDS.redLine.right).toBe(false);
    }
  });
});
