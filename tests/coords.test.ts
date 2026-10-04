import { describe, expect, it } from 'vitest';
import { MAP_HEIGHT, MAP_WIDTH } from '@/config';
import { fromLatLng, keepOnMap, MAP_BOUNDS, toLatLng } from '@/map/coords';

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

describe('keepOnMap', () => {
  const view = { x: 1000, y: 600 }; // screen pixels

  it('leaves a center alone when the view already fits on the map', () => {
    expect(keepOnMap({ x: 2000, y: 1000 }, view, 0)).toEqual({ x: 2000, y: 1000 });
  });

  it('pulls the view back from the map edges', () => {
    // At zoom 0 the view is 1000 × 600 map pixels, so its center stays 500 / 300 from the edges.
    expect(keepOnMap({ x: 100, y: 50 }, view, 0)).toEqual({ x: 500, y: 300 });
    expect(keepOnMap({ x: MAP_WIDTH, y: MAP_HEIGHT }, view, 0)).toEqual({
      x: MAP_WIDTH - 500,
      y: MAP_HEIGHT - 300,
    });
  });

  it('accounts for zoom: one zoom level out doubles the map pixels in view', () => {
    expect(keepOnMap({ x: 0, y: 0 }, view, -1)).toEqual({ x: 1000, y: 600 });
  });

  it('runs past an edge by the overscan allowed there, and no further', () => {
    const overscan = { top: 0, right: 0, bottom: 0, left: 300 };
    expect(keepOnMap({ x: 100, y: 1000 }, view, 0, overscan)).toEqual({ x: 200, y: 1000 });
    expect(keepOnMap({ x: MAP_WIDTH, y: 1000 }, view, 0, overscan).x).toBe(MAP_WIDTH - 500);
  });

  it('centers the map along any axis the view is bigger than', () => {
    expect(keepOnMap({ x: 100, y: 100 }, { x: 8000, y: 600 }, 0)).toEqual({
      x: MAP_WIDTH / 2,
      y: 300,
    });
  });
});
