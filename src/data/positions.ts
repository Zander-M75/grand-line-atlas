import type { Location } from '@/types';

export type PositionOverrides = Record<string, { x: number; y: number }>;

/**
 * Hand-placed positions (data/overrides/positions.json) win over the auto layout.
 * Overridden locations are marked `positionSource: 'manual'`; ids that match no
 * location are ignored.
 */
export function applyPositionOverrides(
  locations: Location[],
  overrides: PositionOverrides,
): Location[] {
  return locations.map((location) => {
    const override = overrides[location.id];
    return override ? { ...location, ...override, positionSource: 'manual' } : location;
  });
}
