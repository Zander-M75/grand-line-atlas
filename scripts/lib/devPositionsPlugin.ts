/**
 * Dev server only: lets the island positioner save straight to data/overrides/positions.json
 * (POST /__dev/positions), so placing islands is drag, Save, commit.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';
import { OVERRIDES_DIR } from './paths.ts';

const POSITIONS_FILE = path.join(OVERRIDES_DIR, 'positions.json');

export function devPositionsPlugin(): Plugin {
  return {
    name: 'dev-positions',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/positions', (req, res) => {
        // Only the app's own page may write; refuse anything another site sends.
        const site = req.headers['sec-fetch-site'];
        if (req.method !== 'POST' || (site && site !== 'same-origin')) {
          res.statusCode = 403;
          res.end('Only the app itself can save positions');
          return;
        }
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk: string) => (body += chunk));
        req.on('end', () => {
          void (async () => {
            try {
              const positions = parsePositions(JSON.parse(body));
              await writeFile(POSITIONS_FILE, JSON.stringify(positions, null, 2) + '\n');
              res.statusCode = 204;
              res.end();
            } catch (error) {
              res.statusCode = 400;
              res.end(error instanceof Error ? error.message : String(error));
            }
          })();
        });
      });
    },
  };
}

/** Checks a positions object (id → {x, y}), rounding to whole pixels and sorting by id. */
export function parsePositions(value: unknown): Record<string, { x: number; y: number }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected an object of id → { x, y }');
  }
  const result: Record<string, { x: number; y: number }> = {};
  for (const [id, point] of Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) {
    const { x, y } = (point ?? {}) as { x?: unknown; y?: unknown };
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`"${id}" isn't a location id`);
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x + y)) {
      throw new Error(`${id} needs numeric x and y`);
    }
    result[id] = { x: Math.round(x), y: Math.round(y) };
  }
  return result;
}
