# 10 — Fixtures & Dependency Injection

[← Previous: POM](./09-page-object-model.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Data-Driven Testing →](./11-data-driven-testing.md)

---

## What You Will Learn

- What fixtures are and why they replace `beforeEach`/`afterEach`
- How Playwright's built-in fixtures work (`page`, `context`, `browser`)
- How to create custom fixtures (like our project does)
- Fixture scoping: per-test vs per-worker
- Advanced fixture patterns: composition, overriding, auto-fixtures

---

## What Is a Fixture?

A fixture is a **reusable piece of setup** that gets injected into your test. Instead of creating objects in `beforeEach`, you declare what you need and Playwright provides it.

### Without fixtures (the old way)

```javascript
test.describe('Inventory', () => {
  let loginPage;
  let inventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);         // Manual setup in every describe
    inventoryPage = new InventoryPage(page);
    await loginPage.navigate('/');
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('add item to cart', async () => {
    await inventoryPage.addItemToCart(0);     // Uses the variable from beforeEach
  });
});
```

### With fixtures (the professional way)

```javascript
test('add item to cart', async ({ loginPage, inventoryPage }) => {
  await loginPage.navigate('/');
  await loginPage.login('standard_user', process.env.PASSWORD);
  await inventoryPage.addItemToCart(0);
});
// No beforeEach, no manual setup, no shared mutable state
```

---

## Built-in Fixtures

Playwright provides these fixtures automatically:

| Fixture | Scope | Description |
|---|---|---|
| `page` | per-test | A new browser page (tab) — isolated per test |
| `context` | per-test | A browser context (like incognito) — owns the page |
| `browser` | per-worker | A browser instance — shared across tests in one worker |
| `browserName` | per-worker | String: `'chromium'`, `'firefox'`, or `'webkit'` |
| `request` | per-test | An API request context for making HTTP calls |

### Lifecycle

```
Worker starts
  └── browser = chromium.launch()        ← created once per worker
      │
      ├── Test 1
      │   ├── context = browser.newContext()   ← fresh per test
      │   ├── page = context.newPage()         ← fresh per test
      │   ├── [test code runs]
      │   ├── page.close()                     ← cleaned up
      │   └── context.close()                  ← cleaned up
      │
      ├── Test 2
      │   ├── context = browser.newContext()   ← completely new
      │   ├── page = context.newPage()         ← completely new
      │   ├── [test code runs]
      │   └── ...cleaned up...
      │
      └── browser.close()               ← closed when worker finishes
```

---

## How Our Project Creates Custom Fixtures

```javascript
// src/fixtures/baseTest.js
const { test: base } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const InventoryPage = require('../pages/InventoryPage');
const CartPage = require('../pages/CartPage');
const CheckoutPage = require('../pages/CheckoutPage');

exports.test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

exports.expect = base.expect;
```

### Breaking it down

```javascript
// 1. Import the base test
const { test: base } = require('@playwright/test');

// 2. Extend it with new fixtures
exports.test = base.extend({

  // 3. Define a fixture named "loginPage"
  loginPage: async ({ page }, use) => {
    //              ↑ depends on built-in "page" fixture (auto-injected)
    //                      ↑ "use" is the function you call to provide the fixture value

    // SETUP phase — runs before the test
    const lp = new LoginPage(page);

    // PROVIDE — give the fixture value to the test
    await use(lp);

    // TEARDOWN phase — runs after the test (optional)
    // You could clean up here, e.g., clear cookies
  },

});
```

### How tests consume fixtures

```javascript
// src/tests/auth.spec.js
const { test, expect } = require('../fixtures/baseTest');
//      ↑ Import OUR custom test, not @playwright/test

test('Login success', async ({ loginPage, inventoryPage }) => {
  //                           ↑ Request fixtures by name
  await loginPage.login('standard_user', process.env.PASSWORD);
  await expect(inventoryPage.page).toHaveURL(/.*inventory.html/);
});
```

---

## Fixture with Setup and Teardown

