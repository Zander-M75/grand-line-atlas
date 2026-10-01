import { describe, expect, it } from 'vitest';
import { applyPositionOverrides } from '@/data/positions';
import type { Location } from '@/types';
import { parsePositions } from '../scripts/lib/devPositionsPlugin';

const island = (id: string, x: number, y: number): Location => ({
  id,
  name: id,
  region: 'paradise',
  x,
  y,
  summary: '',
  wikiTitle: id,
  arcIds: [],
  positionSource: 'auto',
});

describe('applyPositionOverrides', () => {
  it('moves overridden islands and marks them manual', () => {
    const [jaya, water7] = applyPositionOverrides(
      [island('jaya', 100, 200), island('water-7', 300, 400)],
      { jaya: { x: 150, y: 250 } },
    );
    expect(jaya).toMatchObject({ x: 150, y: 250, positionSource: 'manual' });
    expect(water7).toMatchObject({ x: 300, y: 400, positionSource: 'auto' });
  });

  it('ignores overrides for islands that no longer exist', () => {
    const result = applyPositionOverrides([island('jaya', 100, 200)], { atlantis: { x: 1, y: 2 } });
    expect(result).toEqual([island('jaya', 100, 200)]);
  });
});

describe('parsePositions (dev save endpoint)', () => {
  it('rounds to whole pixels and sorts by id', () => {
    expect(parsePositions({ 'water-7': { x: 10.6, y: 20.2 }, jaya: { x: 1, y: 2 } })).toEqual({
      jaya: { x: 1, y: 2 },
      'water-7': { x: 11, y: 20 },
    });
  });

  it('rejects anything that isn’t id → { x, y }', () => {
    expect(() => parsePositions([])).toThrow();
    expect(() => parsePositions({ 'Not An Id': { x: 1, y: 2 } })).toThrow();
    expect(() => parsePositions({ jaya: { x: '1', y: 2 } })).toThrow();
  });
});
