# 02 — Your First Test

[← Previous: Installation](./01-installation-and-setup.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Config File →](./03-playwright-config.md)

---

## What You Will Learn

- The anatomy of a Playwright test file
- How `test()`, `expect()`, and `page` work together
- How to write, run, and debug your very first test
- How to read test results and error messages

---

## The Simplest Possible Test

Create a file `src/tests/my-first.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test('SauceDemo homepage has correct title', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
  await expect(page).toHaveTitle('Swag Labs');
});
```

Run it:

```bash
npx playwright test src/tests/my-first.spec.js
```

### Breaking down every piece

```javascript
// 1. IMPORT — Get the test runner and assertion library
const { test, expect } = require('@playwright/test');

// 2. TEST BLOCK — Define a single test case
test('SauceDemo homepage has correct title', async ({ page }) => {
  //    ↑ Test name (shows in reports)        ↑ Destructure the "page" fixture
  //                                           Playwright gives you a fresh browser page

  // 3. ACTION — Navigate to a URL
  await page.goto('https://www.saucedemo.com');
  //   ↑ "await" is required — all Playwright actions are async (they talk to a browser)

  // 4. ASSERTION — Verify something is true
  await expect(page).toHaveTitle('Swag Labs');
  //   ↑ "expect" also needs "await" for web-first assertions (they auto-retry)
});
```

### Key concepts from this example

| Concept | Explanation |
|---|---|
| `test()` | Defines one test case. Takes a name and an async function. |
| `{ page }` | A **fixture**. Playwright automatically creates a new browser page for each test. |
| `async/await` | Every browser interaction is asynchronous. You **must** use `await`. |
| `expect()` | Playwright's assertion library. Web-first assertions auto-retry until they pass or timeout. |

---

## A More Realistic Test — Login Flow

```javascript
const { test, expect } = require('@playwright/test');

test('User can login with valid credentials', async ({ page }) => {
  // Navigate to login page
  await page.goto('https://www.saucedemo.com');

  // Fill in username
  await page.locator('[data-test="username"]').fill('standard_user');

  // Fill in password
  await page.locator('[data-test="password"]').fill('secret_sauce');

  // Click login button
  await page.locator('[data-test="login-button"]').click();

  // Verify we landed on the inventory page
  await expect(page).toHaveURL(/.*inventory.html/);

  // Verify page shows products
  await expect(page.locator('[data-test="inventory-item"]').first()).toBeVisible();
});
```

### What happens behind the scenes

1. Playwright launches a **new browser instance**
2. Creates a **new browser context** (like an incognito window — clean cookies, no state)
3. Opens a **new page** (tab) in that context
4. Runs your test code
5. Closes everything (page → context → browser)
6. Each test is **completely isolated** — nothing leaks between tests

---

## Grouping Tests with `test.describe`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Login Page', () => {

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    await page.locator('[data-test="username"]').fill('wrong_user');
    await page.locator('[data-test="password"]').fill('wrong_pass');
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match'
    );
  });

});
```

### `test.describe` explained

- Groups related tests under a shared name
- Shows up as a nested section in test reports
- You can nest `describe` blocks inside each other
- You can apply shared `beforeEach`/`afterEach` hooks to the group (covered in Chapter 12)

---

## Using `beforeEach` to Avoid Repetition

Notice both tests above navigate to the same URL. Use `beforeEach`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Login Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.locator('[data-test="username"]').fill('wrong_user');
    await page.locator('[data-test="password"]').fill('wrong_pass');
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match'
    );
  });

});
```

### Hook execution order

```
beforeEach → Test 1 → afterEach
beforeEach → Test 2 → afterEach
beforeEach → Test 3 → afterEach
```

Each test gets its own `beforeEach` execution. They do NOT share state.

---

## Reading Test Results

### Passing test output

```
Running 2 tests using 2 workers

  ✓  Login Page > should login with valid credentials (1.2s)
  ✓  Login Page > should show error for invalid credentials (0.9s)

  2 passed (3.1s)
```

### Failing test output

```
  ✗  Login Page > should login with valid credentials (5.0s)

    Error: expect(locator).toHaveURL(expected)

    Expected pattern: /.*inventory.html/
    Received string:  "https://www.saucedemo.com/"

    Call log:
      - expect.toHaveURL with timeout 5000ms
      - waiting for locator
      -   locator resolved to ...
      - unexpected value "https://www.saucedemo.com/"
```

### How to read the error

1. **Which test failed** — The test name is shown after `✗`
2. **What assertion failed** — `expect(locator).toHaveURL(expected)`
3. **Expected vs Received** — What you expected vs what the browser actually had
4. **Call log** — Step-by-step trace of what Playwright tried to do
5. **Timeout** — Playwright retried for 5000ms before giving up

---

## Running Tests in Headed Mode (See the Browser)

```bash
# Watch the browser while the test runs
npx playwright test src/tests/my-first.spec.js --headed

# Slow down every action by 1 second (great for demos)
npx playwright test src/tests/my-first.spec.js --headed --slowmo=1000
```

---

## Using the Playwright Inspector (Debugger)

```bash
# Opens a debugger — step through every line
npx playwright test src/tests/my-first.spec.js --debug
```

The Inspector lets you:
- **Step over** each line one at a time
- **See the browser** highlight the element being interacted with
- **Pick locators** by clicking elements in the browser
- **View the call log** for each action

---

## Using Codegen (Record Tests)

Playwright can record your actions and generate test code:

```bash
npx playwright codegen https://www.saucedemo.com
```

This opens:
1. A browser window — interact with the site normally
2. A code window — shows the generated test code in real time

**Important:** Codegen is a starting point, not a final solution. Always clean up the generated code:
- Replace fragile selectors with `data-test` attributes
- Add proper assertions
- Extract page objects

---

## Practice Exercises

1. Write a test that verifies the login page has a username field, password field, and login button
2. Write a test that verifies the error message when you submit an empty form
3. Use `--debug` mode to step through your test line by line
4. Use `codegen` to record a login flow, then clean up the generated code
5. Write a `test.describe` block with 3 different login scenarios (valid, invalid, empty)

---

[Next: Understanding the Config File →](./03-playwright-config.md)
