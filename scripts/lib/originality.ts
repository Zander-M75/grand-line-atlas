/**
 * Finds wording a summary shares with wiki text, to keep summaries in our own words
 * (PLAN.md §2.4). Text is compared as lower-case words, reading wiki links as the text they
 * show, so a copied phrase is caught even where the wiki links part of it.
 */

/** Shared runs this long or longer are reported. Shorter ones are ordinary phrasing. */
export const MIN_SHARED_WORDS = 6;

/** Wikitext (or plain text) as the words a reader sees, lower-cased. */
export function words(text: string): string[] {
  return text
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1') // [[Target|label]] → label
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9']+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

export interface Source {
  title: string;
  text: string;
}

/** Every run of MIN_SHARED_WORDS words in the sources, mapped to the first source it's in. */
export type SourceIndex = Map<string, string>;

export function indexSources(sources: Source[]): SourceIndex {
  const index: SourceIndex = new Map();
  for (const { title, text } of sources) {
    const sourceWords = words(text);
    for (let i = 0; i + MIN_SHARED_WORDS <= sourceWords.length; i++) {
      const run = sourceWords.slice(i, i + MIN_SHARED_WORDS).join(' ');
      if (!index.has(run)) index.set(run, title);
    }
  }
  return index;
}

export interface SharedRun {
  phrase: string;
  /** A source the phrase (or its first MIN_SHARED_WORDS words) appears in. */
  source: string;
}

/** The longest run of words `text` shares with the indexed sources, or null if none is long enough. */
export function longestSharedRun(text: string, index: SourceIndex): SharedRun | null {
  const textWords = words(text);
  const sourceAt = (i: number) =>
    i + MIN_SHARED_WORDS <= textWords.length
      ? index.get(textWords.slice(i, i + MIN_SHARED_WORDS).join(' '))
      : undefined;

  let best: SharedRun | null = null;
  let bestLength = 0;
  for (let start = 0; start < textWords.length; start++) {
    const source = sourceAt(start);
    if (source === undefined) continue;
    // Overlapping matches chain into one longer run.
    let end = start;
    while (sourceAt(end + 1) !== undefined) end++;
    const length = end - start + MIN_SHARED_WORDS;
    if (length > bestLength) {
      bestLength = length;
      best = { phrase: textWords.slice(start, start + length).join(' '), source };
    }
    start = end;
  }
  return best;
}
