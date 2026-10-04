import { defineConfig, devices } from '@playwright/test';

/**
 * The browser smoke tests in e2e/, run against the production build that `vite preview`
 * serves. `npm run test:e2e` builds first. Each test runs at a desktop size and on a phone.
 */
export default defineConfig({
  testDir: 'e2e',
  // One at a time: headless Chromium draws the animated map in software, so pages running in
  // parallel only compete for the CPU (two workers were slower than one; four timed out).
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // Only on a retry: a trace snapshots every DOM change, and the ocean's swell changes its
    // filter many times a second, so tracing every test bogs the browsers down until they fail.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
