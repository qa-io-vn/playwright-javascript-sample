# 09 — Page Object Model (POM)

[← Previous: Auto-Waiting](../phase-2-core-concepts/08-auto-waiting.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Fixtures →](./10-fixtures.md)

---

## What You Will Learn

- What the Page Object Model is and why every professional framework uses it
- How to design a BasePage class with shared methods
- How to create page-specific classes
- How our SauceDemo project implements POM
- Common POM mistakes and how to avoid them

---

## What Problem Does POM Solve?

### Without POM — The nightmare

```javascript
// test1.spec.js
test('login test', async ({ page }) => {
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
});

// test2.spec.js — same selectors duplicated
test('another login test', async ({ page }) => {
  await page.locator('[data-test="username"]').fill('problem_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
});

// test3.spec.js — same selectors AGAIN
// ... imagine 50 more files
```

**Problem:** If the developer changes `data-test="username"` to `data-test="user-name"`, you must update **50+ files**.

### With POM — The solution

```javascript
// LoginPage.js — single source of truth
class LoginPage {
  constructor(page) {
    this.usernameInput = '[data-test="username"]';  // Change here ONCE
  }
}

// test1.spec.js — uses the page object
test('login test', async ({ loginPage }) => {
  await loginPage.login('standard_user', 'secret_sauce');
});

// test2.spec.js — same page object
test('another login test', async ({ loginPage }) => {
  await loginPage.login('problem_user', 'secret_sauce');
});
```

**Benefit:** Selector changes in ONE file. Tests read like English.

---

## POM Architecture in This Project

```
src/pages/
├── BasePage.js         ← Shared methods (navigate, click, type, getText)
├── LoginPage.js        ← Extends BasePage, adds login-specific methods
├── InventoryPage.js    ← Extends BasePage, adds product/cart methods
├── CartPage.js         ← Extends BasePage, adds cart management methods
└── CheckoutPage.js     ← Extends BasePage, adds checkout flow methods
```

### Inheritance chain

```
BasePage (parent)
  ├── LoginPage
  ├── InventoryPage
  ├── CartPage
  └── CheckoutPage
```

---

## Step 1: BasePage — The Foundation

```javascript
// src/pages/BasePage.js
class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(path = '') {
    await this.page.goto(path);
  }

  async getTitle() {
    return await this.page.title();
  }

  async getUrl() {
    return this.page.url();
  }

  async waitForElement(selector) {
    await this.page.waitForSelector(selector);
  }

  async click(selector) {
    await this.page.click(selector);
  }

  async type(selector, text) {
    await this.page.fill(selector, text);
  }

  async getText(selector) {
    return await this.page.textContent(selector);
  }

  async isVisible(selector) {
    return await this.page.isVisible(selector);
  }
}

module.exports = BasePage;
```

### Why BasePage exists

| Method | Purpose | Used By |
|---|---|---|
| `navigate(path)` | Go to any page using baseURL + path | All pages |
| `click(selector)` | Click any element | All pages |
| `type(selector, text)` | Fill any text input | LoginPage, CheckoutPage |
| `getText(selector)` | Get text from any element | All pages |
| `isVisible(selector)` | Check if element is visible | LoginPage (error checking) |

---

## Step 2: Page-Specific Classes

### LoginPage

```javascript
// src/pages/LoginPage.js
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);                                    // Pass page to BasePage
    this.usernameInput = '[data-test="username"]';  // Locator definitions
    this.passwordInput = '[data-test="password"]';
    this.loginButton = '[data-test="login-button"]';
    this.errorMessage = '[data-test="error"]';
  }

  async login(username, password) {
    await this.type(this.usernameInput, username);  // Uses BasePage.type()
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);             // Uses BasePage.click()
  }

  async getErrorMessage() {
    return await this.getText(this.errorMessage);   // Uses BasePage.getText()
  }

  async isErrorMessageDisplayed() {
    return await this.isVisible(this.errorMessage); // Uses BasePage.isVisible()
  }
}

module.exports = LoginPage;
```

### InventoryPage

```javascript
// src/pages/InventoryPage.js
const BasePage = require('./BasePage');

class InventoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.inventoryItem = '[data-test="inventory-item"]';
    this.inventoryItemName = '[data-test="inventory-item-name"]';
    this.addToCartButton = 'button[id^="add-to-cart"]';
    this.removeFromCartButton = 'button[id^="remove"]';
    this.cartBadge = '[data-test="shopping-cart-badge"]';
    this.cartLink = '[data-test="shopping-cart-link"]';
    this.sortDropdown = '[data-test="product-sort-container"]';
  }

  async addItemToCart(index = 0) {
    const item = this.page.locator(this.inventoryItem).nth(index);
    const button = item.locator(this.addToCartButton);
    await button.click();
  }

  async getItemName(index = 0) {
    return await this.page.locator(this.inventoryItemName).nth(index).textContent();
  }

  async getCartCount() {
    try {
      await this.page.waitForSelector(this.cartBadge, { state: 'visible', timeout: 5000 });
      return await this.page.textContent(this.cartBadge);
    } catch (e) {
      return '0';
    }
  }

  async navigateToCart() {
    await this.click(this.cartLink);
  }

  async sortItems(option) {
    await this.page.selectOption(this.sortDropdown, option);
  }
}

module.exports = InventoryPage;
```

