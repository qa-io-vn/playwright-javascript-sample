# 06 — Actions: Clicking, Typing, Selecting

[← Previous: Locators](./05-locators.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Assertions →](./07-assertions.md)

---

## What You Will Learn

- Every action Playwright can perform on a page
- How auto-waiting works with actions
- Input handling: text, dropdowns, checkboxes, file uploads
- Mouse and keyboard actions
- Real examples from our SauceDemo project

---

## Navigation Actions

```javascript
// Go to a URL
await page.goto('https://www.saucedemo.com');
await page.goto('/inventory.html');              // Uses baseURL from config

// Go to URL and wait for specific state
await page.goto('/', { waitUntil: 'domcontentloaded' });
await page.goto('/', { waitUntil: 'networkidle' });    // Wait for no network activity

// Reload
await page.reload();

// Go back / forward (browser history)
await page.goBack();
await page.goForward();

// Wait for URL to change
await page.waitForURL('**/inventory.html');
await page.waitForURL(/.*checkout.*/);
```

### `waitUntil` options

| Value | Description | When to Use |
|---|---|---|
| `'load'` | Wait for `load` event (default) | Most cases |
| `'domcontentloaded'` | Wait for DOM to be parsed | Fast pages, SPAs |
| `'networkidle'` | Wait for no network requests for 500ms | Heavy pages with lots of API calls |
| `'commit'` | Wait for response headers received | Fastest, for quick checks |

---

## Click Actions

```javascript
// Basic click
await page.locator('[data-test="login-button"]').click();

// Double click
await page.locator('.item').dblclick();

// Right click (context menu)
await page.locator('.item').click({ button: 'right' });

// Click with modifier keys
await page.locator('a').click({ modifiers: ['Control'] });     // Ctrl+Click
await page.locator('a').click({ modifiers: ['Meta'] });        // Cmd+Click (Mac)
await page.locator('a').click({ modifiers: ['Shift'] });       // Shift+Click

// Click at specific position within element
await page.locator('.slider').click({ position: { x: 100, y: 10 } });

// Force click (skip actionability checks — use sparingly)
await page.locator('.hidden-button').click({ force: true });

// Click and wait for navigation
await Promise.all([
  page.waitForNavigation(),
  page.locator('a.nav-link').click(),
]);
```

### What happens before every click (Actionability)

Before Playwright clicks, it automatically:
1. Waits for element to be **attached** to DOM
2. Waits for element to be **visible**
3. Waits for element to be **stable** (not animating)
4. Waits for element to **receive events** (not blocked by overlay)
5. Waits for element to be **enabled** (not `disabled` attribute)
6. Scrolls element into view if needed

---

## Text Input Actions

```javascript
// fill() — Clears the field first, then types instantly
await page.locator('[data-test="username"]').fill('standard_user');

// type() — Types character by character (triggers keydown/keypress/keyup events)
await page.locator('#search').pressSequentially('laptop', { delay: 100 });

// Clear a field
await page.locator('#search').clear();

// fill() vs pressSequentially()
// fill()               → Fast, replaces entire value. Use for most form fields.
// pressSequentially()  → Slow, simulates real typing. Use when the app has
//                        keydown/keyup handlers (e.g., search autocomplete).
```

### How our project uses text input

```javascript
// From src/pages/BasePage.js
async type(selector, text) {
  await this.page.fill(selector, text);    // Uses fill() — clean and fast
}

// From src/pages/LoginPage.js
async login(username, password) {
  await this.type(this.usernameInput, username);  // fill username
  await this.type(this.passwordInput, password);  // fill password
  await this.click(this.loginButton);              // click login
}
```

---

## Dropdown / Select Actions

```javascript
// Select by value attribute
await page.locator('select').selectOption('az');

// Select by visible text (label)
await page.locator('select').selectOption({ label: 'Name (A to Z)' });

// Select by index (0-based)
await page.locator('select').selectOption({ index: 2 });

// Select multiple options (for multi-select)
await page.locator('select[multiple]').selectOption(['red', 'blue', 'green']);
```

### How our project uses dropdowns

```javascript
// From src/pages/InventoryPage.js
async sortItems(option) {
  await this.page.selectOption(this.sortDropdown, option);
}

// From src/tests/inventory.spec.js — called with value strings
await inventoryPage.sortItems('az');     // Name A-Z
await inventoryPage.sortItems('za');     // Name Z-A
await inventoryPage.sortItems('lohi');   // Price low-high
await inventoryPage.sortItems('hilo');   // Price high-low
```

---

## Checkbox and Radio Actions

```javascript
// Check a checkbox (no-op if already checked)
await page.getByRole('checkbox', { name: 'Terms' }).check();

// Uncheck a checkbox (no-op if already unchecked)
await page.getByRole('checkbox', { name: 'Terms' }).uncheck();

// Check if it's checked
const isChecked = await page.getByRole('checkbox').isChecked();

// Toggle regardless of current state
await page.getByRole('checkbox').setChecked(true);   // force check
await page.getByRole('checkbox').setChecked(false);  // force uncheck

// Radio button — same API
await page.getByRole('radio', { name: 'Express Shipping' }).check();
```

---

## File Upload

