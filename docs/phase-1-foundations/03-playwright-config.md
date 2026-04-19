# 03 — Understanding the Config File

[← Previous: Your First Test](./02-your-first-test.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Running Tests & CLI →](./04-running-tests-and-cli.md)

---

## What You Will Learn

- Every option in `playwright.config.js` and what it controls
- How to configure browsers, timeouts, retries, and artifacts
- How to set up multi-browser testing with projects
- How to use environment-specific configurations

---

## The Full Config — Annotated

Here is our project's config with every option explained:

```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({

  // ─── TEST DISCOVERY ─────────────────────────────────
  testDir: './src/tests',
  // Where Playwright looks for *.spec.js files.
  // Only files matching testDir will be picked up.

  // ─── PARALLELISM ────────────────────────────────────
  fullyParallel: true,
  // true  = Every test runs in its own worker (maximum speed)
  // false = Tests within a file run sequentially, files run in parallel

  workers: 5,
  // How many parallel browser instances to run.
  // In CI, you often set this lower to avoid resource exhaustion.
  // Use: workers: process.env.CI ? 2 : 5

  // ─── CI SAFETY ──────────────────────────────────────
  forbidOnly: !!process.env.CI,
  // Prevents accidentally committing test.only() to CI.
  // If someone leaves test.only() in code, CI will FAIL the entire run.

  // ─── RETRIES ────────────────────────────────────────
  retries: process.env.CI ? 2 : 0,
  // How many times to retry a failed test.
  // 0 locally (you want to see failures immediately)
  // 2 in CI (network flakes, timing issues)

  // ─── TIMEOUTS ───────────────────────────────────────
  timeout: 60000,
  // Maximum time (ms) for a single test to complete.
  // Includes all actions + assertions within the test.
  // If exceeded: test fails with "Test timeout of 60000ms exceeded"

  // ─── REPORTERS ──────────────────────────────────────
  reporter: [
    ['list'],
    // Prints pass/fail for each test in the terminal.

    ['allure-playwright', { outputFolder: 'allure-results' }],
    // Generates Allure report data files.

    ['./src/utils/CustomReporter.js'],
    // Our custom reporter: sends Teams notifications + logs Jira bugs.
  ],

  // ─── SHARED SETTINGS ───────────────────────────────
  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
    // When you call page.goto('/'), it prepends this URL.
    // page.goto('/inventory.html') → https://www.saucedemo.com/inventory.html

    trace: 'on-first-retry',
    // Records a trace file (like a video + DOM snapshots + network log).
    // 'on-first-retry' = only records when a test fails and retries.
    // Options: 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'

    screenshot: 'only-on-failure',
    // Captures a screenshot when a test fails.
    // Options: 'on' | 'off' | 'only-on-failure'

    video: 'on-first-retry',
    // Records a video of the browser during test execution.
    // Options: 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'
  },

  // ─── BROWSER PROJECTS ──────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## All Available Config Options — Reference Table

### Top-Level Options

| Option | Type | Default | Description |
|---|---|---|---|
| `testDir` | string | `'.'` | Directory to scan for test files |
| `testMatch` | string/RegExp | `**/*.spec.{js,ts}` | Pattern to match test files |
| `testIgnore` | string/RegExp | — | Pattern to exclude test files |
| `fullyParallel` | boolean | `false` | Run all tests in parallel |
| `workers` | number/string | `'50%'` | Number of parallel workers. Can be `'50%'` of CPU cores |
| `retries` | number | `0` | How many times to retry failed tests |
| `timeout` | number | `30000` | Max time per test (ms) |
| `expect.timeout` | number | `5000` | Max time for each `expect()` assertion to auto-retry |
| `forbidOnly` | boolean | `false` | Fail if `test.only()` is found (use in CI) |
| `globalSetup` | string | — | Path to a file that runs once before all tests |
| `globalTeardown` | string | — | Path to a file that runs once after all tests |
| `outputDir` | string | `'test-results'` | Where to store test artifacts (screenshots, videos) |

### `use` Options (Shared Browser Settings)

| Option | Type | Default | Description |
|---|---|---|---|
| `baseURL` | string | — | Prepended to relative URLs in `page.goto()` |
| `headless` | boolean | `true` | Run browser without visible window |
| `viewport` | object | `{width:1280,height:720}` | Browser window size |
| `ignoreHTTPSErrors` | boolean | `false` | Ignore HTTPS certificate errors |
| `trace` | string | `'off'` | When to record traces |
| `screenshot` | string | `'off'` | When to take screenshots |
| `video` | string | `'off'` | When to record video |
| `locale` | string | — | Browser locale (e.g., `'en-US'`, `'fr-FR'`) |
| `timezoneId` | string | — | Timezone (e.g., `'America/New_York'`) |
| `geolocation` | object | — | GPS coordinates (`{latitude, longitude}`) |
| `permissions` | string[] | — | Browser permissions (`['geolocation']`) |
| `colorScheme` | string | `'light'` | `'light'`, `'dark'`, or `'no-preference'` |
| `storageState` | string | — | Path to saved auth state (cookies, localStorage) |
| `actionTimeout` | number | `0` | Max time for each action (click, fill, etc.) |
| `navigationTimeout` | number | `0` | Max time for navigation (goto, reload, etc.) |

---

## Multi-Browser Testing with Projects

```javascript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'mobile-safari',
    use: { ...devices['iPhone 13'] },
  },
]
```

### Run specific projects

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox --project=webkit
```

### How `devices` works

`devices['Desktop Chrome']` expands to:

```javascript
{
  userAgent: 'Mozilla/5.0 ... Chrome/...',
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  defaultBrowserType: 'chromium'
}
```

`devices['iPhone 13']` expands to:

```javascript
{
  userAgent: 'Mozilla/5.0 ... iPhone ...',
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: 'webkit'
}
```

See all available devices:
```bash
npx playwright show-devices
```

---

## Environment-Specific Configs

### Using environment variables

```javascript
module.exports = defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
    headless: process.env.CI ? true : false,
  },
  workers: process.env.CI ? 2 : 5,
  retries: process.env.CI ? 2 : 0,
});
```

### Using project dependencies (setup → test flow)

```javascript
projects: [
  {
    name: 'setup',
    testMatch: /global.setup\.js/,
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'playwright/.auth/user.json',
    },
    dependencies: ['setup'],
  },
]
```

This runs `setup` project first, then `chromium` uses the saved auth state.

---

## Common Timeout Scenarios

```javascript
module.exports = defineConfig({
  timeout: 60000,           // 60s per test (overall)

  expect: {
    timeout: 10000,          // 10s for each expect() assertion
  },

  use: {
    actionTimeout: 15000,    // 15s for each action (click, fill)
    navigationTimeout: 30000, // 30s for page.goto()
  },
});
```

### Timeout hierarchy

```
Test timeout (60s)
  └── Contains all:
      ├── Navigation timeout (30s per goto)
      ├── Action timeout (15s per click/fill)
      └── Expect timeout (10s per assertion)
```

If a navigation takes 35s, it fails at the navigation timeout (30s), not the test timeout.

---

## Practice Exercises

1. Add Firefox and WebKit to the `projects` array and run tests on all three browsers
2. Change `headless` to `false` and watch the tests run
3. Set `retries: 2` and intentionally break a test — observe how retry works
4. Add `video: 'on'` and find the recorded video in `test-results/`
5. Add `devices['iPhone 13']` as a project and see how the viewport changes

---

[Next: Running Tests & CLI →](./04-running-tests-and-cli.md)
