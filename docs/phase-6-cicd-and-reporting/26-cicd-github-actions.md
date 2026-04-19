# 26 — CI/CD Integration (GitHub Actions)

[← Previous: Global Setup](../phase-5-framework-engineering/25-global-setup-teardown.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Docker →](./27-docker.md)

---

## What You Will Learn

- How to run Playwright tests in GitHub Actions
- How to configure workflows for different triggers
- How to handle artifacts (reports, traces, screenshots)
- How to implement sharding for fast CI runs
- Complete production-ready workflow templates

---

## Basic GitHub Actions Workflow

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: https://www.saucedemo.com
          PASSWORD: ${{ secrets.SAUCEDEMO_PASSWORD }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Key points

| Setting | Purpose |
|---|---|
| `on: push/pull_request` | When to trigger the workflow |
| `ubuntu-latest` | Linux runner (consistent screenshots) |
| `npm ci` | Clean install (faster than `npm install`, uses lock file) |
| `--with-deps` | Installs browser system dependencies (fonts, libs) |
| `${{ secrets.* }}` | Secure environment variables from GitHub Secrets |
| `if: ${{ !cancelled() }}` | Upload artifacts even if tests fail |

---

## Production-Ready Workflow with Sharding

```yaml
name: Playwright Tests (Sharded)

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'   # Nightly at 6 AM UTC

env:
  BASE_URL: https://www.saucedemo.com

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run tests (shard ${{ matrix.shard }})
        run: npx playwright test --shard=${{ matrix.shard }}
        env:
          PASSWORD: ${{ secrets.SAUCEDEMO_PASSWORD }}

      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: blob-report-${{ strategy.job-index }}
          path: blob-report/
          retention-days: 7

  merge-reports:
    if: ${{ !cancelled() }}
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter=html ./all-blob-reports

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Workflow Triggers

```yaml
on:
  # On every push to main
  push:
    branches: [main]

  # On pull requests targeting main
  pull_request:
    branches: [main]

  # Scheduled (cron) — nightly regression
  schedule:
    - cron: '0 2 * * *'      # Every day at 2 AM UTC
    - cron: '0 */6 * * *'    # Every 6 hours

  # Manual trigger with inputs
  workflow_dispatch:
    inputs:
      test_tag:
        description: 'Test tag to run (@smoke, @regression)'
        required: false
        default: ''
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
```

### Using manual inputs

```yaml
      - name: Run tests
        run: |
          TAG="${{ github.event.inputs.test_tag }}"
          if [ -n "$TAG" ]; then
            npx playwright test --grep "$TAG"
          else
            npx playwright test
          fi
```

---

## Multi-Browser CI

```yaml
    strategy:
      matrix:
        project: [chromium, firefox, webkit]
    steps:
      - run: npx playwright test --project=${{ matrix.project }}
```

---

## GitHub Secrets Setup

1. Go to **Repository Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add secrets:
   - `SAUCEDEMO_PASSWORD` = `secret_sauce`
   - `TEAMS_WEBHOOK_URL` = `https://...`
   - `JIRA_API_TOKEN` = `base64token`

```yaml
env:
  PASSWORD: ${{ secrets.SAUCEDEMO_PASSWORD }}
  TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  JIRA_API_URL: ${{ secrets.JIRA_API_URL }}
  JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```

---

## Config for CI vs Local

```javascript
// playwright.config.js
module.exports = defineConfig({
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 5,
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI
    ? [['blob'], ['./src/utils/CustomReporter.js']]
    : [['list'], ['html']],

  use: {
    trace: process.env.CI ? 'on-first-retry' : 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    video: process.env.CI ? 'on-first-retry' : 'off',
  },
});
```

---

## Caching for Faster CI

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'          # Caches node_modules

      # Cache Playwright browsers
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}

      - name: Install Playwright (only if cache miss)
        run: npx playwright install --with-deps
```

---

## Smoke Test on PR, Full Regression Nightly

```yaml
  smoke-tests:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep @smoke

  regression-tests:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep @regression
```

---

## Practice Exercises

1. Create `.github/workflows/playwright.yml` with the basic workflow above
2. Add GitHub Secrets for `SAUCEDEMO_PASSWORD` and reference it in the workflow
3. Implement 4-shard sharding with blob report merging
4. Add a scheduled nightly run for regression tests
5. Add a `workflow_dispatch` trigger with a test tag input

---

[Next: Docker & Containerization →](./27-docker.md)
