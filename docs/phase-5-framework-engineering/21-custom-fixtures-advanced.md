# 21 — Custom Fixtures & Advanced Composition

[← Previous: SOLID Principles](./20-solid-principles.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Custom Reporters →](./22-custom-reporters.md)

---

## What You Will Learn

- Advanced fixture patterns beyond basic page object injection
- Fixture composition chains
- Worker-scoped fixtures for expensive resources
- Parameterized fixtures for multi-environment testing
- Auto-fixtures for cross-cutting concerns

---

## Pattern 1: Pre-Authenticated Fixture

Skip login UI for every test:

```javascript
const { test: base } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const InventoryPage = require('../pages/InventoryPage');

exports.test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);
    await page.waitForURL('**/inventory.html');
    await use(page);
  },

  inventoryPage: async ({ authenticatedPage }, use) => {
    await use(new InventoryPage(authenticatedPage));
  },
});
```

```javascript
// Test — no login code needed
test('add to cart', async ({ inventoryPage }) => {
  await inventoryPage.addItemToCart(0);
  expect(await inventoryPage.getCartCount()).toBe('1');
});
```

---

## Pattern 2: Fixture with Cleanup (Setup + Teardown)

```javascript
exports.test = base.extend({
  testProduct: async ({ request }, use) => {
    // SETUP: Create test data via API
    const response = await request.post('/api/products', {
      data: { name: `Test-${Date.now()}`, price: 9.99 },
    });
    const product = await response.json();

    // PROVIDE to test
    await use(product);

    // TEARDOWN: Clean up after test
    await request.delete(`/api/products/${product.id}`);
  },
});

test('product appears in list', async ({ page, testProduct }) => {
  await page.goto('/products');
  await expect(page.getByText(testProduct.name)).toBeVisible();
  // testProduct is auto-deleted after test completes
});
```

---

## Pattern 3: Worker-Scoped Fixtures

Created once per worker, shared across all tests in that worker:

```javascript
exports.test = base.extend({
  // Created ONCE per worker, not per test
  dbConnection: [async ({}, use) => {
    const db = await Database.connect(process.env.DB_URL);
    console.log('DB connected (once per worker)');
    await use(db);
    await db.disconnect();
    console.log('DB disconnected');
  }, { scope: 'worker' }],

  // Per-test fixture that uses the shared DB
  testData: async ({ dbConnection }, use) => {
    const data = await dbConnection.createTestUser();
    await use(data);
    await dbConnection.deleteUser(data.id);
  },
});
```

---

## Pattern 4: Parameterized Fixtures (Options)

```javascript
exports.test = base.extend({
  // Declare options with defaults
  userRole: ['standard', { option: true }],
  baseUrl: ['https://www.saucedemo.com', { option: true }],

  // Fixture uses the option
  loginPage: async ({ page, userRole, baseUrl }, use) => {
    const userMap = {
      standard: 'standard_user',
      problem: 'problem_user',
      glitch: 'performance_glitch_user',
      locked: 'locked_out_user',
    };
    const loginPage = new LoginPage(page);
    await page.goto(baseUrl);
    await loginPage.login(userMap[userRole], process.env.PASSWORD);
    await use(loginPage);
  },
});
```

```javascript
// Override options per test or describe
test.describe('Standard user tests', () => {
  test.use({ userRole: 'standard' });

  test('can view products', async ({ loginPage, page }) => {
    await expect(page).toHaveURL(/.*inventory/);
  });
});

test.describe('Problem user tests', () => {
  test.use({ userRole: 'problem' });

  test('sees broken images', async ({ loginPage, page }) => {
    // Tests run with problem_user logged in
  });
});
```

---

## Pattern 5: Auto-Fixtures (Cross-Cutting Concerns)

Auto-fixtures run for every test automatically:

```javascript
exports.test = base.extend({
  // Performance logging — runs for EVERY test
  perfLogger: [async ({ page }, use, testInfo) => {
    const startTime = Date.now();
    await use();
    const duration = Date.now() - startTime;
    console.log(`[PERF] ${testInfo.title}: ${duration}ms`);
  }, { auto: true }],

  // Screenshot on failure — runs for EVERY test
  autoScreenshot: [async ({ page }, use, testInfo) => {
    await use();
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  }, { auto: true }],

  // Console error collector
  consoleErrors: [async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await use();
    if (errors.length > 0) {
      await testInfo.attach('browser-errors', {
        body: errors.join('\n'),
        contentType: 'text/plain',
      });
    }
  }, { auto: true }],
});
```

---

## Pattern 6: Fixture Merging (Multiple Fixture Files)

```javascript
// fixtures/auth.fixtures.js
const { test: base } = require('@playwright/test');

exports.test = base.extend({
  loginPage: async ({ page }, use) => { /* ... */ },
});

// fixtures/inventory.fixtures.js
const { test: authTest } = require('./auth.fixtures');

exports.test = authTest.extend({
  inventoryPage: async ({ page }, use) => { /* ... */ },
  cartPage: async ({ page }, use) => { /* ... */ },
});

// fixtures/index.js — merge all
const { test: inventoryTest } = require('./inventory.fixtures');

exports.test = inventoryTest.extend({
  checkoutPage: async ({ page }, use) => { /* ... */ },
});

exports.expect = inventoryTest.expect;
```

---

## Pattern 7: Conditional Fixtures

```javascript
exports.test = base.extend({
  apiClient: async ({ request }, use, testInfo) => {
    const isCI = !!process.env.CI;
    const baseUrl = isCI
      ? 'https://staging-api.example.com'
      : 'http://localhost:3000';

    const client = {
      get: (path) => request.get(`${baseUrl}${path}`),
      post: (path, data) => request.post(`${baseUrl}${path}`, { data }),
    };

    await use(client);
  },
});
```

---

## Fixture Dependency Graph for This Project

```
Built-in: browser (per-worker)
  └── Built-in: context (per-test)
      └── Built-in: page (per-test)
          ├── loginPage
          ├── inventoryPage
          ├── cartPage
          └── checkoutPage
```

---

## Practice Exercises

1. Create a `authenticatedPage` fixture that logs in before providing the page
2. Create a worker-scoped fixture that prints "Worker started" (verify it only prints once)
3. Create an auto-fixture that measures test execution time
4. Create a parameterized fixture with `userRole` option and test with 3 different roles
5. Create a fixture chain: `page → loginFixture → inventoryFixture → cartWithItemsFixture`

---

[Next: Custom Reporters & Integrations →](./22-custom-reporters.md)
