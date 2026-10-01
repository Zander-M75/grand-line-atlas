/**
 * The app's data: generated JSON from the data pipeline (see README, "The data"), with
 * hand-placed island positions merged over the auto layout.
 */
import type { Arc, Location } from '@/types';
import arcsJson from '../../data/generated/arcs.json';
import locationsJson from '../../data/generated/locations.json';
import positionsJson from '../../data/overrides/positions.json';
import { applyPositionOverrides } from './positions';

export const arcs = arcsJson as Arc[];

export const locations: Location[] = applyPositionOverrides(
  locationsJson as Location[],
  positionsJson,
);
