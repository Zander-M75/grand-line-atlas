/**
 * A polite client for the One Piece Fandom wiki's MediaWiki API (PLAN.md §2.6).
 *
 * - Every response is cached under data/raw, so re-running a script makes no requests
 *   unless `refresh` is set.
 * - Requests go out at most once per second, identifying this project in the User-Agent.
 * - 429 and 5xx responses (and network errors) are retried with backoff, three attempts in all.
 * - Text only: nothing here asks for images or file info.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { RAW_DIR } from './paths';

const API_URL = 'https://onepiece.fandom.com/api.php';
const USER_AGENT =
  'GrandLineAtlas/0.1 (portfolio project; https://github.com/Zander-M75/grand-line-atlas)';
const MIN_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 3;

/** Counts for the end-of-run report: a fully cached run shows `network: 0`. */
export const requestStats = { network: 0, cached: 0 };

let refresh = false;
let lastRequestAt = 0;

/** `refresh: true` ignores the cache and re-fetches (`npm run data:fetch -- --refresh`). */
export function configureWikiClient(options: { refresh: boolean }) {
  refresh = options.refresh;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestJson(params: Record<string, string>): Promise<unknown> {
  const url = new URL(API_URL);
  for (const [key, value] of Object.entries({ ...params, format: 'json', formatversion: '2' })) {
    url.searchParams.set(key, value);
  }

  for (let attempt = 1; ; attempt++) {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    requestStats.network++;

    let retryDelay = 2000 * 2 ** (attempt - 1);
    let response: Response | null = null;
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });
    } catch (error) {
      // Network failure: retryable.
      if (attempt >= MAX_ATTEMPTS) throw error;
    }

    if (response?.ok) return response.json();
    if (response) {
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= MAX_ATTEMPTS) {
        throw new Error(`Wiki API returned ${response.status} for ${url}`);
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      if (retryAfter > 0) retryDelay = retryAfter * 1000;
    }
    console.warn(`  retrying in ${retryDelay / 1000}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
    await sleep(retryDelay);
  }
}

/**
 * Cache file name for a wiki title. Readable, but suffixed with a hash of the exact
 * title, because macOS file names are case-insensitive and titles aren't.
 */
function cacheName(title: string): string {
  const readable = title.replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 80);
  const hash = createHash('sha1').update(title).digest('hex').slice(0, 8);
  return `${readable}.${hash}.json`;
}

async function cached<T>(file: string, load: () => Promise<T>): Promise<T> {
  const fullPath = path.join(RAW_DIR, file);
  if (!refresh) {
    try {
      const value = JSON.parse(await readFile(fullPath, 'utf8')) as T;
      requestStats.cached++;
      return value;
    } catch {
      // Not cached yet: fall through and fetch.
    }
  }
  const value = await load();
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, JSON.stringify(value, null, 2) + '\n');
  return value;
}

interface ApiError {
  error?: { code: string; info: string };
}

function throwIfApiError(response: unknown, what: string) {
  const { error } = response as ApiError;
  if (error) throw new Error(`Wiki API error for ${what}: ${error.code} (${error.info})`);
}

// ---------------------------------------------------------------------------

export interface CategoryMember {
  title: string;
  ns: number; // 0 = article, 14 = subcategory
}

export interface CachedCategory {
  category: string;
  fetchedAt: string;
  members: CategoryMember[];
}

/** Every page and subcategory in `Category:<name>`, following `cmcontinue` pagination. */
export async function getCategoryMembers(name: string): Promise<CachedCategory> {
  return cached(path.join('categories', cacheName(name)), async () => {
    const members: CategoryMember[] = [];
    let cmcontinue: string | undefined;
    do {
      const response = (await requestJson({
        action: 'query',
        list: 'categorymembers',
        cmtitle: `Category:${name}`,
        cmlimit: '500',
        cmprop: 'title',
        ...(cmcontinue ? { cmcontinue } : {}),
      })) as {
        query?: { categorymembers: CategoryMember[] };
        continue?: { cmcontinue: string };
      };
      throwIfApiError(response, `Category:${name}`);
      members.push(...(response.query?.categorymembers ?? []));
      cmcontinue = response.continue?.cmcontinue;
    } while (cmcontinue);
    return { category: name, fetchedAt: new Date().toISOString(), members };
  });
}

export interface CachedPage {
  /** The title that was asked for. */
  requested: string;
  /** The page's real title after following redirects, or null if it doesn't exist. */
  title: string | null;
  fetchedAt: string;
  wikitext: string;
}

/** A page's wikitext, following redirects. Missing pages are cached too (title: null). */
export async function getPage(title: string): Promise<CachedPage> {
  return cached(path.join('pages', cacheName(title)), async () => {
    const response = (await requestJson({
      action: 'parse',
      page: title,
      prop: 'wikitext',
      redirects: '1',
    })) as ApiError & { parse?: { title: string; wikitext: string } };

    const fetchedAt = new Date().toISOString();
    if (response.error?.code === 'missingtitle') {
      return { requested: title, title: null, fetchedAt, wikitext: '' };
    }
    throwIfApiError(response, title);
    return {
      requested: title,
      title: response.parse?.title ?? title,
      fetchedAt,
      wikitext: response.parse?.wikitext ?? '',
    };
  });
}

export interface CachedPageCategories {
  /** Requested title → its categories (without the "Category:" prefix), after redirects. */
  categories: Record<string, string[]>;
}

/**
 * The categories of many pages at once (50 per request), keyed by the title asked for.
 * Titles that don't exist map to an empty list.
 */
export async function getCategoriesFor(titles: string[]): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};
  const sorted = [...new Set(titles)].sort();
  for (let i = 0; i < sorted.length; i += 50) {
    const batch = sorted.slice(i, i + 50);
    const cachedBatch = await cached(
      path.join('categories-of', cacheName(batch.join('|'))),
      async (): Promise<CachedPageCategories> => {
        const response = (await requestJson({
          action: 'query',
          prop: 'categories',
          titles: batch.join('|'),
          cllimit: 'max',
          redirects: '1',
        })) as {
          query: {
            normalized?: { from: string; to: string }[];
            redirects?: { from: string; to: string }[];
            pages: { title: string; categories?: { title: string }[] }[];
          };
        };
        throwIfApiError(response, 'categories batch');
        const { normalized = [], redirects = [], pages } = response.query;
        const resolve = (title: string) => {
          const normal = normalized.find((n) => n.from === title)?.to ?? title;
          return redirects.find((r) => r.from === normal)?.to ?? normal;
        };
        const categories: Record<string, string[]> = {};
        for (const title of batch) {
          const page = pages.find((p) => p.title === resolve(title));
          categories[title] = (page?.categories ?? []).map((c) =>
            c.title.replace(/^Category:/, ''),
          );
        }
        return { categories };
      },
    );
    Object.assign(result, cachedBatch.categories);
  }
  return result;
}

/** Any other read-only API query, cached by its parameters. For exploration and one-offs. */
export async function query(params: Record<string, string>): Promise<unknown> {
  const key = JSON.stringify(Object.entries(params).sort());
  return cached(path.join('queries', cacheName(key)), async () => {
    const response = await requestJson(params);
    throwIfApiError(response, key);
    return response;
  });
}
