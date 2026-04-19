# 13 — Authentication Strategies

[← Previous: Hooks & Tags](./12-hooks-tags-annotations.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Network & Mocking →](../phase-4-advanced/14-network-and-mocking.md)

---

## What You Will Learn

- 4 different strategies to handle login in tests
- How to save and reuse authentication state
- How to use `storageState` to skip login UI entirely
- How to set up project dependencies for auth

---

## Strategy 1: Login via UI Every Time (Current Approach)

```javascript
// How our project does it now
test.beforeEach(async ({ loginPage }) => {
  await loginPage.navigate('/');
  await loginPage.login('standard_user', process.env.PASSWORD);
});
```

| Pros | Cons |
|---|---|
| Simple to understand | Slow — login UI runs for every test |
| Tests the login flow | 500 tests × 2 seconds = 16 minutes just for login |

---

## Strategy 2: Save Auth State with `storageState`

Log in once, save cookies/localStorage, reuse for all tests.

### Step 1: Create a setup file

```javascript
// src/tests/auth.setup.js
const { test: setup } = require('@playwright/test');

setup('authenticate', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill(process.env.PASSWORD);
  await page.locator('[data-test="login-button"]').click();
  await page.waitForURL('**/inventory.html');

  // Save the authenticated state (cookies, localStorage)
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

### Step 2: Configure projects with dependencies

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
  ],
});
```

### Step 3: Tests skip login entirely

```javascript
test('view inventory', async ({ page }) => {
  // No login needed! Cookies are pre-loaded from storageState
  await page.goto('/inventory.html');
  await expect(page.locator('.inventory_list')).toBeVisible();
});
```

### What `storageState` saves

```json
// playwright/.auth/user.json (auto-generated)
{
  "cookies": [
    {
      "name": "session-username",
      "value": "standard_user",
      "domain": "www.saucedemo.com",
      "path": "/",
      "httpOnly": false,
      "secure": false,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://www.saucedemo.com",
      "localStorage": []
    }
  ]
}
```

---

## Strategy 3: API Authentication

For apps with API login endpoints, authenticate via API (no browser needed):

```javascript
// src/tests/api-auth.setup.js
const { test: setup } = require('@playwright/test');

setup('API authenticate', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: {
      username: 'standard_user',
      password: process.env.PASSWORD,
    },
  });

  const { token } = await response.json();

  // Create a browser context with the token
  const context = await request.newContext();
  await context.storageState({ path: 'playwright/.auth/user.json' });
});
```

### Speed comparison

| Strategy | Time per test | 500 tests total |
|---|---|---|
| UI Login every time | +2s | +16 min |
| storageState (UI setup once) | +0s (setup: 2s total) | +2s total |
| API Auth (setup once) | +0s (setup: 0.1s total) | +0.1s total |

---

## Strategy 4: Multiple Authenticated Roles

```javascript
// playwright.config.js
module.exports = defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    {
      name: 'standard-user-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/standard.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'problem-user-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/problem.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

```javascript
// auth.setup.js
const { test: setup } = require('@playwright/test');

const users = [
  { name: 'standard', username: 'standard_user' },
  { name: 'problem', username: 'problem_user' },
];

for (const user of users) {
  setup(`authenticate as ${user.name}`, async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    await page.locator('[data-test="username"]').fill(user.username);
    await page.locator('[data-test="password"]').fill(process.env.PASSWORD);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL('**/inventory.html');
    await page.context().storageState({
      path: `playwright/.auth/${user.name}.json`,
    });
  });
}
```

---

## When to Use Each Strategy

| Strategy | Best For |
|---|---|
| UI Login every time | Small suites (<20 tests), testing the login itself |
| storageState | Large suites, cookie/session-based apps |
| API Auth | Apps with API login, fastest possible setup |
| Multiple roles | Role-based access control testing |

---

## Practice Exercises

1. Create `auth.setup.js` that logs in and saves state to `playwright/.auth/user.json`
2. Configure project dependencies so setup runs before chromium tests
3. Remove `beforeEach` login from a test file and verify tests pass with `storageState`
4. Measure time difference: `beforeEach` login vs `storageState` for 10 tests
5. Set up two user roles (standard + locked_out) with separate storage states

---

[Next: Network Interception & API Mocking →](../phase-4-advanced/14-network-and-mocking.md)