### CartPage

```javascript
// src/pages/CartPage.js
const BasePage = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);
    this.cartItem = '[data-test="inventory-item"]';
    this.cartItemName = '[data-test="inventory-item-name"]';
    this.checkoutButton = '[data-test="checkout"]';
    this.continueShoppingButton = '[data-test="continue-shopping"]';
    this.removeButton = '[data-test^="remove-"]';
  }

  async getCartItems() {
    return await this.page.$$(this.cartItem);
  }

  async getCartItemNames() {
    const names = await this.page.$$(this.cartItemName);
    const itemNames = [];
    for (const name of names) {
      itemNames.push(await name.textContent());
    }
    return itemNames;
  }

  async checkout() {
    await this.click(this.checkoutButton);
  }

  async removeItem(index = 0) {
    const buttons = await this.page.$$(this.removeButton);
    if (buttons.length > index) {
      await buttons[index].click();
    }
  }
}

module.exports = CartPage;
```

### CheckoutPage

```javascript
// src/pages/CheckoutPage.js
const BasePage = require('./BasePage');

class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstNameInput = '[data-test="firstName"]';
    this.lastNameInput = '[data-test="lastName"]';
    this.postalCodeInput = '[data-test="postalCode"]';
    this.continueButton = '[data-test="continue"]';
    this.finishButton = '[data-test="finish"]';
    this.cancelButton = '[data-test="cancel"]';
    this.completeHeader = '[data-test="complete-header"]';
    this.summaryTotalLabel = '[data-test="total-label"]';
  }

  async fillInformation(firstName, lastName, postalCode) {
    await this.type(this.firstNameInput, firstName);
    await this.type(this.lastNameInput, lastName);
    await this.type(this.postalCodeInput, postalCode);
    await this.click(this.continueButton);
  }

  async finish() {
    await this.click(this.finishButton);
  }

  async getCompleteHeaderText() {
    return await this.getText(this.completeHeader);
  }

  async getTotalPrice() {
    return await this.getText(this.summaryTotalLabel);
  }

  async cancel() {
    await this.click(this.cancelButton);
  }
}

module.exports = CheckoutPage;
```

---

## POM Design Rules

### DO

| Rule | Example |
|---|---|
| One class per page | `LoginPage.js`, `CartPage.js` |
| Selectors as class properties | `this.loginButton = '[data-test="login-button"]'` |
| High-level methods | `login(user, pass)` not `clickLoginButton()` |
| Return data from methods | `getErrorMessage()` returns a string |
| Accept `page` in constructor | `constructor(page) { this.page = page }` |

### DON'T

| Anti-Pattern | Why It's Bad |
|---|---|
| Assertions inside page objects | Tests should decide what to assert, not page objects |
| Multiple pages in one class | Violates Single Responsibility Principle |
| Exposing raw selectors to tests | Tests shouldn't know about CSS selectors |
| Business logic in page objects | Page objects only handle UI interactions |
| Hardcoding test data in page objects | Data should come from the test or data files |

### Example: assertion placement

```javascript
// BAD — assertion inside page object
class LoginPage {
  async verifyLoginSuccess() {
    const url = this.page.url();
    expect(url).toContain('inventory');  // Don't do this!
  }
}

// GOOD — page object returns data, test asserts
class LoginPage {
  async login(username, password) { /* ... */ }
}

// In test:
await loginPage.login('standard_user', 'secret_sauce');
await expect(page).toHaveURL(/.*inventory.html/);  // Test makes the assertion
```

---

## POM with Locators (Modern Approach)

Instead of string selectors, you can store Playwright Locators directly:

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
```

**Advantage:** Type-safe, IDE autocomplete, no raw strings scattered in methods.

---

## Practice Exercises

1. Read every page object in `src/pages/` and trace how inheritance flows from BasePage
2. Add a new method `getItemPrice(index)` to `InventoryPage` that returns a product's price
3. Create a new page object `MenuPage.js` that handles the hamburger menu (open, close, logout)
4. Refactor `LoginPage` to use Playwright Locators instead of string selectors
5. Write a test that uses all 4 page objects in a single end-to-end purchase flow

---

[Next: Fixtures & Dependency Injection →](./10-fixtures.md)
