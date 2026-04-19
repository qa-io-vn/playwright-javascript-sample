# 23 — Parallelism, Sharding & Performance

[← Previous: Custom Reporters](./22-custom-reporters.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Retries & Flaky Tests →](./24-retries-and-flaky-tests.md)

---

## What You Will Learn

- How Playwright parallelism works (workers, files, tests)
- How to shard tests across CI machines
- How to merge sharded reports
- Performance tuning strategies

---

## How Parallelism Works

### Workers

A **worker** is a separate process that runs tests. Each worker launches its own browser.

```javascript
// playwright.config.js
module.exports = defineConfig({
  workers: 5,            // 5 parallel browser instances
  fullyParallel: true,   // Each test can run in any worker
});
```

### Execution model

```
Worker 1: auth.spec.js → test 1, test 2, test 3
Worker 2: auth.spec.js → test 4, test 5, test 6
Worker 3: inventory.spec.js → test 1, test 2
Worker 4: purchase_flow.spec.js → test 1, test 2
Worker 5: negative_tests.spec.js → test 1, test 2
```

With `fullyParallel: true`, individual tests from the same file can run in different workers.

### Sequential within a file

```javascript
// Force tests in this file to run in order
test.describe.configure({ mode: 'serial' });

test.describe('Ordered flow', () => {
  test('step 1: login', async ({ page }) => { /* ... */ });
  test('step 2: add to cart', async ({ page }) => { /* ... */ });
  test('step 3: checkout', async ({ page }) => { /* ... */ });
  // If step 1 fails, step 2 and 3 are skipped
});
```

### Parallel within a file (default with fullyParallel)

```javascript
test.describe.configure({ mode: 'parallel' });

test.describe('Independent tests', () => {
  test('test A', async ({ page }) => { /* ... */ });
  test('test B', async ({ page }) => { /* ... */ });
  test('test C', async ({ page }) => { /* ... */ });
  // All can run simultaneously
});
```

---

## Sharding — Splitting Tests Across CI Machines

### Concept

Sharding divides your entire test suite into N parts, each run on a separate CI machine:

```
Machine 1:  npx playwright test --shard=1/4   → runs tests 1-25
Machine 2:  npx playwright test --shard=2/4   → runs tests 26-50
Machine 3:  npx playwright test --shard=3/4   → runs tests 51-75
Machine 4:  npx playwright test --shard=4/4   → runs tests 76-100
```

### Speed comparison (100 tests, 2 min each)

| Workers | Machines (Shards) | Total Time |
|---|---|---|
| 1 | 1 | 200 min |
| 5 | 1 | 40 min |
| 5 | 4 | 10 min |

### GitHub Actions matrix sharding

```yaml
# .github/workflows/test.yml
jobs:
  test:
    strategy:
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ strategy.job-index }}
          path: blob-report/
```

---

## Merging Sharded Reports

After sharding, merge reports from all machines:

```yaml
  merge-reports:
    needs: test
    steps:
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter=html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: html-report
          path: playwright-report/
```

### Configure blob reporter for sharding

```javascript
// playwright.config.js
reporter: process.env.CI
  ? [['blob', { outputDir: 'blob-report' }]]
  : [['html']],
```

---

## Performance Tuning Strategies

### 1. Reduce worker count in CI

```javascript
workers: process.env.CI ? 2 : 5,
// CI machines often have fewer cores than dev machines
```

### 2. Skip login UI (use storageState)

```
Before: 145 tests × 2s login = 290s wasted on login
After:  145 tests × 0s login = 290s saved
```

### 3. Block unnecessary resources

```javascript
use: {
  // Add to context for all tests
},

// Or in a fixture:
page: async ({ page }, use) => {
  await page.route('**/*.{png,jpg,gif,svg,css,woff,woff2}', route => route.abort());
  await use(page);
},
```

### 4. Use API for test data setup

```javascript
// SLOW: Create test data via UI clicks
await page.goto('/admin');
await page.fill('#product-name', 'Test');
await page.click('#save');

// FAST: Create test data via API
await request.post('/api/products', { data: { name: 'Test' } });
```

### 5. Reduce retries locally

```javascript
retries: process.env.CI ? 2 : 0,
```

### 6. Run only affected tests

```bash
# Run tests related to changed files
npx playwright test --only-changed=main
```

---

## Monitoring Test Performance

### Find slow tests

```bash
npx playwright test --reporter=json | jq '.suites[].specs[].tests[].results[].duration' | sort -rn | head -10
```

### Custom performance reporter

```javascript
class PerfReporter {
  constructor() { this.tests = []; }

  onTestEnd(test, result) {
    this.tests.push({ title: test.title, duration: result.duration });
  }

  onEnd() {
    const sorted = this.tests.sort((a, b) => b.duration - a.duration);
    console.log('\n=== SLOWEST TESTS ===');
    sorted.slice(0, 10).forEach((t, i) => {
      console.log(`${i + 1}. ${t.title} — ${t.duration}ms`);
    });
  }
}

module.exports = PerfReporter;
```

---

## Practice Exercises

1. Change `workers` from 5 to 1 and measure how much slower the suite becomes
2. Run `npx playwright test --shard=1/3` and `--shard=2/3` and `--shard=3/3` locally
3. Add `test.describe.configure({ mode: 'serial' })` to a test file and observe the behavior
4. Build the performance reporter above and find the slowest test in the project
5. Set up GitHub Actions matrix sharding with 4 shards

---

[Next: Retry Logic & Flaky Test Management →](./24-retries-and-flaky-tests.md)
