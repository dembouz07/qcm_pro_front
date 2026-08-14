import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4177',
    channel: 'chrome',
    headless: true,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
});
