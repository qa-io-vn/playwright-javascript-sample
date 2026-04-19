# 05 — Locators: Finding Elements the Right Way

[← Previous: Running Tests](../phase-1-foundations/04-running-tests-and-cli.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Actions →](./06-actions.md)

---

## What You Will Learn

- Every locator strategy Playwright provides
- Which locators are best and why (with priority ranking)
- How to chain, filter, and combine locators
- How locators differ from raw selectors
- Real examples from our SauceDemo project

---

## Locator vs Selector — The Critical Difference

A **selector** is a string like `'#username'`. A **locator** is a Playwright object that:
- Finds the element **every time it's needed** (not just once)
- **Auto-waits** for the element to be visible and stable
- **Auto-retries** if the element isn't ready yet
- **Never goes stale** — even if the DOM re-renders

```javascript
// BAD — Raw selector, can go stale
const element = await page.$('#username');    // Returns ElementHandle (can become stale)
await element.click();                        // Might crash if DOM re-rendered

// GOOD — Locator, always fresh
const element = page.locator('#username');    // Returns Locator (re-queries every time)
await element.click();                        // Always finds the latest element
```

**Rule: Always use `page.locator()` or the built-in locator methods. Never use `page.$()` or `page.$$()` in new code.**

---

## Locator Priority Ranking (Best → Worst)

### Tier 1 — Recommended (most resilient to UI changes)

#### 1. `getByRole()` — Accessibility roles

```javascript
// Buttons
await page.getByRole('button', { name: 'Login' }).click();
await page.getByRole('button', { name: /submit/i }).click();  // case-insensitive regex

// Links
await page.getByRole('link', { name: 'Checkout' }).click();

// Text inputs
await page.getByRole('textbox', { name: 'Username' }).fill('user');

// Checkboxes
await page.getByRole('checkbox', { name: 'Remember me' }).check();

// Dropdowns
await page.getByRole('combobox', { name: 'Sort' }).selectOption('az');

// Headings
await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
```

**Why it's best:** Mirrors how users and screen readers find elements. Survives CSS/HTML restructuring.

#### 2. `getByTestId()` — data-testid attributes

```javascript
// SauceDemo uses data-test attributes
await page.getByTestId('username').fill('standard_user');
await page.getByTestId('password').fill('secret_sauce');
await page.getByTestId('login-button').click();
```

By default, `getByTestId` looks for `data-testid`. Our project uses `data-test`, so configure it:

```javascript
// playwright.config.js
module.exports = defineConfig({
  use: {
    testIdAttribute: 'data-test',
  },
});
```

Now `getByTestId('username')` matches `[data-test="username"]`.

**Why it's great:** Dedicated testing attribute. Developers and QA agree on these. Immune to CSS and text changes.

#### 3. `getByText()` — Visible text content

```javascript
// Exact match
await page.getByText('Sauce Labs Backpack').click();

// Substring match (default behavior)
await page.getByText('Backpack').click();

// Exact match only
await page.getByText('Sauce Labs Backpack', { exact: true }).click();

// Regex
await page.getByText(/backpack/i).click();
```

#### 4. `getByLabel()` — Form labels

```javascript
// Matches input associated with a <label>
await page.getByLabel('Username').fill('user');
await page.getByLabel('Password').fill('pass');
```

#### 5. `getByPlaceholder()` — Placeholder text

```javascript
await page.getByPlaceholder('Username').fill('user');
await page.getByPlaceholder('Password').fill('pass');
```

#### 6. `getByAltText()` — Image alt text

```javascript
await page.getByAltText('Company Logo').click();
await expect(page.getByAltText('Product Image')).toBeVisible();
```

#### 7. `getByTitle()` — Title attribute

```javascript
await page.getByTitle('Close').click();
```

---

### Tier 2 — Acceptable (use when Tier 1 doesn't work)

#### CSS Selectors

```javascript
// By data attribute (what our project uses most)
page.locator('[data-test="username"]')
page.locator('[data-test="login-button"]')

// By ID
page.locator('#username')

// By class
page.locator('.inventory_item')

// By tag + attribute
page.locator('button[type="submit"]')

// By partial attribute
page.locator('button[id^="add-to-cart"]')     // starts with
page.locator('button[id$="backpack"]')         // ends with
page.locator('button[id*="cart"]')             // contains
```

#### XPath (use only as last resort)

```javascript
// Avoid XPath when possible — fragile and hard to read
page.locator('//button[@data-test="login-button"]')
page.locator('//div[contains(@class, "inventory_item")]')
```

---

