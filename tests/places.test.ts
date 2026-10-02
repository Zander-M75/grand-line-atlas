import { describe, expect, it } from 'vitest';
import { wikiUrl } from '@/data/places';

describe('wikiUrl', () => {
  it('writes spaces as underscores and encodes the rest, the way MediaWiki does', () => {
    expect(wikiUrl('Water 7')).toBe('https://onepiece.fandom.com/wiki/Water_7');
    expect(wikiUrl('Goat Island (Non-Canon)')).toBe(
      'https://onepiece.fandom.com/wiki/Goat_Island_(Non-Canon)',
    );
    expect(wikiUrl('Episode Guide/East Blue Saga')).toBe(
      'https://onepiece.fandom.com/wiki/Episode_Guide/East_Blue_Saga',
    );
    expect(wikiUrl('Q&A?')).toBe('https://onepiece.fandom.com/wiki/Q%26A%3F');
  });
});