```javascript
// Upload a single file
await page.locator('input[type="file"]').setInputFiles('/path/to/file.pdf');

// Upload multiple files
await page.locator('input[type="file"]').setInputFiles([
  '/path/to/file1.pdf',
  '/path/to/file2.png'
]);

// Remove selected files
await page.locator('input[type="file"]').setInputFiles([]);

// Handle file chooser dialog
const fileChooserPromise = page.waitForEvent('filechooser');
await page.getByText('Upload').click();
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles('/path/to/file.pdf');
```

---

## Keyboard Actions

```javascript
// Press a single key
await page.keyboard.press('Enter');
await page.keyboard.press('Escape');
await page.keyboard.press('Tab');
await page.keyboard.press('Backspace');

// Key combinations
await page.keyboard.press('Control+a');     // Select all
await page.keyboard.press('Control+c');     // Copy
await page.keyboard.press('Control+v');     // Paste
await page.keyboard.press('Meta+a');        // Cmd+A on Mac

// Press a key on a specific element
await page.locator('#search').press('Enter');

// Hold a key
await page.keyboard.down('Shift');
await page.locator('#item1').click();
await page.locator('#item5').click();
await page.keyboard.up('Shift');            // Multi-select with Shift

// Type text directly
await page.keyboard.type('Hello World');
```

---

## Mouse Actions

```javascript
// Hover over element
await page.locator('.menu-item').hover();

// Drag and drop
await page.locator('#source').dragTo(page.locator('#target'));

// Manual drag (for custom drag implementations)
await page.locator('#slider').hover();
await page.mouse.down();
await page.mouse.move(100, 0);    // Move 100px right
await page.mouse.up();

// Scroll
await page.mouse.wheel(0, 500);   // Scroll down 500px

// Click at coordinates
await page.mouse.click(200, 300);
```

---

## Waiting for Elements

```javascript
// Wait for element to appear
await page.locator('.loading').waitFor({ state: 'visible' });

// Wait for element to disappear
await page.locator('.spinner').waitFor({ state: 'hidden' });

// Wait for element to be detached from DOM
await page.locator('.modal').waitFor({ state: 'detached' });

// Wait for element with timeout
await page.locator('.result').waitFor({ state: 'visible', timeout: 10000 });

// Wait for a specific condition
await page.waitForFunction(() => document.querySelectorAll('.item').length > 5);

// Wait for load state
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');
```

### IMPORTANT: No hard waits

```javascript
// NEVER DO THIS — fragile, wastes time
await page.waitForTimeout(5000);    // Sleeps 5 seconds regardless

// ALWAYS DO THIS — waits only as long as needed
await page.locator('.result').waitFor({ state: 'visible' });
await expect(page.locator('.result')).toBeVisible();
```

---

## Focus and Blur

```javascript
// Focus on an element
await page.locator('#email').focus();

// Blur (remove focus)
await page.locator('#email').blur();

// Check which element has focus
const focused = page.locator(':focus');
await expect(focused).toHaveAttribute('data-test', 'username');
```

---

## Getting Element Information (Read-Only)

```javascript
// Get text content
const text = await page.locator('.header').textContent();
const innerText = await page.locator('.header').innerText();

// Get input value
const value = await page.locator('input').inputValue();

// Get attribute
const href = await page.locator('a').getAttribute('href');
const dataTest = await page.locator('button').getAttribute('data-test');

// Get CSS property
const color = await page.locator('h1').evaluate(el => 
  getComputedStyle(el).color
);

// Check visibility
const isVisible = await page.locator('.error').isVisible();
const isHidden = await page.locator('.error').isHidden();
const isEnabled = await page.locator('button').isEnabled();
const isDisabled = await page.locator('button').isDisabled();
const isEditable = await page.locator('input').isEditable();

// Get bounding box (position and size)
const box = await page.locator('button').boundingBox();
console.log(box); // { x: 100, y: 200, width: 80, height: 30 }
```

---

## Complete Action Reference Table

| Action | Method | Example |
|---|---|---|
| Navigate | `page.goto(url)` | `await page.goto('/')` |
| Click | `.click()` | `await locator.click()` |
| Double click | `.dblclick()` | `await locator.dblclick()` |
| Right click | `.click({button:'right'})` | `await locator.click({button:'right'})` |
| Fill text | `.fill(text)` | `await locator.fill('hello')` |
| Clear text | `.clear()` | `await locator.clear()` |
| Type slowly | `.pressSequentially(text)` | `await locator.pressSequentially('hi')` |
| Press key | `.press(key)` | `await locator.press('Enter')` |
| Select option | `.selectOption(value)` | `await locator.selectOption('az')` |
| Check | `.check()` | `await locator.check()` |
| Uncheck | `.uncheck()` | `await locator.uncheck()` |
| Hover | `.hover()` | `await locator.hover()` |
| Drag & drop | `.dragTo(target)` | `await source.dragTo(target)` |
| Upload file | `.setInputFiles(path)` | `await locator.setInputFiles('f.pdf')` |
| Focus | `.focus()` | `await locator.focus()` |
| Scroll into view | `.scrollIntoViewIfNeeded()` | `await locator.scrollIntoViewIfNeeded()` |

---

## Practice Exercises

1. Write a test that fills in the login form using `fill()`, then clears both fields with `clear()`, then fills them again
2. Write a test that uses `selectOption()` to sort products by all 4 options and verifies the first item changes
3. Write a test that uses `keyboard.press('Tab')` to navigate between login form fields
4. Write a test that hovers over each product to check for hover effects
5. Write a test that gets the `textContent()` of all product names and logs them

---

[Next: Assertions — Verifying Everything →](./07-assertions.md)
