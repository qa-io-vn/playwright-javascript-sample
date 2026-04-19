# 07 — Assertions: Verifying Everything

[← Previous: Actions](./06-actions.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Auto-Waiting →](./08-auto-waiting.md)

---

## What You Will Learn

- The difference between web-first assertions and generic assertions
- Every assertion method Playwright provides
- How auto-retry works with assertions
- Soft assertions, negation, and custom messages
- Real examples from our SauceDemo project

---

## Two Types of Assertions

### 1. Web-First Assertions (Auto-Retry) — PREFERRED

These assertions **automatically retry** until they pass or timeout. They start with `await expect(locator)`:

```javascript
// Waits up to 5 seconds (default) for the element to become visible
await expect(page.locator('.products')).toBeVisible();

// Retries checking the text until it matches
await expect(page.locator('.header')).toHaveText('Products');
```

### 2. Generic Assertions (No Retry) — Use for static values

These assertions check once and pass/fail immediately. They start with `expect(value)` (no `await`):

```javascript
// No retry — checks immediately
const count = await page.locator('.item').count();
expect(count).toBe(6);    // No "await" — generic assertion

const title = await page.title();
expect(title).toBe('Swag Labs');
```

### When to use which

| Type | When | Example |
|---|---|---|
| Web-First (`await expect(locator)`) | Checking something in the browser that might change | Visibility, text, URL, attributes |
| Generic (`expect(value)`) | Checking a value you already retrieved | Array length, computed values, API responses |

---

## Page Assertions

```javascript
// URL
await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
await expect(page).toHaveURL(/.*inventory.html/);

// Title
await expect(page).toHaveTitle('Swag Labs');
await expect(page).toHaveTitle(/swag/i);    // case-insensitive regex
```

### How our project uses page assertions

```javascript
// From src/tests/auth.spec.js
test('Login: Success for standard_user', async ({ loginPage, inventoryPage }) => {
  await loginPage.login(user.username, process.env.PASSWORD);
  await expect(inventoryPage.page).toHaveURL(/.*inventory.html/);
  //          ↑ uses the page from inventoryPage fixture
});
```

---

## Locator Assertions — Complete Reference

### Visibility

```javascript
// Element is visible
await expect(page.locator('.header')).toBeVisible();

// Element is hidden or not in DOM
await expect(page.locator('.spinner')).toBeHidden();

// Element exists in DOM (even if hidden)
await expect(page.locator('.data')).toBeAttached();

// Element is NOT in DOM
await expect(page.locator('.modal')).not.toBeAttached();
```

### Text Content

```javascript
// Has exact text
await expect(page.locator('h1')).toHaveText('Products');

// Contains text (substring)
await expect(page.locator('.error')).toContainText('Username and password');

// Has specific text with regex
await expect(page.locator('h1')).toHaveText(/products/i);

// Multiple elements have specific texts
await expect(page.locator('.nav-item')).toHaveText([
  'All Items',
  'About',
  'Logout',
  'Reset App State',
]);
```

### How our project uses text assertions

```javascript
// From src/tests/auth.spec.js
test('Login: Error for locked out user', async ({ loginPage }) => {
  await loginPage.login('locked_out_user', process.env.PASSWORD);
  const errorMsg = await loginPage.getErrorMessage();
  expect(errorMsg).toContain('Sorry, this user has been locked out.');
});

// From src/tests/purchase_flow.spec.js
const completeHeader = await checkoutPage.getCompleteHeaderText();
expect(completeHeader).toBe('Thank you for your order!');
```

### Input Values

```javascript
// Input has specific value
await expect(page.locator('#username')).toHaveValue('standard_user');

// Input has value matching regex
await expect(page.locator('#email')).toHaveValue(/.*@.*\.com/);

// Input is empty
await expect(page.locator('#search')).toBeEmpty();
```

### Attributes and CSS

```javascript
// Has specific attribute
await expect(page.locator('a')).toHaveAttribute('href', '/inventory.html');

// Has attribute matching regex
await expect(page.locator('img')).toHaveAttribute('src', /.*\.png/);

// Has CSS class
await expect(page.locator('.btn')).toHaveClass(/active/);

// Has specific CSS property value
await expect(page.locator('.error')).toHaveCSS('color', 'rgb(226, 35, 26)');

// Has specific ID
await expect(page.locator('.main')).toHaveId('main-content');
```

### Element State

```javascript
// Is enabled / disabled
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();

// Is checked / unchecked (checkboxes, radios)
await expect(page.locator('input[type="checkbox"]')).toBeChecked();
await expect(page.locator('input[type="checkbox"]')).not.toBeChecked();

// Is editable (not readonly)
await expect(page.locator('input')).toBeEditable();

// Is focused
await expect(page.locator('#username')).toBeFocused();

// Is in viewport (visible on screen without scrolling)
await expect(page.locator('.header')).toBeInViewport();
```

### Count

```javascript
// Exact count of matching elements
await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(6);

// Zero elements (none found)
await expect(page.locator('.error')).toHaveCount(0);
```

### How our project uses count assertions

```javascript
// From src/tests/purchase_flow.spec.js
const count = await inventoryPage.getCartCount();
expect(count).toBe(combination.length.toString());

// From src/tests/negative_tests.spec.js
const items = await cartPage.getCartItems();
expect(items.length).toBe(0);
```

---

## Negation — `.not`

Add `.not` before any assertion to invert it:

```javascript
await expect(page.locator('.error')).not.toBeVisible();
await expect(page.locator('h1')).not.toHaveText('Login');
await expect(page).not.toHaveURL(/.*login/);
await expect(page.locator('button')).not.toBeDisabled();
await expect(page.locator('.items')).not.toHaveCount(0);
```

