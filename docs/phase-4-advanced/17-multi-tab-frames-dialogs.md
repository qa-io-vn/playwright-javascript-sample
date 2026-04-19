# 17 — Multi-Tab, Frames, Dialogs & Downloads

[← Previous: Visual Regression](./16-visual-regression.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Emulation →](./18-emulation.md)

---

## What You Will Learn

- How to handle multiple browser tabs/windows
- How to interact with iframes (inline frames)
- How to handle JavaScript dialogs (alert, confirm, prompt)
- How to handle file downloads
- How to execute JavaScript in the browser context

---

## Multi-Tab / Multi-Window

### Opening a new tab from a link click

```javascript
test('handle new tab', async ({ context, page }) => {
  await page.goto('https://www.saucedemo.com');

  // Listen for new page (tab) BEFORE clicking
  const newPagePromise = context.waitForEvent('page');
  await page.locator('a[target="_blank"]').click();
  const newPage = await newPagePromise;

  // Wait for the new tab to load
  await newPage.waitForLoadState();

  // Now interact with the new tab
  await expect(newPage).toHaveURL(/.*about/);
  await expect(newPage.locator('h1')).toHaveText('About');

  // Go back to original tab
  await page.bringToFront();
  await expect(page).toHaveURL(/.*saucedemo/);
});
```

### Working with multiple tabs

```javascript
test('switch between tabs', async ({ context }) => {
  // Create tabs manually
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await page1.goto('https://www.saucedemo.com');
  await page2.goto('https://www.google.com');

  // List all pages in the context
  const pages = context.pages();
  console.log(`Open tabs: ${pages.length}`);  // 2

  // Interact with each tab
  await expect(page1).toHaveTitle('Swag Labs');
  await expect(page2).toHaveTitle(/Google/);

  // Close a tab
  await page2.close();
});
```

### Popup windows

```javascript
test('handle popup window', async ({ page }) => {
  const popupPromise = page.waitForEvent('popup');
  await page.locator('#open-popup').click();
  const popup = await popupPromise;

  await popup.waitForLoadState();
  await expect(popup).toHaveTitle('Popup Window');

  // Interact with popup
  await popup.locator('#popup-button').click();
  await popup.close();
});
```

---

## Frames (iframes)

### Access an iframe

```javascript
test('interact with iframe', async ({ page }) => {
  await page.goto('/page-with-iframe');

  // Method 1: By frame locator (recommended)
  const frame = page.frameLocator('#my-iframe');
  await frame.locator('#email').fill('test@example.com');
  await frame.locator('#submit').click();

  // Method 2: By frame name
  const namedFrame = page.frame('frame-name');
  await namedFrame.locator('#button').click();

  // Method 3: By URL
  const urlFrame = page.frame({ url: /.*payment/ });
  await urlFrame.locator('#card-number').fill('4111111111111111');
});
```

### Nested iframes

```javascript
test('nested iframes', async ({ page }) => {
  const outerFrame = page.frameLocator('#outer-iframe');
  const innerFrame = outerFrame.frameLocator('#inner-iframe');

  await innerFrame.locator('#deep-button').click();
});
```

### Frame assertions

```javascript
test('verify iframe content', async ({ page }) => {
  const frame = page.frameLocator('#content-frame');

  await expect(frame.locator('h1')).toHaveText('Embedded Content');
  await expect(frame.locator('.items')).toHaveCount(5);
});
```

---

## JavaScript Dialogs

### Alert dialog

```javascript
test('handle alert', async ({ page }) => {
  // Set up dialog handler BEFORE triggering it
  page.on('dialog', async dialog => {
    console.log(dialog.message());     // 'Hello World!'
    console.log(dialog.type());        // 'alert'
    await dialog.accept();             // Click OK
  });

  await page.locator('#trigger-alert').click();
});
```

### Confirm dialog

