import { describe, expect, it } from 'vitest';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';
import { fromLatLng, MAP_BOUNDS, toLatLng } from '@/map/coords';

describe('toLatLng', () => {
  it('maps the four corners of the base map', () => {
    expect(toLatLng(0, 0)).toEqual([MAP_HEIGHT, 0]); // top-left
    expect(toLatLng(MAP_WIDTH, 0)).toEqual([MAP_HEIGHT, MAP_WIDTH]); // top-right
    expect(toLatLng(0, MAP_HEIGHT)).toEqual([0, 0]); // bottom-left
    expect(toLatLng(MAP_WIDTH, MAP_HEIGHT)).toEqual([0, MAP_WIDTH]); // bottom-right
  });

  it('puts points lower on the map at lower latitudes', () => {
    const [northLat] = toLatLng(500, 200);
    const [southLat] = toLatLng(500, 1800);
    expect(northLat).toBeGreaterThan(southLat);
  });
});

describe('fromLatLng', () => {
  it('undoes toLatLng', () => {
    for (const [x, y] of [
      [0, 0],
      [2000, 1000],
      [3999.5, 12.25],
    ] as const) {
      const [lat, lng] = toLatLng(x, y);
      expect(fromLatLng({ lat, lng })).toEqual({ x, y });
    }
  });
});

describe('MAP_BOUNDS', () => {
  it('spans [[0, 0], [MAP_HEIGHT, MAP_WIDTH]]', () => {
    expect(MAP_BOUNDS).toEqual([
      [0, 0],
      [MAP_HEIGHT, MAP_WIDTH],
    ]);
  });
});