---

## Custom Timeout per Assertion

```javascript
// Wait up to 15 seconds for this specific assertion
await expect(page.locator('.slow-content')).toBeVisible({ timeout: 15000 });

// Wait up to 30 seconds for URL to change
await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
```

Default timeout is `expect.timeout` in config (5000ms by default).

---

## Custom Error Messages

```javascript
// Add a descriptive message that shows when the assertion fails
await expect(page.locator('.cart-badge'), 'Cart should show 3 items after adding').toHaveText('3');

// Generic assertion with message
expect(price, 'Product price should be positive').toBeGreaterThan(0);
```

**Output on failure:**
```
Error: Cart should show 3 items after adding
  Expected: "3"
  Received: "2"
```

---

## Soft Assertions

Soft assertions **do not stop the test** when they fail. The test continues and reports all failures at the end:

```javascript
// Normal assertion — test STOPS here if it fails
await expect(page.locator('h1')).toHaveText('Products');

// Soft assertion — test CONTINUES even if this fails
await expect.soft(page.locator('h1')).toHaveText('Products');
await expect.soft(page.locator('.price')).toHaveText('$29.99');
await expect.soft(page.locator('.desc')).toContainText('carry');

// All three are checked — test fails if ANY of them failed
```

### When to use soft assertions

- Verifying multiple independent properties of a page
- Checking a list of items where you want to know ALL failures, not just the first one
- UI verification tests where every element matters

---

## Generic (Non-Web) Assertions

For values you've already extracted from the page:

```javascript
// Equality
expect(value).toBe(5);                      // Strict equal (===)
expect(value).toEqual({ name: 'Test' });    // Deep equal (objects/arrays)

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();
expect(value).toBeNaN();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeGreaterThanOrEqual(5);
expect(value).toBeLessThan(10);
expect(value).toBeLessThanOrEqual(10);
expect(value).toBeCloseTo(3.14, 2);         // 2 decimal places

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);
expect(text).toHaveLength(10);

// Arrays
expect(array).toContain('item');
expect(array).toContainEqual({ id: 1 });    // Deep match in array
expect(array).toHaveLength(6);
expect(array).toEqual(expect.arrayContaining(['a', 'b']));

// Objects
expect(obj).toHaveProperty('name');
expect(obj).toHaveProperty('name', 'Test');
expect(obj).toMatchObject({ name: 'Test' }); // Partial match
```

### How our project uses generic assertions

```javascript
// From src/tests/inventory.spec.js
expect(found).toBe(true);
expect(price).toBe(product.price);

// From src/tests/purchase_flow.spec.js
const cartItems = await cartPage.getCartItemNames();
expect(cartItems).toContain(product.name);
```

---

## Assertion Reference Table

| Assertion | Auto-Retry | Example |
|---|---|---|
| `toBeVisible()` | Yes | `await expect(locator).toBeVisible()` |
| `toBeHidden()` | Yes | `await expect(locator).toBeHidden()` |
| `toBeAttached()` | Yes | `await expect(locator).toBeAttached()` |
| `toBeEnabled()` | Yes | `await expect(locator).toBeEnabled()` |
| `toBeDisabled()` | Yes | `await expect(locator).toBeDisabled()` |
| `toBeChecked()` | Yes | `await expect(locator).toBeChecked()` |
| `toBeEditable()` | Yes | `await expect(locator).toBeEditable()` |
| `toBeFocused()` | Yes | `await expect(locator).toBeFocused()` |
| `toBeInViewport()` | Yes | `await expect(locator).toBeInViewport()` |
| `toBeEmpty()` | Yes | `await expect(locator).toBeEmpty()` |
| `toHaveText()` | Yes | `await expect(locator).toHaveText('X')` |
| `toContainText()` | Yes | `await expect(locator).toContainText('X')` |
| `toHaveValue()` | Yes | `await expect(locator).toHaveValue('X')` |
| `toHaveAttribute()` | Yes | `await expect(locator).toHaveAttribute('href','/x')` |
| `toHaveClass()` | Yes | `await expect(locator).toHaveClass(/active/)` |
| `toHaveCSS()` | Yes | `await expect(locator).toHaveCSS('color','red')` |
| `toHaveId()` | Yes | `await expect(locator).toHaveId('main')` |
| `toHaveCount()` | Yes | `await expect(locator).toHaveCount(6)` |
| `toHaveURL()` | Yes | `await expect(page).toHaveURL(/.*inv/)` |
| `toHaveTitle()` | Yes | `await expect(page).toHaveTitle('Swag Labs')` |
| `toHaveScreenshot()` | Yes | `await expect(page).toHaveScreenshot()` |
| `toBe()` | No | `expect(5).toBe(5)` |
| `toEqual()` | No | `expect(obj).toEqual({a:1})` |
| `toContain()` | No | `expect(arr).toContain('x')` |
| `toMatch()` | No | `expect(str).toMatch(/x/)` |

---

## Practice Exercises

1. Write a test that uses 5 different web-first assertions on the inventory page (visibility, text, count, URL, attribute)
2. Write a test using soft assertions to check all 6 product names on the inventory page
3. Write a test that verifies the `.not` negation — check that no error message is visible after a successful login
4. Write a test that uses a custom error message and intentionally make it fail to see the output
5. Write a test that extracts all product prices and uses generic assertions to verify they are valid dollar amounts

---

[Next: Auto-Waiting & Actionability →](./08-auto-waiting.md)
