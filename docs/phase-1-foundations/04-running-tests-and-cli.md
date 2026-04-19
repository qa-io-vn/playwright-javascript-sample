# 04 — Running Tests & CLI

[← Previous: Config File](./03-playwright-config.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Locators →](../phase-2-core-concepts/05-locators.md)

---

## What You Will Learn

- Every useful Playwright CLI command
- How to filter, debug, and control test execution
- How to use tags/grep to run specific test suites
- How to read and use the HTML report

---

## Essential CLI Commands

### Run all tests

```bash
npx playwright test
```

### Run a specific file

```bash
npx playwright test src/tests/auth.spec.js
```

### Run tests matching a name pattern

```bash
# Run tests whose title contains "login"
npx playwright test -g "login"

# Run tests tagged @smoke (as used in this project)
npx playwright test --grep @smoke

# Run tests tagged @regression
npx playwright test --grep @regression

# Run tests NOT tagged @smoke (inverse)
npx playwright test --grep-invert @smoke
```

### Run a specific project (browser)

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project="mobile-chrome"
```

### Control parallelism

```bash
# Run with 1 worker (sequential — good for debugging)
npx playwright test --workers=1

# Run with 10 workers
npx playwright test --workers=10

# Run with 50% of CPU cores
npx playwright test --workers='50%'
```

### Run in headed mode (visible browser)

```bash
npx playwright test --headed
npx playwright test --headed --slowmo=500    # 500ms delay between actions
```

---

## Debugging Commands

### Interactive debugger

```bash
npx playwright test --debug
npx playwright test src/tests/auth.spec.js --debug
```

Opens the **Playwright Inspector** — step through each line, see the browser, inspect elements.

### UI Mode (the best debugging tool)

```bash
npx playwright test --ui
```

Opens a graphical interface where you can:
- See all tests in a tree view
- Run individual tests with one click
- Watch the test execute in real time
- See DOM snapshots at each step
- Time-travel through the test execution
- Filter by status (passed/failed/skipped)

### Trace viewer

```bash
# After a test fails and trace was recorded:
npx playwright show-trace test-results/path-to-trace.zip
```

Or open [trace.playwright.dev](https://trace.playwright.dev) and drag the zip file there.

---

## Reporter Options

### Use a specific reporter from CLI

```bash
# Line reporter (compact, one line per test)
npx playwright test --reporter=line

# List reporter (detailed, shows each step)
npx playwright test --reporter=list

# Dot reporter (minimal, just dots)
npx playwright test --reporter=dot

# HTML reporter (generates browsable report)
npx playwright test --reporter=html

# JSON reporter (machine-readable output)
npx playwright test --reporter=json

# JUnit reporter (for CI tools like Jenkins)
npx playwright test --reporter=junit
```

### Open the HTML report

```bash
npx playwright show-report
```

---

## Our Project's npm Scripts

These are shortcuts defined in `package.json`:

```bash
# Run all tests + generate + open Allure report
npm test

# Run only @smoke tests
npm run test:smoke

# Run only @sanity tests
npm run test:sanity

# Run only @regression tests
npm run test:regression

# Run only @e2e tests
npm run test:e2e

# Generate Allure report from results
npm run report:generate

# Open Allure report in browser
npm run report:open
```

### How tags work in this project

Tests use tags in their names:

```javascript
// auth.spec.js
test('Login: Success for standard_user (valid) @sanity', async ({ ... }) => {
//                                              ↑ tag in title

// purchase_flow.spec.js  
test('Purchase: Complete Flow for Sauce Labs Backpack @smoke', async ({ ... }) => {
//                                                    ↑ tag in title
```

`--grep @smoke` searches test titles for the string `@smoke`.

### Tag strategy for a professional project

| Tag | When to Run | Purpose |
|---|---|---|
| `@smoke` | Every commit, every PR | Critical path only (login, checkout) — runs fast |
| `@sanity` | Every deploy to staging | Core features work — medium coverage |
| `@regression` | Nightly build | Full coverage — catches edge cases |
| `@e2e` | Pre-release | End-to-end business flows |

---

## Useful CLI Flags — Complete Reference

| Flag | Description | Example |
|---|---|---|
| `--headed` | Show the browser | `--headed` |
| `--debug` | Open inspector | `--debug` |
| `--ui` | Open UI mode | `--ui` |
| `--workers=N` | Set parallel workers | `--workers=1` |
| `--retries=N` | Override retry count | `--retries=3` |
| `--timeout=N` | Override test timeout (ms) | `--timeout=120000` |
| `--grep` | Filter by test name | `--grep "login"` |
| `--grep-invert` | Exclude by test name | `--grep-invert @slow` |
| `--project=NAME` | Run specific browser | `--project=firefox` |
| `--reporter=TYPE` | Set reporter | `--reporter=html` |
| `--repeat-each=N` | Run each test N times | `--repeat-each=3` |
| `--shard=X/Y` | Run shard X of Y | `--shard=1/4` |
| `--update-snapshots` | Update visual snapshots | `--update-snapshots` |
| `--pass-with-no-tests` | Don't fail if no tests match | `--pass-with-no-tests` |
| `--list` | List all tests without running | `--list` |
| `--last-failed` | Re-run only failed tests | `--last-failed` |
| `--output=DIR` | Set output directory | `--output=results` |
| `--config=FILE` | Use a specific config | `--config=pw.ci.config.js` |
| `--slowmo=N` | Slow down actions by N ms | `--slowmo=1000` |

---

## Combining Flags — Real-World Scenarios

```bash
# Debug a single failing test, headed, slow
npx playwright test -g "locked out" --headed --debug --slowmo=500

# Run smoke tests on Firefox only
npx playwright test --grep @smoke --project=firefox

# Run all tests 3 times to find flaky ones
npx playwright test --repeat-each=3

# List all test names without running
npx playwright test --list

# Re-run only the tests that failed last time
npx playwright test --last-failed

# Run shard 1 of 4 (for CI matrix)
npx playwright test --shard=1/4
```

---

## Practice Exercises

1. Run `npx playwright test --list` to see all tests in the project
2. Run only `@smoke` tests with `npm run test:smoke`
3. Use `--ui` mode to explore the test suite visually
4. Run a single test with `--debug` and step through every line
5. Use `--repeat-each=5` on a test to check if it's flaky
6. Generate and view the HTML report with `--reporter=html` and `npx playwright show-report`

---

[Next: Locators — Finding Elements the Right Way →](../phase-2-core-concepts/05-locators.md)
