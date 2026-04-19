# 12 — Hooks, Tags & Annotations

[← Previous: Data-Driven Testing](./11-data-driven-testing.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Authentication →](./13-authentication.md)

---

## What You Will Learn

- All lifecycle hooks: `beforeAll`, `beforeEach`, `afterEach`, `afterAll`
- How to tag tests and run them selectively
- Playwright annotations: `skip`, `fail`, `slow`, `fixme`, `only`
- Conditional execution and test metadata

---

## Lifecycle Hooks

### Execution order

```
beforeAll        ← Runs ONCE before all tests in the describe
  beforeEach     ← Runs before EACH test
    Test 1
  afterEach      ← Runs after EACH test
  beforeEach
    Test 2
  afterEach
  beforeEach
    Test 3
  afterEach
afterAll         ← Runs ONCE after all tests in the describe
```

### `beforeEach` / `afterEach`

```javascript
test.describe('Inventory', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);
  });

  test.afterEach(async ({ page }) => {
    // Runs after each test — good for cleanup
    await page.evaluate(() => window.localStorage.clear());
  });

  test('add item to cart', async ({ inventoryPage }) => { /* ... */ });
  test('sort products', async ({ inventoryPage }) => { /* ... */ });
});
```

### `beforeAll` / `afterAll`

```javascript
test.describe('API Tests', () => {
  let authToken;

  test.beforeAll(async ({ request }) => {
    // Runs ONCE — create shared resource
    const response = await request.post('/api/auth', {
      data: { username: 'admin', password: 'admin' }
    });
    authToken = (await response.json()).token;
  });

  test.afterAll(async ({ request }) => {
    // Cleanup — delete test data
    await request.delete('/api/test-data', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('get products', async ({ request }) => {
    const response = await request.get('/api/products', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.ok()).toBeTruthy();
  });
});
```

### Nested hooks

```javascript
test.describe('Outer', () => {
  test.beforeEach(async () => { console.log('Outer beforeEach'); });

  test.describe('Inner', () => {
    test.beforeEach(async () => { console.log('Inner beforeEach'); });

    test('my test', async () => {
      // Execution order:
      // 1. Outer beforeEach
      // 2. Inner beforeEach
      // 3. Test code
    });
  });
});
```

---

## Tags

### How this project uses tags

Tags are placed in test names:

```javascript
test('Login: Success for standard_user @sanity', async () => { /* ... */ });
test('Purchase: Complete Flow @smoke', async () => { /* ... */ });
test('Cart: Add and remove items @regression', async () => { /* ... */ });
test('Purchase: Full E2E flow @e2e', async () => { /* ... */ });
```

### Running by tag

```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @sanity

# Combine tags (OR logic)
npx playwright test --grep "@smoke|@sanity"

# Exclude a tag
npx playwright test --grep-invert @slow

# Combine: run regression but not slow
npx playwright test --grep @regression --grep-invert @slow
```

### Using `test.describe` with tags

```javascript
test.describe('Authentication @regression', () => {
  // All tests in this block are tagged @regression
  // --grep @regression matches the describe name too
});
```

### Tag via Playwright annotations (v1.42+)

```javascript
test('fast checkout', {
  tag: ['@smoke', '@fast'],
}, async ({ page }) => {
  // ...
});

test.describe('Checkout', {
  tag: '@e2e',
}, () => {
  test('complete purchase', async ({ page }) => { /* ... */ });
});
```

```bash
npx playwright test --grep @smoke
```

---

## Annotations

### `test.skip` — Skip a test

```javascript
// Always skip
test.skip('broken feature', async ({ page }) => { /* ... */ });

// Conditional skip
test('mobile layout', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Mobile layout not supported on Firefox');
  // Test code — only runs on non-Firefox
});

// Skip entire describe
test.describe.skip('WIP features', () => {
  test('new feature 1', async ({ page }) => { /* ... */ });
  test('new feature 2', async ({ page }) => { /* ... */ });
});
```

### `test.fixme` — Mark as known broken

```javascript
// Like skip, but signals "this needs fixing"
test.fixme('checkout with coupon', async ({ page }) => {
  // Won't run — but shows up in reports as "fixme"
});

// Conditional
test('dark mode', async ({ page }) => {
  test.fixme(true, 'Dark mode has CSS regression - JIRA-1234');
});
```

### `test.fail` — Expect a test to fail

```javascript
// Marks the test as "expected to fail"
// If it PASSES, the test suite FAILS (because the bug was fixed and annotation should be removed)
test('known bug in sorting', async ({ page }) => {
  test.fail();
  // ... test code that we know will fail
});

// Conditional
test('edge case', async ({ browserName }) => {
  test.fail(browserName === 'webkit', 'Known WebKit rendering bug');
});
```

### `test.slow` — Triple the timeout

```javascript
test('complex animation test', async ({ page }) => {
  test.slow();  // Timeout is now 3x normal (e.g., 180s instead of 60s)
  // ... slow test code
});

// Conditional
test('heavy page', async ({ browserName }) => {
  test.slow(browserName === 'webkit', 'WebKit renders this page slowly');
});
```

### `test.only` — Run only this test (debugging)

```javascript
// ONLY this test runs — all others are skipped
test.only('debug this test', async ({ page }) => {
  // ...
});

// IMPORTANT: forbidOnly in config prevents this from reaching CI
// playwright.config.js: forbidOnly: !!process.env.CI
```

---

## `test.info()` — Test Metadata

Access metadata about the currently running test:

```javascript
test('example', async ({ page }, testInfo) => {
  // Test metadata
  console.log(testInfo.title);           // 'example'
  console.log(testInfo.file);            // '/path/to/test.spec.js'
  console.log(testInfo.line);            // Line number
  console.log(testInfo.column);          // Column number
  console.log(testInfo.retry);           // Current retry attempt (0, 1, 2...)
  console.log(testInfo.project.name);    // 'chromium'
  console.log(testInfo.timeout);         // 60000

  // Change timeout for this specific test
  testInfo.setTimeout(120000);

  // Attach files to the report
  await testInfo.attach('screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  // Add annotations to the report
  testInfo.annotations.push({
    type: 'issue',
    description: 'https://jira.company.com/browse/QA-1234'
  });
});
```

---

## Annotation via config object (v1.42+)

```javascript
test('checkout flow', {
  tag: ['@e2e', '@critical'],
  annotation: {
    type: 'issue',
    description: 'https://github.com/org/repo/issues/123',
  },
}, async ({ page }) => {
  // ...
});
```

---

## Practice Exercises

1. Add `beforeAll` and `afterAll` hooks to a test file and verify execution order with `console.log`
2. Add `@critical` tag to the most important tests and create an npm script to run them
3. Mark a test with `test.fixme()` and see how it appears in the test report
4. Use `test.fail()` on a test you know will fail and observe what happens when it passes
5. Use `testInfo` to attach a screenshot to a test report on every test run

---

[Next: Authentication Strategies →](./13-authentication.md)
