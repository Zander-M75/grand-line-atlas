import { describe, expect, it } from 'vitest';
import { facingFor, SHIP_TRAIL, shipTransform } from '@/animation/ship';

/** The numbers in a CSS transform string, in order. */
const numbers = (transform: string) => [...transform.matchAll(/-?[\d.]+/g)].map(Number);

describe('ship pose', () => {
  it('faces the way it sails, east or west', () => {
    expect(facingFor({ x: 1, y: 0 })).toBe('east');
    expect(facingFor({ x: -0.8, y: 0.6 })).toBe('west');
  });

  it('keeps its facing on a course running almost due north or south', () => {
    expect(facingFor({ x: -0.1, y: 0.99 }, 'east')).toBe('east');
    expect(facingFor({ x: 0.1, y: -0.99 }, 'west')).toBe('west');
    expect(facingFor({ x: -0.6, y: 0.8 }, 'east')).toBe('west');
  });

  it('trails behind its point on the route, mirrored when facing west', () => {
    const [dx, dy, , flip] = numbers(shipTransform({ x: -1, y: 0 }, 'west'));
    expect(dx).toBe(SHIP_TRAIL);
    expect(dy).toBeCloseTo(0);
    expect(flip).toBe(-1);
  });

  it('tilts toward its course, but never past its limit', () => {
    const [, , gentle] = numbers(shipTransform({ x: 0.9, y: 0.436 }, 'east'));
    expect(gentle).toBeCloseTo(25.8, 0);
    const [, , steep] = numbers(shipTransform({ x: 0, y: 1 }, 'east'));
    expect(steep).toBeLessThanOrEqual(32);
    // Mirrored, a ship heading south-west dips its bow (on the left) the other way.
    const [, , west] = numbers(shipTransform({ x: -0.9, y: 0.436 }, 'west'));
    expect(west).toBeCloseTo(-25.8, 0);
  });
});
