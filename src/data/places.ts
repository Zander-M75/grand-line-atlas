import { LINKS } from '@/config';
import type { Region } from '@/types';

/** How each region reads in the UI. "Other" isn't worth saying, so it's empty. */
export const REGION_NAMES: Record<Region, string> = {
  'east-blue': 'East Blue',
  'west-blue': 'West Blue',
  'north-blue': 'North Blue',
  'south-blue': 'South Blue',
  paradise: 'Paradise, Grand Line',
  'new-world': 'New World, Grand Line',
  'calm-belt': 'Calm Belt',
  'red-line': 'Red Line',
  sky: 'Sky island',
  undersea: 'Undersea',
  other: '',
};

/**
 * A page on the One Piece Fandom wiki. MediaWiki writes spaces as underscores and leaves
 * slashes and colons readable; everything else is percent-encoded.
 */
export function wikiUrl(title: string): string {
  const path = encodeURIComponent(title.replaceAll(' ', '_'))
    .replaceAll('%2F', '/')
    .replaceAll('%3A', ':');
  return `${LINKS.wiki}wiki/${path}`;
}
