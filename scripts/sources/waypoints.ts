/**
 * Hand-drawn bends in the route, as curated input to build-route. Most legs need none: the
 * route is already a smooth curve through the islands. A bend is for a leg whose straight
 * path would cross something a ship can't (the Red Line, or a Calm Belt it would avoid).
 *
 * Each bend names a connection in sailing order and the points, in map pixels, that the
 * route curves through on the way. Points are absolute, so moving an island a long way
 * (with the dev positioner) may mean revisiting the bends on its legs; build-route warns
 * about bends that no longer match any leg.
 */

export interface Bend {
  from: string;
  to: string;
  waypoints: [number, number][];
  why: string;
}

/**
 * East Blue ships reach the Grand Line by riding a current up Reverse Mountain, not by
 * crossing the Calm Belt, so the route runs to the Red Line's foot and follows it down.
 */
const OVER_REVERSE_MOUNTAIN: [number, number][] = [
  [150, 745],
  [82, 870],
];

export const BENDS: Bend[] = [
  {
    from: 'warship-island',
    to: 'reverse-mountain',
    waypoints: OVER_REVERSE_MOUNTAIN,
    why: 'Climbs Reverse Mountain instead of crossing the Calm Belt.',
  },
  {
    // The same climb when anime-only arcs are hidden and Warship Island drops out.
    from: 'loguetown',
    to: 'reverse-mountain',
    waypoints: OVER_REVERSE_MOUNTAIN,
    why: 'Climbs Reverse Mountain instead of crossing the Calm Belt.',
  },
];
