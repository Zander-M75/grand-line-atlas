/**
 * Makes the site's images from the production build, in headless Chromium:
 *
 *   public/favicon.ico, public/apple-touch-icon.png   the favicon (public/favicon.svg) for
 *                                                     browsers and home screens that want bitmaps
 *   public/og-image.jpg                               the link preview (Open Graph, Twitter card)
 *   docs/voyage.gif                                   the README's animation of the timeline
 *
 * The preview and the GIF are spoiler-safe: the spoiler limit is the last episode of the
 * Reverse Mountain Arc, so they show only the start of the voyage (East Blue to the Grand
 * Line), exactly what the app shows a viewer at that episode. A link preview never gives the
 * route away.
 *
 * The GIF runs on virtual time. Playwright's clock drives the app's own timing (GSAP, Leaflet,
 * and Framer Motion run on requestAnimationFrame and performance.now), and every CSS and Web
 * Animations animation is stepped to match, so frames are exactly FRAME_MS apart however slowly
 * the browser draws them.
 *
 *   npm run capture             builds first, then makes everything
 *   npm run capture -- gif      or just one of: icons, preview, gif
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser, type BrowserContextOptions, type Page } from '@playwright/test';
import gifenc, { type Palette } from 'gifenc';
import { PNG } from 'pngjs';
import { preview } from 'vite';
import { STORAGE_KEYS } from '../src/store/storageKeys';
import type { Arc } from '../src/types';
import { GENERATED_DIR, ROOT } from './lib/paths';

/** The captures stop at the end of this arc: the crew's arrival at the Grand Line. */
const LAST_ARC = 'reverse-mountain';
/** The arc the link preview shows (the whole of East Blue sailed). */
const PREVIEW_ARC = 'loguetown';

/**
 * Laid out like a 1600×840 window (the panels take less of it than at 1200×630), saved at
 * 2400×1260: the 1.91:1 shape link previews use, sharp on high-density screens.
 */
const PREVIEW = { width: 1600, height: 840, scale: 1.5, quality: 85 };
/** Laid out like a 1280×720 window, drawn at 960×540 to keep the file small. */
const GIF = { width: 1280, height: 720, scale: 0.75 };
/**
 * One GIF frame: 12.5 a second (GIF stores hundredths of a second, so a multiple of 10). Most
 * of the file is the camera's pans, which redraw every pixel, so this sets the size.
 */
const FRAME_MS = 80;
/** The intro and the flight down to the first arc; then each arc; then the last before it loops. */
const INTRO_MS = 5600;
const ARC_MS = 3000;
const END_MS = 2500;

// gifenc's Node entry is CommonJS, which Node exposes only as a default export.
const { applyPalette, GIFEncoder, quantize } = gifenc;

const OUTPUT = {
  favicon: path.join(ROOT, 'public/favicon.ico'),
  touchIcon: path.join(ROOT, 'public/apple-touch-icon.png'),
  preview: path.join(ROOT, 'public/og-image.jpg'),
  gif: path.join(ROOT, 'docs/voyage.gif'),
};

const arcs = JSON.parse(await readFile(path.join(GENERATED_DIR, 'arcs.json'), 'utf8')) as Arc[];
const lastArc = arcs.find((arc) => arc.id === LAST_ARC);
if (!lastArc) throw new Error(`No arc "${LAST_ARC}" in arcs.json`);
const spoilerLimit = lastArc.episodes[1];

// ---------------------------------------------------------------------------
// The favicon, as bitmaps

async function icons(browser: Browser) {
  const svg = await readFile(path.join(ROOT, 'public/favicon.svg'), 'utf8');
  const page = await browser.newPage();
  const render = async (size: number) => {
    await page.setContent(
      `<img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="${size}" height="${size}">`,
    );
    return page.locator('img').screenshot({ omitBackground: true });
  };
  await writeFile(OUTPUT.favicon, ico([await render(16), await render(32), await render(48)]));
  await writeFile(OUTPUT.touchIcon, await render(180));
  await page.close();
  console.log(`Wrote ${rel(OUTPUT.favicon)} and ${rel(OUTPUT.touchIcon)}`);
}

