import { describe, expect, it } from 'vitest';
import { catmullRomControls, direction, splinePath, type Point } from '@/utils/spline';

const p = (x: number, y: number): Point => ({ x, y });

/** The points a path's commands end at, in order. */
function endpoints(d: string): Point[] {
  return [...d.matchAll(/(?:M|C[^ ]+ [^ ]+ )(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) =>
    p(Number(x), Number(y)),
  );
}

describe('splinePath', () => {
  it('passes through every point it is given', () => {
    const points = [p(0, 0), p(100, 40), p(180, 10), p(260, 90)];
    expect(endpoints(splinePath(points))).toEqual(points);
  });

  it('draws two points as a straight line', () => {
    const [c1, c2] = catmullRomControls(undefined, p(0, 0), p(90, 0), undefined);
    expect(c1.y).toBeCloseTo(0);
    expect(c2.y).toBeCloseTo(0);
    expect(c1.x).toBeGreaterThan(0);
    expect(c2.x).toBeLessThan(90);
  });

  it('joins neighboring pieces without a kink', () => {
    const [a, b, c, d] = [p(0, 0), p(100, 50), p(200, 0), p(300, 60)];
    const [, arriving] = catmullRomControls(a, b, c, d);
    const [leaving] = catmullRomControls(b, c, d, undefined);
    // The tangent into c and the tangent out of c point the same way.
    const into = direction(arriving, c);
    const out = direction(c, leaving);
    expect(into?.x).toBeCloseTo(out?.x ?? NaN);
    expect(into?.y).toBeCloseTo(out?.y ?? NaN);
  });

  it('stays finite when a point repeats', () => {
    const d = splinePath([p(0, 0), p(50, 50), p(50, 50), p(100, 0)]);
    expect(d).not.toMatch(/NaN|Infinity/);
  });
});
