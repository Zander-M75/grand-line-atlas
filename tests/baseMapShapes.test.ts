import { describe, expect, it } from 'vitest';
import { MAP_WIDTH } from '@/config';
import { redLineBand } from '@/map/baseMapShapes';
import { randomFor, seededRandom } from '@/utils/random';

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect(first.every((n) => n >= 0 && n < 1)).toBe(true);
  });

  it('can be seeded by a string, such as an island id', () => {
    expect(randomFor('water-7')()).toBe(randomFor('water-7')());
    expect(randomFor('water-7')()).not.toBe(randomFor('enies-lobby')());
  });
});

describe('redLineBand', () => {
  it('draws the same rock on every load', () => {
    expect(redLineBand(1940, 2060, 1)).toEqual(redLineBand(1940, 2060, 1));
    expect(redLineBand(1940, 2060, 1).outline).not.toBe(redLineBand(1940, 2060, 2).outline);
  });

  it('keeps an edge on the map border straight and free of hachures', () => {
    const westHalf = redLineBand(0, 60, 2);
    expect(westHalf.outline.startsWith('M0 0L0 2000')).toBe(true);
    // Every hachure starts near the ragged east edge, never at the border.
    const starts = [...westHalf.hachures.matchAll(/M([\d.]+) /g)].map((m) => Number(m[1]));
    expect(Math.min(...starts)).toBeGreaterThan(30);

    const eastHalf = redLineBand(MAP_WIDTH - 60, MAP_WIDTH, 3);
    expect(eastHalf.outline).toContain(`L${MAP_WIDTH} 0`);
  });
});
