# 24 — Retry Logic & Flaky Test Management

[← Previous: Parallelism](./23-parallelism-and-sharding.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Global Setup →](./25-global-setup-teardown.md)

---

## What You Will Learn

- How Playwright's retry mechanism works
- How to configure retries globally and per-test
- How to identify, track, and fix flaky tests
- Strategies for dealing with flakiness

---

## How Retries Work

```javascript
// playwright.config.js
retries: process.env.CI ? 2 : 0,
```

When `retries: 2`:

```
Test Run:
  Attempt 1: FAIL  → retry
  Attempt 2: FAIL  → retry
  Attempt 3: PASS  → marked as "flaky" (passed on retry)
```

### Outcome categories

| Scenario | Status | Meaning |
|---|---|---|
| Pass on attempt 1 | `passed` | Test is stable |
| Fail, pass on retry | `flaky` | Test is unreliable — needs investigation |
| Fail all attempts | `failed` | Real bug or severe flakiness |

---

## Configure Retries

### Global (all tests)

```javascript
// playwright.config.js
retries: 2,
```

### Per project

```javascript
projects: [
  {
    name: 'chromium',
    retries: 2,
  },
  {
    name: 'webkit',
    retries: 3,   // WebKit is slower, needs more retries
  },
],
```

### Per test

```javascript
test('flaky network test', { retries: 5 }, async ({ page }) => {
  // This specific test retries up to 5 times
});

test.describe('Stable tests', { retries: 0 }, () => {
  // No retries for these tests
});
```

---

## Retry-Aware Test Code

```javascript
test('retry-aware test', async ({ page }, testInfo) => {
  console.log(`Attempt: ${testInfo.retry + 1} of ${testInfo.retries + 1}`);

  if (testInfo.retry > 0) {
    // Do something different on retry (e.g., clear cache)
    await page.evaluate(() => localStorage.clear());
  }

  // Test code...
});
```

---

## Artifacts on Retry

Configure what to capture on retries:

```javascript
// playwright.config.js
use: {
  trace: 'on-first-retry',        // Capture trace on first retry
  screenshot: 'only-on-failure',   // Screenshot on every failure
  video: 'on-first-retry',        // Video on first retry
},
```

| Setting | Attempt 1 (fail) | Attempt 2 (retry) | Attempt 3 (retry) |
|---|---|---|---|
| `trace: 'on-first-retry'` | No trace | Trace recorded | No trace |
| `trace: 'on-all-retries'` | No trace | Trace recorded | Trace recorded |
| `trace: 'retain-on-failure'` | Trace recorded | Trace recorded | Trace recorded |
| `screenshot: 'only-on-failure'` | Screenshot | Screenshot | Screenshot |
| `video: 'on-first-retry'` | No video | Video recorded | No video |

---

## Identifying Flaky Tests

### Method 1: Repeat tests

```bash
# Run each test 10 times
npx playwright test --repeat-each=10

# If any test fails even once out of 10, it's flaky
```

### Method 2: Track flaky results in CI

```javascript
// Custom reporter to track flaky tests
class FlakyTracker {
  constructor() { this.flaky = []; }

  onTestEnd(test, result) {
    if (result.status === 'passed' && result.retry > 0) {
      this.flaky.push({
        name: test.title,
        file: test.location.file,
        retries: result.retry,
      });
    }
  }

  onEnd() {
    if (this.flaky.length > 0) {
      console.log('\n⚠️  FLAKY TESTS DETECTED:');
      this.flaky.forEach(t => {
        console.log(`  ${t.name} (passed on retry ${t.retries}) — ${t.file}`);
      });
    }
  }
}

module.exports = FlakyTracker;
```

### Method 3: `--last-failed`

```bash
# Run only tests that failed in the previous run
npx playwright test --last-failed
```

---

## Common Causes of Flakiness

| Cause | Solution |
|---|---|
| Hard waits (`waitForTimeout`) | Use auto-waiting assertions |
| Race conditions (click before element ready) | Playwright's auto-wait handles this |
| Test data pollution (tests share state) | Use fixtures for isolation |
| Network timeouts | Increase timeout or mock APIs |
| Animation interference | Use `animations: 'disabled'` |
| Time-dependent tests | Mock `Date.now()` with `page.clock` |
| Random data without seeding | Use deterministic test data |
| Shared mutable state between tests | Use `test.describe.configure({ mode: 'parallel' })` with proper isolation |

### Fixing time-dependent tests

```javascript
test('time-dependent feature', async ({ page }) => {
  // Freeze time to a specific date
  await page.clock.setFixedTime(new Date('2025-01-15T10:00:00'));

  await page.goto('/dashboard');
  await expect(page.getByText('January 15, 2025')).toBeVisible();
});
```

---

## Retry Best Practices

1. **Retries = 0 locally** — See real failures immediately
2. **Retries = 2 in CI** — Handle transient infrastructure issues
3. **Track flaky tests** — Don't just retry and ignore
4. **Fix flaky tests** — Every flaky test erodes confidence in the suite
5. **Never use retries to mask bugs** — If a test needs 5 retries, it's broken

---

## Practice Exercises

1. Set `retries: 2` and intentionally create a flaky test (random failure) — observe the "flaky" status
2. Run `npx playwright test --repeat-each=5` to check for flakiness in the project
3. Build the FlakyTracker reporter above and integrate it into the project
4. Use `testInfo.retry` to add extra logging on retries
5. Set `trace: 'retain-on-failure'` and investigate a failure using the trace viewer

---

[Next: Global Setup & Teardown →](./25-global-setup-teardown.md)
