import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');

/** Cached wiki API responses (gitignored). */
export const RAW_DIR = path.join(ROOT, 'data/raw');
export const GENERATED_DIR = path.join(ROOT, 'data/generated');
export const OVERRIDES_DIR = path.join(ROOT, 'data/overrides');