### Tier 3 — Avoid (fragile, breaks easily)

```javascript
// DON'T — Position-based selectors
page.locator('div:nth-child(3) > span')

// DON'T — Deep nesting
page.locator('body > div > main > section > div.container > div:nth-child(2)')

// DON'T — Auto-generated class names (change every build)
page.locator('.css-1a2b3c4')
page.locator('[class*="styled-component"]')
```

---

## Chaining Locators

Narrow down results by chaining:

```javascript
// Find the first inventory item, then find its "Add to cart" button
const item = page.locator('[data-test="inventory-item"]').first();
const button = item.locator('button[id^="add-to-cart"]');
await button.click();
```

This is exactly what our `InventoryPage.addItemToCart()` does:

```javascript
// From src/pages/InventoryPage.js
async addItemToCart(index = 0) {
  const item = this.page.locator(this.inventoryItem).nth(index);
  const button = item.locator(this.addToCartButton);
  await button.click();
}
```

---

## Filtering Locators

### Filter by text

```javascript
// Find inventory items that contain "Backpack"
const backpack = page.locator('[data-test="inventory-item"]')
  .filter({ hasText: 'Backpack' });

// Find items that DON'T contain "Backpack"
const notBackpack = page.locator('[data-test="inventory-item"]')
  .filter({ hasNotText: 'Backpack' });
```

### Filter by child locator

```javascript
// Find the inventory item that contains a specific price
const expensiveItem = page.locator('[data-test="inventory-item"]')
  .filter({ has: page.locator('.inventory_item_price', { hasText: '$49.99' }) });

await expensiveItem.locator('button').click();
```

---

## Locator Methods — Complete Reference

### Narrowing

| Method | Description | Example |
|---|---|---|
| `.first()` | First matching element | `locator.first()` |
| `.last()` | Last matching element | `locator.last()` |
| `.nth(index)` | Element at index (0-based) | `locator.nth(2)` |
| `.filter({})` | Filter by text or child | `locator.filter({ hasText: 'X' })` |
| `.locator()` | Chain with sub-selector | `parent.locator('button')` |
| `.and(locator)` | Both conditions must match | `locator.and(other)` |
| `.or(locator)` | Either condition matches | `locator.or(other)` |

### Counting

```javascript
// Count how many inventory items exist
const count = await page.locator('[data-test="inventory-item"]').count();
expect(count).toBe(6);

// Get all items as an array
const all = await page.locator('[data-test="inventory-item"]').all();
for (const item of all) {
  console.log(await item.textContent());
}
```

---

## Real-World Locator Patterns from This Project

### LoginPage — data-test attributes

```javascript
// src/pages/LoginPage.js
this.usernameInput = '[data-test="username"]';
this.passwordInput = '[data-test="password"]';
this.loginButton = '[data-test="login-button"]';
this.errorMessage = '[data-test="error"]';
```

### InventoryPage — mixed strategies

```javascript
// src/pages/InventoryPage.js
this.inventoryItem = '[data-test="inventory-item"]';          // data-test
this.addToCartButton = 'button[id^="add-to-cart"]';           // partial ID match
this.cartBadge = '[data-test="shopping-cart-badge"]';         // data-test
this.sortDropdown = '[data-test="product-sort-container"]';   // data-test
```

### CheckoutPage — data-test attributes

```javascript
// src/pages/CheckoutPage.js
this.firstNameInput = '[data-test="firstName"]';
this.continueButton = '[data-test="continue"]';
this.completeHeader = '[data-test="complete-header"]';
```

---

## Picking Locators — Tools

### Playwright Codegen

```bash
npx playwright codegen https://www.saucedemo.com
```

Click on elements — Playwright suggests the best locator automatically.

### Playwright Inspector

```bash
npx playwright test --debug
```

Click "Pick Locator" in the Inspector toolbar, then click any element.

### VS Code Extension

1. Open the Playwright sidebar in VS Code
2. Click "Pick Locator"
3. Click any element in the browser
4. The locator string is copied to your clipboard

---

## Practice Exercises

1. Open `https://www.saucedemo.com` with codegen and click every element — study the suggested locators
2. Rewrite the `LoginPage.js` selectors using `getByTestId()` approach (after setting `testIdAttribute` in config)
3. Write a test that finds all 6 products using `locator.all()` and logs their names
4. Use `.filter({ hasText: '$49.99' })` to find the Fleece Jacket
5. Use `.and()` to combine two conditions: an inventory item that also has a specific button

---

[Next: Actions — Clicking, Typing, Selecting →](./06-actions.md)
