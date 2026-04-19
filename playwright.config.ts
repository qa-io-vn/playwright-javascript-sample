import { defineConfig, devices } from '@playwright/test';
import { Env } from './src/core/config/Environment';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Env.ci,
  retries: Env.ci ? 2 : 0,
  workers: Env.ci ? 4 : 5,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  use: {
    baseURL: Env.baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
