import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially for booking tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // No retries locally to speed up
  workers: 1,
  timeout: 90000, // 90 seconds per test
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5180',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5180',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
