import { defineConfig, devices } from '@playwright/test';




export default defineConfig({
  testDir: './tests',

  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],


  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3000/api/v1/health',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
