import { describe, expect, it } from 'vitest';
import { splinePath, splineSegments, type Point } from '@/utils/spline';
import { buildTrack, headingAt, partialPath, pointAt } from '@/utils/track';

const p = (x: number, y: number): Point => ({ x, y });
const trackThrough = (points: Point[]) => {
  const [start = p(0, 0)] = points;
  return buildTrack(start, splineSegments(points));
};

describe('track', () => {
  it('measures a straight line exactly', () => {
    const track = trackThrough([p(0, 0), p(300, 400)]);
    expect(track.length).toBeCloseTo(500, 3);
  });

  it('moves at a steady speed, not a steady t', () => {
    const track = trackThrough([p(0, 0), p(300, 0)]);
    // A Catmull-Rom line between two points eases in and out in t, but not in distance.
    expect(pointAt(track, 75).x).toBeCloseTo(75, 1);
    expect(pointAt(track, 150).x).toBeCloseTo(150, 1);
  });

  it('starts and ends on the curve’s endpoints, clamping past them', () => {
    const points = [p(0, 0), p(100, 60), p(220, 20)];
    const track = trackThrough(points);
    expect(pointAt(track, -10)).toEqual(p(0, 0));
    expect(pointAt(track, track.length + 10).x).toBeCloseTo(220);
    expect(pointAt(track, track.length + 10).y).toBeCloseTo(20);
  });

  it('passes through the middle point about where the distances say', () => {
    const track = trackThrough([p(0, 0), p(100, 0), p(100, 100)]);
    const middle = pointAt(track, track.length / 2);
    expect(Math.hypot(middle.x - 100, middle.y)).toBeLessThan(15);
  });

  it('heads the way the curve travels', () => {
    const track = trackThrough([p(0, 0), p(0, 200)]);
    const heading = headingAt(track, 100);
    expect(heading.x).toBeCloseTo(0);
    expect(heading.y).toBeCloseTo(1);
  });

  it('draws the whole curve at full length, and nothing at zero', () => {
    const points = [p(0, 0), p(120, 80), p(260, 30), p(400, 90)];
    const track = trackThrough(points);
    expect(partialPath(track, track.length)).toBe(splinePath(points));
    expect(partialPath(track, 0)).toBe('');
  });

  it('cuts the curve where the distance falls', () => {
    const track = trackThrough([p(0, 0), p(200, 0)]);
    const d = partialPath(track, 50);
    const end = d.match(/(-?[\d.]+),(-?[\d.]+)$/);
    expect(Number(end?.[1])).toBeCloseTo(50, 0);
  });
});
