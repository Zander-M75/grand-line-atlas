/**
 * Checks the production build against the JavaScript budget (PLAN.md §7, Phase 8): what a
 * first visit downloads before the app can start, gzipped, must stay under BUDGET_KB. That's
 * the entry script and every module it preloads, as listed in dist/index.html. Chunks loaded
 * later on demand (the weather, the dev tools) don't count. Sizes are in kB of 1,000 bytes,
 * as Vite reports them.
 *
 *   npm run build && npm run size
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { ROOT } from './lib/paths';

const BUDGET_KB = 250;
const DIST = path.join(ROOT, 'dist');

const html = await readFile(path.join(DIST, 'index.html'), 'utf8');
const files = [
  ...html.matchAll(/<script type="module"[^>]* src="([^"]+)"/g),
  ...html.matchAll(/<link rel="modulepreload"[^>]* href="([^"]+)"/g),
].map(([, src]) => src ?? '');
if (files.length === 0) throw new Error('No scripts found in dist/index.html. Build first.');

let total = 0;
for (const file of files) {
  const size = gzipSync(await readFile(path.join(DIST, file))).length / 1000;
  total += size;
  console.log(`  ${size.toFixed(1).padStart(6)} kB  ${file}`);
}
console.log(`  ${total.toFixed(1).padStart(6)} kB  initial JS, gzipped (budget ${BUDGET_KB} kB)`);

if (total > BUDGET_KB) {
  console.error(`Over budget by ${(total - BUDGET_KB).toFixed(1)} kB.`);
  process.exit(1);
}
