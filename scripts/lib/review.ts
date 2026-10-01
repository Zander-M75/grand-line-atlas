/**
 * The TODO-REVIEW list (PLAN.md §7, Phase 2): anything the wiki leaves unclear, or where
 * we made a judgment call, goes here for the owner instead of being guessed silently.
 * Each build script prints its list at the end and saves it to data/generated/review/,
 * so the open items stay visible in the repo until they're resolved.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GENERATED_DIR } from './paths';

export interface ReviewItem {
  subject: string;
  note: string;
}

export function createReviewList(name: string) {
  const items: ReviewItem[] = [];

  return {
    add(subject: string, note: string) {
      items.push({ subject, note });
    },

    async finish() {
      const dir = path.join(GENERATED_DIR, 'review');
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${name}.json`), JSON.stringify(items, null, 2) + '\n');

      console.log(`\nTODO-REVIEW (${name}): ${items.length} item${items.length === 1 ? '' : 's'}`);
      for (const { subject, note } of items) console.log(`  • ${subject}: ${note}`);
    },
  };
}
