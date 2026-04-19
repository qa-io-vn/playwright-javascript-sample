# 18 — Emulation: Devices, Geolocation, Permissions

[← Previous: Multi-Tab & Dialogs](./17-multi-tab-frames-dialogs.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Trace Viewer →](./19-trace-viewer-debugging.md)

---

## What You Will Learn

- How to emulate mobile devices, tablets, and custom viewports
- How to set geolocation, locale, timezone, and color scheme
- How to grant/deny browser permissions
- How to emulate offline mode and slow networks

---

## Device Emulation

### Using built-in device profiles

```javascript
const { devices } = require('@playwright/test');

// In playwright.config.js
module.exports = defineConfig({
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
    { name: 'iPhone 13 landscape', use: { ...devices['iPhone 13 landscape'] } },
    { name: 'Pixel 5', use: { ...devices['Pixel 5'] } },
    { name: 'iPad Mini', use: { ...devices['iPad Mini'] } },
    { name: 'Galaxy S9+', use: { ...devices['Galaxy S9+'] } },
  ],
});
```

### Custom viewport

```javascript
// In config
use: {
  viewport: { width: 1920, height: 1080 },
}

// Per test
test('custom viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  // Page renders at iPhone X size
});
```

### See all available devices

```bash
npx playwright show-devices
```

---

## Geolocation

```javascript
// In config
use: {
  geolocation: { latitude: 40.7128, longitude: -74.0060 },  // New York
  permissions: ['geolocation'],
}

// Per test
test('geolocation test', async ({ context, page }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 }); // Paris

  await page.goto('/store-locator');
  await expect(page.getByText('Paris')).toBeVisible();

  // Change location mid-test
  await context.setGeolocation({ latitude: 35.6762, longitude: 139.6503 }); // Tokyo
  await page.reload();
  await expect(page.getByText('Tokyo')).toBeVisible();
});
```

---

## Locale and Timezone

```javascript
// In config
use: {
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
}

// Per test
test('French locale formatting', async ({ page }) => {
  await page.goto('/');
  // Dates will display as DD/MM/YYYY
  // Numbers will use comma as decimal separator (1.234,56)
});

// Test multiple locales
const locales = ['en-US', 'fr-FR', 'ja-JP', 'ar-SA'];
for (const locale of locales) {
  test(`date format in ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto('/');
    // Verify locale-specific formatting
    await context.close();
  });
}
```

---

## Color Scheme (Dark/Light Mode)

```javascript
// In config
use: {
  colorScheme: 'dark',
}

// Per test
test('dark mode renders correctly', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  // Verify dark mode styles
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
});

test('light mode renders correctly', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

// Reduced motion
test('respects reduced motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Animations should be disabled
});
```

---

## Browser Permissions

```javascript
test('notification permission', async ({ context, page }) => {
  // Grant permissions
  await context.grantPermissions(['notifications']);

  // Available permissions:
  // 'geolocation', 'midi', 'midi-sysex', 'notifications',
  // 'camera', 'microphone', 'background-sync', 'ambient-light-sensor',
  // 'accelerometer', 'gyroscope', 'magnetometer', 'clipboard-read',
  // 'clipboard-write', 'payment-handler'

  await page.goto('/');
  // App can now send notifications

  // Revoke permissions
  await context.clearPermissions();
});
```

---

## Offline Mode

```javascript
test('app works offline', async ({ context, page }) => {
  await page.goto('/');
  // Load the app first, then go offline

  await context.setOffline(true);

  // Test offline behavior
  await page.locator('#create-note').click();
  await page.locator('#note-input').fill('Offline note');
  await expect(page.getByText('Saved locally')).toBeVisible();

  // Come back online
  await context.setOffline(false);
  await expect(page.getByText('Synced')).toBeVisible();
});
```

---

## User Agent

```javascript
// In config
use: {
  userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
}

// Per test
test('SEO - Googlebot view', async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
  });
  const page = await context.newPage();
  await page.goto('/');
  // Verify bot-accessible content
  await context.close();
});
```

---

## JavaScript Disabled

```javascript
test('page works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto('/');

  // Verify server-rendered content is visible
  await expect(page.locator('h1')).toBeVisible();

  await context.close();
});
```

---

## Practice Exercises

1. Add iPhone 13 and Pixel 5 projects to your config and run tests on them
2. Write a test that emulates dark mode and takes a screenshot
3. Test SauceDemo with `locale: 'ja-JP'` and see how the page renders
4. Write a test that goes offline after loading and verifies error handling
5. Emulate a Googlebot user agent and check if the page is SEO-friendly

---

[Next: Trace Viewer & Debugging →](./19-trace-viewer-debugging.md)
