import { describe, expect, it } from 'vitest';
import { indexSources, longestSharedRun, words } from '../scripts/lib/originality';

describe('words', () => {
  it('reads links as the text they show and ignores case and punctuation', () => {
    expect(words("The [[Straw Hat Pirates|crew]] reach [[Water 7]]'s docks.")).toEqual([
      'the',
      'crew',
      'reach',
      'water',
      "7's",
      'docks',
    ]);
  });

  it('treats curly and straight apostrophes alike', () => {
    expect(words('Luffy’s hat')).toEqual(words("Luffy's hat"));
  });
});

describe('longestSharedRun', () => {
  const index = indexSources([
    {
      title: 'Jaya Arc',
      text: 'Jaya is a [[Lawless|lawless]] island in [[Paradise]] popular with pirates.',
    },
  ]);

  it('finds wording copied from a source, even across a wiki link', () => {
    expect(
      longestSharedRun('Next stop: a lawless island in Paradise popular with pirates!', index),
    ).toEqual({
      phrase: 'a lawless island in paradise popular with pirates',
      source: 'Jaya Arc',
    });
  });

  it('ignores runs shorter than six words', () => {
    expect(
      longestSharedRun('A lawless island in Paradise, crowded with rowdy pirates.', index),
    ).toBeNull();
  });
});
