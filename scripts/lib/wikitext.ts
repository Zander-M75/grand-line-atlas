/**
 * Small helpers over wtf_wikipedia for the shapes this wiki actually uses.
 */
import wtf from 'wtf_wikipedia';

/** A parsed template: positional params in `list`, named params as keys. Names are lower-case. */
export interface Template {
  template: string;
  list?: string[];
  [param: string]: unknown;
}

/** Every template named `name` in `wikitext`. Nested templates (like {{Ruby}}) are resolved. */
export function templatesNamed(wikitext: string, name: string): Template[] {
  return wtf(wikitext)
    .templates()
    .map((t) => t.json() as Template)
    .filter((t) => t.template === name.toLowerCase());
}

/** The nth parameter (1-based), whether it was written positionally or as `n=`. */
export function param(template: Template, n: number): string | undefined {
  const value = template.list?.[n - 1] ?? template[String(n)];
  return typeof value === 'string' ? value.trim() : undefined;
}

/** A named parameter as trimmed text, or undefined if it's missing or empty. */
export function named(template: Template, key: string): string | undefined {
  const value = template[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** `[[Target|Label]] (Cont.)` → { target: 'Target', label: 'Label' }. Plain text has no target. */
export function parseLinkText(text: string): { target: string | null; label: string } {
  const [, rawTarget, rawLabel] = text.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/) ?? [];
  if (!rawTarget) return { target: null, label: text.trim() };
  const target = rawTarget.trim();
  return { target, label: (rawLabel ?? target).trim() };
}

/** Every link target in `wikitext` (`[[Target]]`, `[[Target|label]]`, `[[Target#section]]`). */
export function linkTargets(wikitext: string): Set<string> {
  const targets = new Set<string>();
  for (const [, target = ''] of wikitext.matchAll(/\[\[([^\]|#]+)/g)) targets.add(target.trim());
  return targets;
}

export interface Section {
  level: number; // 2 for ==Heading==, 3 for ===Heading===
  heading: string; // raw heading text, links intact
  body: string;
}

/** Splits wikitext at `==` / `===` headings. Text before the first heading is dropped. */
export function sections(wikitext: string): Section[] {
  const result: Section[] = [];
  let current: Section | null = null;
  for (const line of wikitext.split('\n')) {
    const [, equals, heading] = line.match(/^(={2,3})\s*(.+?)\s*\1\s*$/) ?? [];
    if (equals && heading) {
      current = { level: equals.length, heading, body: '' };
      result.push(current);
    } else if (current) {
      current.body += line + '\n';
    }
  }
  return result;
}
