# 25 — Global Setup & Teardown

[← Previous: Retries](./24-retries-and-flaky-tests.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: CI/CD →](../phase-6-cicd-and-reporting/26-cicd-github-actions.md)

---

## What You Will Learn

- How to run one-time setup before all tests start
- How to run one-time cleanup after all tests finish
- Two approaches: config-based and project-based
- Real-world use cases

---

## Approach 1: Config-Based `globalSetup` / `globalTeardown`

### Setup file

```javascript
// src/global-setup.js
const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🔧 Global Setup: Starting...');

  // Example: Create authenticated state for all tests
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(config.projects[0].use.baseURL || 'https://www.saucedemo.com');
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill(process.env.PASSWORD);
  await page.locator('[data-test="login-button"]').click();
  await page.waitForURL('**/inventory.html');

  // Save auth state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  await browser.close();

  console.log('🔧 Global Setup: Complete');
}

module.exports = globalSetup;
```

### Teardown file

```javascript
// src/global-teardown.js
async function globalTeardown(config) {
  console.log('🧹 Global Teardown: Cleaning up...');

  // Example: Clean up test data, close connections, etc.
  const fs = require('fs');
  if (fs.existsSync('playwright/.auth/user.json')) {
    fs.unlinkSync('playwright/.auth/user.json');
  }

  console.log('🧹 Global Teardown: Complete');
}

module.exports = globalTeardown;
```

### Register in config

```javascript
// playwright.config.js
module.exports = defineConfig({
  globalSetup: './src/global-setup.js',
  globalTeardown: './src/global-teardown.js',

  use: {
    storageState: 'playwright/.auth/user.json',
  },
});
```

---

## Approach 2: Project Dependencies (Recommended)

More flexible and visible in reports:

```javascript
// playwright.config.js
module.exports = defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.js/,
      dependencies: ['chromium'],
    },
  ],
});
```

```javascript
// src/tests/auth.setup.js
const { test: setup } = require('@playwright/test');

setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill(process.env.PASSWORD);
  await page.locator('[data-test="login-button"]').click();
  await page.waitForURL('**/inventory.html');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### Execution order

```
1. setup project     → auth.setup.js runs first
2. chromium project  → all tests run (with saved auth state)
3. cleanup project   → teardown.js runs last
```

---

## Comparison

| Feature | `globalSetup` | Project Dependencies |
|---|---|---|
| Visible in reports | No | Yes |
| Can use Playwright fixtures | No (raw browser API) | Yes (`{ page }`, `{ request }`) |
| Can use `expect()` | No | Yes |
| Retries on failure | No | Yes |
| Trace/screenshot on failure | No | Yes |
| Complexity | Simple | More setup |

**Recommendation:** Use project dependencies for anything that might fail and needs debugging.

---

## Real-World Use Cases

| Use Case | Implementation |
|---|---|
| Authenticate once for all tests | Save `storageState` in setup |
| Seed database before tests | Call API in setup to create test data |
| Start a local server | Launch server in setup, kill in teardown |
| Clear test data after all tests | Delete via API in teardown |
| Warm up caches | Navigate key pages in setup |
| Check environment health | Verify API is reachable in setup |

---

## Practice Exercises

1. Create a `global-setup.js` that authenticates and saves state
2. Create a `global-teardown.js` that deletes the auth state file
3. Refactor the setup to use project dependencies instead of `globalSetup`
4. Add a health check in setup that fails fast if the target site is down
5. Set up a database seed step that creates test data before all tests

---

[Next: CI/CD Integration (GitHub Actions) →](../phase-6-cicd-and-reporting/26-cicd-github-actions.md)
