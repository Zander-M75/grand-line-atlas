import { describe, expect, it } from 'vitest';
import { BANDS, BLUE_QUADRANTS, MAP_HEIGHT, MAP_WIDTH, ZONES } from '@/config';

describe('map zones', () => {
  it('fit the Grand Line and both Calm Belts inside the map', () => {
    expect(BANDS.northCalmBelt.top).toBeGreaterThan(0);
    expect(BANDS.northCalmBelt.bottom).toBe(BANDS.grandLine.top);
    expect(BANDS.southCalmBelt.top).toBe(BANDS.grandLine.bottom);
    expect(BANDS.southCalmBelt.bottom).toBeLessThan(MAP_HEIGHT);
  });

  it('split the Grand Line into Paradise and the New World at the Red Line', () => {
    expect(BANDS.paradise.left).toBeLessThan(BANDS.paradise.right);
    expect(BANDS.paradise.right).toBe(BANDS.redLine.left);
    expect(BANDS.newWorld.left).toBe(BANDS.redLine.right);
    expect(BANDS.newWorld.right).toBeLessThanOrEqual(MAP_WIDTH);
  });

  it('put Reverse Mountain on the Grand Line, at the start of Paradise', () => {
    const { x, y } = ZONES.reverseMountain;
    expect(y).toBeGreaterThanOrEqual(BANDS.grandLine.top);
    expect(y).toBeLessThanOrEqual(BANDS.grandLine.bottom);
    expect(x).toBeLessThanOrEqual(BANDS.paradise.left);
  });

  it('give each Blue its own quadrant', () => {
    const quadrants = Object.values(BLUE_QUADRANTS);
    expect(new Set(quadrants).size).toBe(quadrants.length);
  });
});
