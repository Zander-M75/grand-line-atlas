import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { devPositionsPlugin } from './scripts/lib/devPositionsPlugin.ts';
import { APP_DESCRIPTION, APP_TITLE, LINKS } from './src/config.ts';

/**
 * Fills `%APP_TITLE%`, `%APP_DESCRIPTION%`, and `%SITE_URL%` in index.html, so the title,
 * description, and address are each set in exactly one place (src/config.ts).
 */
function siteMeta(): Plugin {
  const values: Record<string, string> = {
    APP_TITLE,
    APP_DESCRIPTION,
    SITE_URL: LINKS.site,
  };
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replaceAll(/%(APP_TITLE|APP_DESCRIPTION|SITE_URL)%/g, (_, key: string) =>
          escapeHtml(values[key] ?? ''),
        ),
    },
  };
}

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), siteMeta(), devPositionsPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // The source is public anyway; maps let anyone read it in devtools. Browsers only fetch
  // them when devtools are open, so they cost viewers nothing.
  build: { sourcemap: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
