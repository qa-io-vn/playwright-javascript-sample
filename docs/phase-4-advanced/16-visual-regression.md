# 16 — Visual Regression Testing

[← Previous: API Testing](./15-api-testing.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Multi-Tab, Frames & Dialogs →](./17-multi-tab-frames-dialogs.md)

---

## What You Will Learn

- How to detect pixel-level UI changes with screenshot comparison
- How to set up, update, and manage visual snapshots
- How to handle dynamic content in visual tests
- Configuration options: thresholds, masks, full-page screenshots

---

## The Concept

Visual regression testing takes a screenshot of your page and compares it against a **baseline** (previously saved "golden" image). If any pixels differ, the test fails.

```
Baseline (saved)     Current (live)       Diff (generated)
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Login Page  │    │  Login Page  │    │              │
│  [Username]  │ vs │  [Username]  │ =  │   ██ DIFF    │
│  [Password]  │    │  [Pasword]   │    │   ██ HERE    │
│  [Login Btn] │    │  [Login Btn] │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

Catches things functional tests cannot:
- Button moved 5 pixels
- Font changed
- Color wrong
- Layout shifted
- CSS regression

---

## Basic Visual Test

### Full page screenshot comparison

```javascript
test('login page visual check', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
  await expect(page).toHaveScreenshot();
});
```

### First run — creates the baseline

```bash
npx playwright test --update-snapshots
```

This creates:
```
src/tests/visual.spec.js-snapshots/
  login-page-visual-check-1-chromium-darwin.png
```

### Subsequent runs — compares against baseline

```bash
npx playwright test
```

If pixels differ → test fails with a diff image in `test-results/`.

---

## Element-Level Screenshots

```javascript
test('login button looks correct', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');

  // Screenshot of a specific element
  await expect(page.locator('[data-test="login-button"]')).toHaveScreenshot();
});

test('product card looks correct', async ({ page }) => {
  await page.goto('/inventory.html');
  await expect(page.locator('[data-test="inventory-item"]').first()).toHaveScreenshot();
});
```

---

## Configuration Options

### Custom name

```javascript
await expect(page).toHaveScreenshot('login-page.png');
```

### Pixel threshold

```javascript
// Allow 5% of pixels to differ (handles anti-aliasing)
await expect(page).toHaveScreenshot({
  maxDiffPixelRatio: 0.05,    // 5% of total pixels
});

// Allow specific pixel count to differ
await expect(page).toHaveScreenshot({
  maxDiffPixels: 100,          // Up to 100 pixels can differ
});

// Threshold per pixel (color sensitivity)
await expect(page).toHaveScreenshot({
  threshold: 0.3,              // 0-1, higher = more tolerant of color changes
});
```

### Full page screenshot

```javascript
await expect(page).toHaveScreenshot({
  fullPage: true,   // Captures entire scrollable page, not just viewport
});
```

### Masking dynamic content

```javascript
test('inventory page visual', async ({ page }) => {
  await page.goto('/inventory.html');

  await expect(page).toHaveScreenshot({
    mask: [
      page.locator('.shopping_cart_badge'),     // Cart count changes
      page.locator('[data-test="footer"]'),     // Footer might have timestamp
    ],
  });
});
```

Masked elements are replaced with a pink box in the screenshot, so changes there don't cause failures.

### Animation handling

```javascript
await expect(page).toHaveScreenshot({
  animations: 'disabled',     // Stops all CSS animations before capturing
});
```

---

## Global Config for Visual Tests

```javascript
// playwright.config.js
module.exports = defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2,
      animations: 'disabled',
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  use: {
    // Fix viewport for consistent screenshots
    viewport: { width: 1280, height: 720 },
  },
});
```

---

## Updating Baselines

```bash
# Update ALL baselines
npx playwright test --update-snapshots

# Update baselines for specific tests only
npx playwright test src/tests/visual.spec.js --update-snapshots
```

### When to update baselines

- After an **intentional** UI change (new design, updated layout)
- After changing viewport size in config
- After upgrading browsers (rendering might change slightly)

### Snapshot file organization

```
src/tests/visual.spec.js-snapshots/
├── login-page-1-chromium-darwin.png      # Mac + Chrome
├── login-page-1-chromium-linux.png       # Linux + Chrome (CI)
├── login-page-1-firefox-darwin.png       # Mac + Firefox
└── login-page-1-webkit-darwin.png        # Mac + Safari
```

Each browser + OS combination gets its own baseline because rendering differs.

---

## Handling Cross-Platform Differences

Since screenshots differ between Mac/Linux/Windows:

```javascript
// Option 1: Use threshold
await expect(page).toHaveScreenshot({
  maxDiffPixelRatio: 0.1,    // Allow 10% difference
});

// Option 2: Run visual tests only on CI (consistent Linux env)
test('visual check', async ({ page }) => {
  test.skip(!process.env.CI, 'Visual tests only run on CI for consistency');
  await expect(page).toHaveScreenshot();
});

// Option 3: Use Docker (same env everywhere)
// See Phase 6 — Docker
```

---

## Complete Visual Test Suite Example

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {

  test('login page', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    await expect(page).toHaveScreenshot('login-page.png', {
      animations: 'disabled',
    });
  });

  test('inventory page', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();

    await expect(page).toHaveScreenshot('inventory-page.png', {
      mask: [page.locator('.shopping_cart_badge')],
      fullPage: true,
    });
  });

  test('cart page', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await page.locator('button[id^="add-to-cart"]').first().click();
    await page.locator('[data-test="shopping-cart-link"]').click();

    await expect(page).toHaveScreenshot('cart-page.png');
  });
});
```

---

## Practice Exercises

1. Create a visual test for the SauceDemo login page and generate the baseline
2. Add `mask` to hide the cart badge in an inventory page visual test
3. Change the viewport to `1920x1080` and regenerate baselines — observe the difference
4. Intentionally break a visual test (e.g., inject CSS via `page.addStyleTag`) and examine the diff image
5. Set up visual tests to run only on CI with `test.skip(!process.env.CI)`

---

[Next: Multi-Tab, Frames, Dialogs & Downloads →](./17-multi-tab-frames-dialogs.md)
