import { describe, expect, it } from 'vitest';
import {
  linkTargets,
  param,
  parseLinkText,
  sections,
  templatesNamed,
} from '../scripts/lib/wikitext';

describe('parseLinkText', () => {
  it('separates a link target from its label and drops trailing text', () => {
    expect(parseLinkText("[[Buggy's Crew: After the Battle!|Buggy Side Story Arc]]")).toEqual({
      target: "Buggy's Crew: After the Battle!",
      label: 'Buggy Side Story Arc',
    });
    expect(parseLinkText('[[Impel Down Arc]] (Cont.)')).toEqual({
      target: 'Impel Down Arc',
      label: 'Impel Down Arc',
    });
  });

  it('returns plain text as a label with no target', () => {
    expect(parseLinkText('Elbaph Arc')).toEqual({ target: null, label: 'Elbaph Arc' });
  });
});

describe('templatesNamed', () => {
  it('reads positional params even when a title contains a nested template', () => {
    const [row] = templatesNamed(
      '{{Episode|1106|Seek Dr. Vegapunk!|異常発生！{{Ruby|Dr.|ドクター}}|Ijō Hassei!|May 26|2024|Summary.}}',
      'Episode',
    );
    expect(row && [param(row, 1), param(row, 5), param(row, 6)]).toEqual([
      '1106',
      'May 26',
      '2024',
    ]);
  });
});

describe('sections', () => {
  it('splits at level-2 and level-3 headings, keeping each body', () => {
    const result = sections(
      'intro\n==[[East Blue Saga]]==\n===[[Romance Dawn Arc]]===\nrow 1\nrow 2\n',
    );
    expect(result.map((s) => [s.level, s.heading])).toEqual([
      [2, '[[East Blue Saga]]'],
      [3, '[[Romance Dawn Arc]]'],
    ]);
    expect(result[1]?.body).toBe('row 1\nrow 2\n\n');
  });
});

describe('linkTargets', () => {
  it('collects targets, ignoring labels and section anchors', () => {
    const links = linkTargets(
      '[[Water 7]] and [[Enies Lobby|the island]] near [[Florian Triangle#Thriller Bark]]',
    );
    expect([...links]).toEqual(['Water 7', 'Enies Lobby', 'Florian Triangle']);
  });
});
