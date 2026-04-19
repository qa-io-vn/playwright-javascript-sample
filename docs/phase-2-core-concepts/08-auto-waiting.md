# 08 — Auto-Waiting & Actionability

[← Previous: Assertions](./07-assertions.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Page Object Model →](../phase-3-intermediate/09-page-object-model.md)

---

## What You Will Learn

- How Playwright automatically waits for elements before acting
- The actionability checks performed for each action type
- How to handle edge cases where auto-waiting isn't enough
- Why Playwright eliminates most flaky tests by design

---

## The Core Principle

**Playwright waits automatically.** You almost never need `waitForTimeout`, `sleep`, or explicit waits.

When you write:
```javascript
await page.locator('#submit').click();
```

Playwright internally does this before clicking:

1. **Attached** — Is the element in the DOM?
2. **Visible** — Does it have non-zero size? Is it not `display:none`?
3. **Stable** — Has the element stopped moving? (no animations in progress)
4. **Receives Events** — Is anything covering it? (no overlays, modals blocking it)
5. **Enabled** — Does it lack the `disabled` attribute?

Only after ALL checks pass does Playwright perform the click.

---

## Actionability Checks Per Action

| Action | Attached | Visible | Stable | Receives Events | Enabled |
|---|:---:|:---:|:---:|:---:|:---:|
| `click()` | Yes | Yes | Yes | Yes | Yes |
| `dblclick()` | Yes | Yes | Yes | Yes | Yes |
| `hover()` | Yes | Yes | Yes | Yes | — |
| `check()` / `uncheck()` | Yes | Yes | Yes | Yes | Yes |
| `fill()` | Yes | Yes | — | — | Yes |
| `clear()` | Yes | Yes | — | — | Yes |
| `selectOption()` | Yes | Yes | — | — | Yes |
| `press()` | Yes | — | — | — | — |
| `setInputFiles()` | Yes | — | — | — | — |
| `focus()` | Yes | — | — | — | — |
| `textContent()` | Yes | — | — | — | — |
| `getAttribute()` | Yes | — | — | — | — |
| `isVisible()` | — | — | — | — | — |
| `isEnabled()` | — | — | — | — | — |

### What this means

- `click()` has the most checks — it needs the element to be fully interactive
- `fill()` doesn't check "receives events" — it clears and sets the value directly
- `textContent()` only needs the element to be in the DOM — doesn't need to be visible
- `isVisible()` checks nothing — it just returns true/false

---

## Auto-Retry in Assertions

Web-first assertions retry automatically:

```javascript
// This retries for up to 5 seconds (default expect timeout)
await expect(page.locator('.result')).toHaveText('Success');
```

What happens internally:
```
  t=0ms     Check text... "Loading..." → doesn't match → retry
  t=100ms   Check text... "Loading..." → doesn't match → retry
  t=200ms   Check text... "Processing" → doesn't match → retry
  t=800ms   Check text... "Success"    → MATCH → pass!
```

If it never matches within the timeout:
```
  t=5000ms  TIMEOUT → assertion fails with "Expected: Success, Received: Processing"
```

---

## When Auto-Waiting Isn't Enough

### Scenario 1: Waiting for a network request to complete

```javascript
// Wait for a specific API call to finish before continuing
const responsePromise = page.waitForResponse('**/api/products');
await page.locator('#load-products').click();
const response = await responsePromise;
expect(response.status()).toBe(200);
```

### Scenario 2: Waiting for navigation after a click

```javascript
// Wait for URL to change after clicking
await page.locator('a.checkout').click();
await page.waitForURL('**/checkout.html');
```

### Scenario 3: Waiting for element to disappear

```javascript
// Wait for loading spinner to go away
await page.locator('.spinner').waitFor({ state: 'hidden' });
// Now the content is ready
await expect(page.locator('.data')).toBeVisible();
```

### Scenario 4: Waiting for a condition in JavaScript

```javascript
// Wait for a global variable to be set
await page.waitForFunction(() => window.appReady === true);

// Wait for element count to reach a threshold
await page.waitForFunction(
  () => document.querySelectorAll('.item').length >= 10
);
```

### Scenario 5: Waiting for load state

```javascript
// Wait for all network requests to finish
await page.waitForLoadState('networkidle');

// Wait for DOM to be fully parsed
await page.waitForLoadState('domcontentloaded');
```

---

## The Anti-Pattern: Hard Waits

```javascript
// TERRIBLE — waits 3 seconds EVERY time, even if element appears in 100ms
await page.waitForTimeout(3000);
await page.locator('.result').click();

// GOOD — waits only until element is ready (could be 50ms or 4999ms)
await page.locator('.result').click();

// TERRIBLE — arbitrary sleep before assertion
await page.waitForTimeout(2000);
const text = await page.locator('.status').textContent();
expect(text).toBe('Done');

// GOOD — auto-retrying assertion, waits exactly as long as needed
await expect(page.locator('.status')).toHaveText('Done');
```

### Why hard waits are bad

1. **Too short** = flaky tests (sometimes the app needs 3.5s, not 3s)
2. **Too long** = slow test suite (3s × 500 tests = 25 minutes of sleeping)
3. **Environment-dependent** = works on your fast machine, fails on slow CI

---

## Forcing Actions (Skip Checks)

Sometimes Playwright's checks prevent a valid action. Use `force: true` sparingly:

```javascript
// Element is covered by a transparent overlay but you know it's clickable
await page.locator('#hidden-submit').click({ force: true });

// Element has zero size but is still interactive
await page.locator('.icon').click({ force: true });
```

**Warning:** Using `force: true` means you're skipping safety checks. If the test breaks, you lose Playwright's protection.

---

## Timeout Hierarchy Recap

```
playwright.config.js
│
├── timeout: 60000                    # Per test (entire test function)
│
├── expect: { timeout: 5000 }        # Per expect() assertion auto-retry
│
└── use:
    ├── actionTimeout: 0             # Per action (click, fill) — 0 means use test timeout
    └── navigationTimeout: 0          # Per navigation (goto) — 0 means use test timeout
```

Override per-assertion:
```javascript
await expect(locator).toBeVisible({ timeout: 15000 });
```

Override per-action:
```javascript
await locator.click({ timeout: 10000 });
```

---

## Practice Exercises

1. Write a test that logs in, then uses `waitFor({ state: 'hidden' })` on the login form to confirm it's gone
2. Write a test that clicks a sort dropdown and uses `waitForFunction` to verify the DOM updated
3. Intentionally use `waitForTimeout(10000)` and measure how much slower the test becomes vs. using auto-wait
4. Write a test that uses `waitForResponse` to intercept the page load and verify the HTTP status code
5. Write a test that demonstrates `force: true` on an element covered by another element

---

[Next: Page Object Model (POM) →](../phase-3-intermediate/09-page-object-model.md)
