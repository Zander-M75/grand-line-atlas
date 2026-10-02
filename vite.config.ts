import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { devPositionsPlugin } from './scripts/lib/devPositionsPlugin.ts';
import { APP_TITLE } from './src/config.ts';

/** Fills `%APP_TITLE%` in index.html so the title is set in exactly one place (src/config.ts). */
function appTitle(): Plugin {
  return {
    name: 'app-title',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%APP_TITLE%', APP_TITLE),
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appTitle(), devPositionsPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // The weather's particle engine loads lazily, so the dev server would only find it at first
  // use and pre-bundle the engine and its plugins separately, as two copies of the engine.
  optimizeDeps: {
    include: ['@tsparticles/engine', '@tsparticles/slim'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