/** An .ico holding PNG images, which every browser since IE 9 reads. */
function ico(pngs: Buffer[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length + 16 * pngs.length;
  const entries = pngs.map((png) => {
    const size = png.readUInt32BE(16); // the PNG's width, from its header
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

// ---------------------------------------------------------------------------
// The link preview

async function previewImage(browser: Browser, url: string) {
  const page = await openViewer(browser, url, {
    viewport: { width: PREVIEW.width, height: PREVIEW.height },
    deviceScaleFactor: PREVIEW.scale,
    // Everything lands at once: no voyage to wait for, and nothing caught mid-move.
    reducedMotion: 'reduce',
  });
  await page.goto(`${url}?arc=${PREVIEW_ARC}`);
  await settle(page);
  await page.screenshot({ path: OUTPUT.preview, type: 'jpeg', quality: PREVIEW.quality });
  await page.context().close();
  console.log(`Wrote ${rel(OUTPUT.preview)}`);
}

// ---------------------------------------------------------------------------
// The GIF: the intro, then the timeline sailing from Romance Dawn to Reverse Mountain

async function gif(browser: Browser, url: string) {
  const page = await openViewer(
    browser,
    url,
    { viewport: { width: GIF.width, height: GIF.height }, deviceScaleFactor: GIF.scale },
    { intro: true },
  );
  // Time stands still until each frame moves it on.
  const start = Date.parse('2026-01-01T00:00:00Z');
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start + 1000);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // The ocean's swell holds still: at a GIF's frame rate its slow drift barely shows, and it
  // redraws wave marks all over the sea every frame, which more than doubled the file.
  await page.evaluate(() => {
    const swell = document.querySelector('#ocean-swell feTurbulence');
    if (!swell) throw new Error('No ocean swell to hold still (see src/map/OceanEffects.tsx)');
    swell.setAttribute = () => {};
  });

  const writer = new GifWriter(GIF.width * GIF.scale, GIF.height * GIF.scale);
  const record = async (ms: number) => {
    for (let elapsed = 0; elapsed < ms; elapsed += FRAME_MS) {
      writer.add(await frame(page), FRAME_MS);
      await advance(page, FRAME_MS);
    }
  };

  await record(INTRO_MS);
  // One step out, as a viewer might, so the whole of East Blue stays in view as it's sailed.
  await page.locator('.leaflet-control-zoom-out').evaluate((button: HTMLElement) => button.click());
  await record(800);
  const steps = arcs.findIndex((arc) => arc.id === LAST_ARC);
  for (let step = 0; step < steps; step++) {
    await page.keyboard.press('ArrowRight'); // steps the timeline from anywhere on the page
    await record(step === steps - 1 ? ARC_MS + END_MS : ARC_MS);
  }
  if (!page.url().endsWith(`?arc=${LAST_ARC}`)) {
    throw new Error(`The GIF ended on ${page.url()}, not ${LAST_ARC}`);
  }

  const bytes = writer.finish();
  await mkdir(path.dirname(OUTPUT.gif), { recursive: true });
  await writeFile(OUTPUT.gif, bytes);
  await page.context().close();
  console.log(`Wrote ${rel(OUTPUT.gif)}: ${writer.frames} frames, ${mb(bytes.length)}`);
}

/** Moves the page's clock on, and every CSS and Web Animations animation with it. */
async function advance(page: Page, ms: number) {
  await page.clock.runFor(ms);
  await page.evaluate((ms) => {
    for (const animation of document.getAnimations()) {
      // Take over any animation that's running on the browser's own clock.
      if (animation.playState === 'running') animation.pause();
      if (animation.playState !== 'paused') continue;
      const time = Number(animation.currentTime ?? 0) + ms;
      const end = Number(animation.effect?.getComputedTiming().endTime ?? Infinity);
      // Finishing (rather than parking at the end) fires its events, which Framer Motion
      // waits on to remove a card that has faded out.
      if (time >= end) animation.finish();
      else animation.currentTime = time;
    }
  }, ms);
}

/** The page as it looks now, as RGBA pixels. */
async function frame(page: Page): Promise<Uint8Array> {
  return PNG.sync.read(await page.screenshot()).data;
}

/**
 * Writes the GIF a frame at a time, keeping it small: each frame after the first draws only
 * the pixels that changed since the frame before (the rest are transparent, so what's already
 * there shows through), with its own palette for just those pixels. A frame with no changes
 * only lengthens the one before it.
 *
 * Changes are measured against the real previous frame, not against what the GIF shows (its
 * colors are approximate), and any change counts: a tolerance there let small differences
 * pile up into ghosts of earlier frames.
 */
class GifWriter {
  frames = 0;
  private readonly encoder = GIFEncoder();
  private readonly width: number;
  private readonly height: number;
  private previous: Uint8Array | null = null;
  private pending: { index: Uint8Array; palette: Palette; delay: number; first: boolean } | null =
    null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  add(rgba: Uint8Array, delay: number) {
    const pixels = this.width * this.height;
    if (rgba.length !== pixels * 4) throw new Error('Frame size changed mid-GIF');
    const { previous } = this;
    this.previous = rgba;
    if (!previous) {
      const palette = quantize(rgba, 256);
      this.pending = { index: applyPalette(rgba, palette), palette, delay, first: true };
      return;
    }

    const changed: number[] = [];
    for (let p = 0; p < pixels; p++) {
      const i = p * 4;
      if (
        rgba[i] !== previous[i] ||
        rgba[i + 1] !== previous[i + 1] ||
        rgba[i + 2] !== previous[i + 2]
      ) {
        changed.push(p);
      }
    }
    if (changed.length === 0) {
      if (this.pending) this.pending.delay += delay;
      return;
    }

    const colors = new Uint8Array(changed.length * 4);
    changed.forEach((p, k) => colors.set(rgba.subarray(p * 4, p * 4 + 4), k * 4));
    const palette = quantize(colors, 255);
    const colorIndex = applyPalette(colors, palette);
    const index = new Uint8Array(pixels).fill(palette.length); // transparent: the slot after
    changed.forEach((p, k) => (index[p] = colorIndex[k] ?? 0));
    this.flush();
    this.pending = { index, palette: [...palette, [0, 0, 0]], delay, first: false };
  }

  finish(): Uint8Array {
    this.flush();
    this.encoder.finish();
    return this.encoder.bytes();
  }

  private flush() {
    if (!this.pending) return;
    const { index, palette, delay, first } = this.pending;
    this.encoder.writeFrame(
      index,
      this.width,
      this.height,
      first
        ? { palette, delay, repeat: 0 }
        : { palette, delay, transparent: true, transparentIndex: palette.length - 1, dispose: 1 },
    );
    this.frames++;
    this.pending = null;
  }
}

// ---------------------------------------------------------------------------
// Shared

/**
 * A browser tab for a returning viewer whose spoiler limit is the end of LAST_ARC, so the app
 * opens without its spoiler prompt and shows nothing past that. The intro plays only if asked.
 */
async function openViewer(
  browser: Browser,
  url: string,
  options: BrowserContextOptions,
  { intro = false } = {},
): Promise<Page> {
  const context = await browser.newContext({ ...options, baseURL: url });
  await context.addInitScript(
    ({ keys, limit, intro }) => {
      localStorage.setItem(keys.spoilerLimit, JSON.stringify({ episode: limit }));
      if (!intro) localStorage.setItem(keys.introSeen, 'true');
    },
    { keys: STORAGE_KEYS, limit: spoilerLimit, intro },
  );
  return context.newPage();
}

/** Waits for the page to finish loading and drawing: fonts, the map, and the camera. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('region', { name: 'Voyage map' }).waitFor();
  await page.waitForTimeout(500);
}

const rel = (file: string) => path.relative(ROOT, file);
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// ---------------------------------------------------------------------------

const JOBS = { icons, preview: previewImage, gif } as const;
const only = process.argv[2];
if (only && !(only in JOBS)) {
  console.error(`No capture called "${only}". Try one of: ${Object.keys(JOBS).join(', ')}.`);
  process.exit(1);
}

const server = await preview({ logLevel: 'warn', preview: { port: 4174, strictPort: true } });
const url = server.resolvedUrls?.local[0] ?? 'http://localhost:4174/';
const browser = await chromium.launch();
try {
  for (const [name, job] of Object.entries(JOBS)) {
    if (!only || only === name) await job(browser, url);
  }
} finally {
  await browser.close();
  await server.close();
}