```javascript
test('handle confirm - accept', async ({ page }) => {
  page.on('dialog', async dialog => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toBe('Are you sure?');
    await dialog.accept();    // Click OK
  });

  await page.locator('#delete-button').click();
  await expect(page.getByText('Item deleted')).toBeVisible();
});

test('handle confirm - dismiss', async ({ page }) => {
  page.on('dialog', async dialog => {
    await dialog.dismiss();   // Click Cancel
  });

  await page.locator('#delete-button').click();
  await expect(page.getByText('Item deleted')).not.toBeVisible();
});
```

### Prompt dialog

```javascript
test('handle prompt', async ({ page }) => {
  page.on('dialog', async dialog => {
    expect(dialog.type()).toBe('prompt');
    expect(dialog.defaultValue()).toBe('');
    await dialog.accept('My answer');    // Type text and click OK
  });

  await page.locator('#ask-name').click();
  await expect(page.getByText('Hello, My answer')).toBeVisible();
});
```

### One-time dialog handler

```javascript
test('handle single dialog', async ({ page }) => {
  // Use once() instead of on() for a single dialog
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#trigger').click();
});
```

---

## File Downloads

### Download a file

```javascript
test('download file', async ({ page }) => {
  // Start waiting for download BEFORE clicking
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-pdf').click();
  const download = await downloadPromise;

  // Verify download info
  console.log(download.suggestedFilename());  // 'report.pdf'
  console.log(download.url());                // Download URL

  // Save to a specific path
  await download.saveAs('/tmp/downloaded-report.pdf');

  // Get download as readable stream
  const stream = await download.createReadStream();

  // Get download path (temporary)
  const path = await download.path();

  // Verify file was downloaded
  const fs = require('fs');
  expect(fs.existsSync('/tmp/downloaded-report.pdf')).toBeTruthy();
});
```

### Download without triggering a click

```javascript
test('download via direct URL', async ({ page, context }) => {
  // For downloads that happen via JavaScript or redirects
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = '/files/report.pdf';
    link.download = 'report.pdf';
    link.click();
  });
  const download = await downloadPromise;
  await download.saveAs('test-results/report.pdf');
});
```

---

## Evaluating JavaScript

### Execute JS in the browser

```javascript
test('execute JavaScript', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');

  // Simple evaluation
  const title = await page.evaluate(() => document.title);
  expect(title).toBe('Swag Labs');

  // Return complex data
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollY: window.scrollY,
  }));

  // Pass arguments to the browser
  const text = await page.evaluate(
    (selector) => document.querySelector(selector).textContent,
    '[data-test="login-button"]'
  );
  expect(text).toBe('Login');

  // Modify the DOM
  await page.evaluate(() => {
    document.body.style.backgroundColor = 'red';
  });

  // Access localStorage
  await page.evaluate(() => {
    localStorage.setItem('test-key', 'test-value');
  });
  const value = await page.evaluate(() => localStorage.getItem('test-key'));
  expect(value).toBe('test-value');
});
```

### Evaluate on a specific element

```javascript
test('evaluate on element', async ({ page }) => {
  const button = page.locator('[data-test="login-button"]');

  const text = await button.evaluate(el => el.textContent);
  const rect = await button.evaluate(el => el.getBoundingClientRect());
  const styles = await button.evaluate(el => getComputedStyle(el).color);
});
```

### Add a script to the page

```javascript
test('inject script', async ({ page }) => {
  await page.addScriptTag({
    content: 'window.myHelper = () => "hello";',
  });

  const result = await page.evaluate(() => window.myHelper());
  expect(result).toBe('hello');
});
```

---

## Practice Exercises

1. Write a test that opens the SauceDemo "About" link (if it opens in a new tab) and verifies both tabs
2. Create a test that handles a JavaScript `confirm` dialog — test both Accept and Dismiss paths
3. Write a test that injects CSS into the SauceDemo page to change the header color and take a screenshot
4. Write a test that reads `localStorage` and `sessionStorage` after login
5. Write a test that uses `page.evaluate` to count all visible elements on the inventory page

---

[Next: Emulation — Devices, Geolocation, Permissions →](./18-emulation.md)
