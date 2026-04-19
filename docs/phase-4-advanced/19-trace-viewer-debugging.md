# 19 — Trace Viewer & Debugging

[← Previous: Emulation](./18-emulation.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: SOLID Principles →](../phase-5-framework-engineering/20-solid-principles.md)

---

## What You Will Learn

- How to use Playwright's Trace Viewer to debug failures
- All debugging tools: Inspector, UI Mode, VS Code integration
- How to configure trace, screenshot, and video recording
- How to read and interpret trace files

---

## Trace Viewer — The Ultimate Debugging Tool

A trace is a recording of everything that happened during a test:
- Every action (click, fill, navigate)
- DOM snapshots before and after each action
- Network requests and responses
- Console logs
- Screenshots at each step

### Configure trace recording

```javascript
// playwright.config.js
use: {
  trace: 'on-first-retry',     // Record trace only when a test fails and retries
}
```

| Option | Description |
|---|---|
| `'off'` | Never record traces |
| `'on'` | Always record (generates large files) |
| `'on-first-retry'` | Record only on first retry after failure (recommended) |
| `'retain-on-failure'` | Record always, but only keep traces for failed tests |
| `'on-all-retries'` | Record on every retry attempt |

### View a trace

```bash
# After a test fails, trace is saved in test-results/
npx playwright show-trace test-results/test-name/trace.zip
```

Or open [trace.playwright.dev](https://trace.playwright.dev) in a browser and drag the ZIP file.

### What you see in the Trace Viewer

1. **Timeline** — Visual timeline of every action
2. **Actions tab** — List of every step with duration
3. **Before/After** — DOM snapshot before and after each action
4. **Source** — The exact line of test code for each step
5. **Network** — Every HTTP request/response
6. **Console** — Browser console output
7. **Call** — Detailed info about the action (locator, options, timing)

---

## Screenshots

### Configure screenshot capture

```javascript
// playwright.config.js
use: {
  screenshot: 'only-on-failure',
}
```

| Option | Description |
|---|---|
| `'off'` | No automatic screenshots |
| `'on'` | Screenshot after every test |
| `'only-on-failure'` | Screenshot only when test fails (recommended) |

### Manual screenshots in tests

```javascript
test('take manual screenshot', async ({ page }) => {
  await page.goto('/');

  // Save to file
  await page.screenshot({ path: 'test-results/homepage.png' });

  // Full page screenshot (includes scroll)
  await page.screenshot({ path: 'test-results/full.png', fullPage: true });

  // Screenshot of specific element
  await page.locator('.header').screenshot({ path: 'test-results/header.png' });

  // Attach to test report
  const screenshot = await page.screenshot();
  await test.info().attach('screenshot', {
    body: screenshot,
    contentType: 'image/png',
  });
});
```

---

## Video Recording

```javascript
// playwright.config.js
use: {
  video: 'on-first-retry',
}
```

| Option | Description |
|---|---|
| `'off'` | No video |
| `'on'` | Record video for every test |
| `'on-first-retry'` | Record only on retry (recommended) |
| `'retain-on-failure'` | Record always, keep only for failures |

### Video size

```javascript
use: {
  video: {
    mode: 'on-first-retry',
    size: { width: 1280, height: 720 },
  },
}
```

Videos are saved as `.webm` files in `test-results/`.

---

## Playwright Inspector (Step-Through Debugger)

```bash
npx playwright test --debug
npx playwright test src/tests/auth.spec.js --debug
```

### Features

- **Step Over** — Execute one action at a time
- **Resume** — Run to the next breakpoint or end
- **Pick Locator** — Click any element to get the best locator string
- **Browser highlights** — See exactly which element each action targets
- **Call log** — See what Playwright is doing internally

### Programmatic breakpoints

```javascript
test('debug specific point', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill('user');

  await page.pause();  // Opens the Inspector at this exact line

  await page.locator('#password').fill('pass');
});
```

---

## UI Mode — Interactive Test Explorer

```bash
npx playwright test --ui
```

### Features

- **Test tree** — Browse all tests organized by file/describe
- **Run individual tests** with one click
- **Watch mode** — Re-run on file changes
- **Time travel** — Click any action to see the DOM at that point
- **Filter** — Show only passed/failed/skipped tests
- **Source view** — See test code alongside execution

---

## VS Code Integration

### Setup

1. Install the **Playwright Test for VS Code** extension
2. Open the Testing sidebar (beaker icon)
3. Click the play button next to any test

### Features

- **Run/Debug** individual tests from the editor
- **Show browser** — Watch execution in real time
- **Pick locator** — Click elements in the browser to get locators
- **Record tests** — Generate test code from browser interactions
- **Show trace** — Open trace viewer for failed tests

### Debug with breakpoints

1. Set a breakpoint in VS Code (click left of line number)
2. Right-click a test → "Debug Test"
3. Execution stops at your breakpoint
4. Use VS Code's debugger: step over, step into, inspect variables

---

## Console Logging

### Capture browser console output

```javascript
test('monitor console', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.log(`BROWSER ERROR: ${error.message}`);
  });

  await page.goto('/');
});
```

### Attach console logs to report

```javascript
test('capture console', async ({ page }, testInfo) => {
  const logs = [];

  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('/');
  // ... test actions ...

  await testInfo.attach('browser-console', {
    body: logs.join('\n'),
    contentType: 'text/plain',
  });
});
```

---

## Debugging Checklist

When a test fails:

1. **Read the error message** — What assertion failed? What was expected vs received?
2. **Check the screenshot** — Look in `test-results/` for the failure screenshot
3. **Open the trace** — `npx playwright show-trace test-results/.../trace.zip`
4. **Check network tab in trace** — Did an API call fail? Wrong response?
5. **Check the DOM snapshot** — Was the element there? Was it hidden?
6. **Run with `--debug`** — Step through the test to find the exact failing line
7. **Run with `--ui`** — Time-travel through the test
8. **Add `page.pause()`** — Stop at a specific point and inspect the browser

---

## Our Project's Debug Configuration

```javascript
// playwright.config.js (current settings)
use: {
  trace: 'on-first-retry',        // Trace on failure retry
  screenshot: 'only-on-failure',   // Screenshot on failure
  video: 'on-first-retry',        // Video on failure retry
},
retries: process.env.CI ? 2 : 0,  // Retries only in CI
```

This means:
- **Locally:** No retries, so no traces/videos. Use `--debug` or `--ui` instead.
- **In CI:** If a test fails, it retries with trace + video recording. Artifacts are saved.

---

## Practice Exercises

1. Run a test with `--debug` and use "Pick Locator" to find 5 elements on SauceDemo
2. Add `page.pause()` in the middle of a test and inspect the page state
3. Set `trace: 'on'` and run a test, then open the trace viewer and explore every tab
4. Set `video: 'on'` and run a test, then find and watch the recorded video
5. Run `npx playwright test --ui` and use time-travel to step through a purchase flow

---

[Next: SOLID Principles in Test Automation →](../phase-5-framework-engineering/20-solid-principles.md)