```javascript
exports.test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // SETUP: Navigate and login before the test
    const loginPage = new LoginPage(page);
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);

    // PROVIDE: Give the logged-in page to the test
    await use(page);

    // TEARDOWN: Cleanup after the test
    // Clear session storage, local storage, etc.
    await page.evaluate(() => window.sessionStorage.clear());
  },
});

// Test receives a page that's already logged in
test('view products', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.locator('.inventory_list')).toBeVisible();
});
```

---

## Fixture Scoping

### Per-test scope (default)

Created fresh for each test. Test isolation guaranteed.

```javascript
loginPage: async ({ page }, use) => {
  await use(new LoginPage(page));
},
```

### Per-worker scope

Created once per worker process. Shared across tests in that worker. Use for expensive resources.

```javascript
sharedDatabase: [async ({}, use) => {
  // Expensive setup — only happens once per worker
  const db = await connectToDatabase();
  await use(db);
  // Teardown
  await db.disconnect();
}, { scope: 'worker' }],
```

### When to use each scope

| Scope | Use Case | Example |
|---|---|---|
| `test` | Anything that should be isolated | Page objects, test data, browser contexts |
| `worker` | Expensive shared resources | Database connections, API servers, test user creation |

---

## Auto-Fixtures

Auto-fixtures run automatically for every test without being requested:

```javascript
exports.test = base.extend({
  // This runs for EVERY test, even if the test doesn't request it
  autoLogger: [async ({}, use) => {
    console.log('Test starting...');
    await use();
    console.log('Test finished.');
  }, { auto: true }],
});
```

### Real-world auto-fixture: Automatic screenshot on failure

```javascript
exports.test = base.extend({
  failureScreenshot: [async ({ page }, use, testInfo) => {
    await use();
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot();
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  }, { auto: true }],
});
```

---

## Composing Fixtures

Fixtures can depend on other fixtures:

```javascript
exports.test = base.extend({
  // Base fixture
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // This fixture depends on loginPage
  loggedInPage: async ({ loginPage, page }, use) => {
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);
    await use(page);   // Provides a page that's already logged in
  },

  // This fixture depends on loggedInPage
  inventoryWithItems: async ({ loggedInPage }, use) => {
    const inventoryPage = new InventoryPage(loggedInPage);
    await inventoryPage.addItemToCart(0);
    await inventoryPage.addItemToCart(1);
    await use(inventoryPage);   // Provides inventory with 2 items in cart
  },
});
```

Dependency chain: `page` → `loginPage` → `loggedInPage` → `inventoryWithItems`

---

## Overriding Built-in Fixtures

You can override Playwright's built-in fixtures:

```javascript
exports.test = base.extend({
  // Override the built-in "page" fixture
  page: async ({ page }, use) => {
    // Set a default viewport for all tests
    await page.setViewportSize({ width: 1920, height: 1080 });
    // Block analytics in all tests
    await page.route('**/analytics/**', route => route.abort());
    await use(page);
  },

  // Override the built-in "context" fixture
  context: async ({ context }, use) => {
    // Grant geolocation permission to all tests
    await context.grantPermissions(['geolocation']);
    await use(context);
  },
});
```

---

## Fixture Options

Pass configuration to fixtures using options:

```javascript
exports.test = base.extend({
  userType: ['standard', { option: true }],

  loginPage: async ({ page, userType }, use) => {
    const lp = new LoginPage(page);
    await lp.navigate('/');
    await lp.login(userType === 'admin' ? 'admin_user' : 'standard_user', 'secret_sauce');
    await use(lp);
  },
});

// In test config or test file, override the option:
test.use({ userType: 'admin' });

test('admin can see settings', async ({ loginPage }) => {
  // loginPage is now logged in as admin
});
```

---

## Practice Exercises

1. Read `src/fixtures/baseTest.js` and trace how each fixture connects to its page object
2. Add a new fixture `authenticatedPage` that provides a page already logged in
3. Add a teardown step to the `loginPage` fixture that logs "Test completed for LoginPage"
4. Create an auto-fixture that logs the current URL at the end of every test
5. Create a fixture with `{ scope: 'worker' }` that prints "Worker started" once per worker

---

[Next: Data-Driven Testing →](./11-data-driven-testing.md)
