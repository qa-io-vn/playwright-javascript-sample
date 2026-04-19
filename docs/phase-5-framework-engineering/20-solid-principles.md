# 20 — SOLID Principles in Test Automation

[← Previous: Trace Viewer](../phase-4-advanced/19-trace-viewer-debugging.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Custom Fixtures →](./21-custom-fixtures-advanced.md)

---

## What You Will Learn

- How to apply SOLID software design principles to test frameworks
- How each principle maps to our SauceDemo project
- How to recognize and fix SOLID violations in automation code

---

## Why SOLID Matters for SDETs

Bad test frameworks become unmaintainable at scale. 50 tests are manageable. 5,000 are not — unless the architecture is clean. SOLID principles are the difference between a framework that scales and one that collapses.

---

## S — Single Responsibility Principle

> Every class should have **one reason to change.**

### In our project

| Class | Responsibility | Changes when... |
|---|---|---|
| `LoginPage` | Login page interactions | Login UI changes |
| `CartPage` | Cart page interactions | Cart UI changes |
| `CustomReporter` | Test result reporting | Reporting requirements change |
| `NotificationUtil` | External notifications | Notification channels change |

### Violation example

```javascript
// BAD — LoginPage does too many things
class LoginPage {
  async login(user, pass) { /* ... */ }
  async addToCart(item) { /* ... */ }         // Not login-related!
  async sendSlackNotification() { /* ... */ } // Not page-related!
}

// GOOD — Each class has one job
class LoginPage { async login(user, pass) { /* ... */ } }
class InventoryPage { async addToCart(item) { /* ... */ } }
class NotificationUtil { async sendSlack(msg) { /* ... */ } }
```

---

## O — Open/Closed Principle

> Classes should be **open for extension, closed for modification.**

### In our project

`BasePage` is closed — you don't modify it when adding new pages. You **extend** it:

```javascript
// BasePage is CLOSED — never needs modification
class BasePage {
  async click(selector) { /* ... */ }
  async type(selector, text) { /* ... */ }
}

// New pages EXTEND BasePage — open for extension
class LoginPage extends BasePage { /* ... */ }
class CartPage extends BasePage { /* ... */ }
class NewFeaturePage extends BasePage { /* ... */ }  // Added without touching BasePage
```

### Violation example

```javascript
// BAD — Adding a new page requires modifying BasePage
class BasePage {
  async loginSpecificMethod() { /* ... */ }     // Why is this in BasePage?
  async cartSpecificMethod() { /* ... */ }      // Why is this in BasePage?
}

// GOOD — BasePage has only shared methods
class BasePage {
  async click(selector) { /* ... */ }
  async type(selector, text) { /* ... */ }
  async getText(selector) { /* ... */ }
}
```

---

## L — Liskov Substitution Principle

> Subclasses must be **substitutable** for their parent class.

### In our project

Every page object extends `BasePage`. Anywhere you use `BasePage` methods, the child works identically:

```javascript
class LoginPage extends BasePage {
  // Inherits click(), type(), getText() — they all work as expected
  async login(user, pass) {
    await this.type(this.usernameInput, user);  // BasePage.type() works correctly
    await this.type(this.passwordInput, pass);
    await this.click(this.loginButton);         // BasePage.click() works correctly
  }
}
```

### Violation example

```javascript
// BAD — Subclass breaks parent's contract
class BasePage {
  async navigate(path) {
    await this.page.goto(path);  // Returns void, navigates to path
  }
}

class BrokenPage extends BasePage {
  async navigate(path) {
    console.log(path);           // Doesn't actually navigate! Violates contract.
  }
}
```

---

## I — Interface Segregation Principle

> Don't force classes to depend on methods they don't use.

### In our project

`BasePage` has only **universally needed** methods. Page-specific methods live in their own classes:

```javascript
// BasePage — only methods ALL pages need
class BasePage {
  async navigate(path) { /* ... */ }
  async click(selector) { /* ... */ }
  async type(selector, text) { /* ... */ }
  async getText(selector) { /* ... */ }
}

// LoginPage doesn't need sortItems() or getCartCount()
// InventoryPage doesn't need fillInformation() or getErrorMessage()
// Each class has only what it needs
```

### Violation example

```javascript
// BAD — "God class" with everything
class PageHelper {
  async login() { /* ... */ }
  async addToCart() { /* ... */ }
  async checkout() { /* ... */ }
  async sortProducts() { /* ... */ }
  async getError() { /* ... */ }
  async fillAddress() { /* ... */ }
}

// Every test imports PageHelper even if it only needs login()
// Changes to checkout() affect all tests that import PageHelper
```

---

## D — Dependency Inversion Principle

> High-level modules should not depend on low-level modules. Both should depend on **abstractions.**

### In our project

Tests depend on **fixtures** (abstraction), not on direct page object creation (implementation):

```javascript
// BAD — Test creates its own dependencies (tightly coupled)
test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);      // Test knows about LoginPage class
  const inventoryPage = new InventoryPage(page); // Test knows about InventoryPage class
});

// GOOD — Test receives dependencies via fixtures (loosely coupled)
test('login test', async ({ loginPage, inventoryPage }) => {
  // Test doesn't know HOW these are created
  // Fixtures handle creation, injection, and cleanup
});
```

### Our fixture is the abstraction layer

```javascript
// src/fixtures/baseTest.js — the "factory"
exports.test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));    // Creation logic is centralized
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
});
```

If you change how `LoginPage` is created (e.g., add constructor parameters), you change it **once in the fixture**, not in every test.

---

## SOLID Violations Checklist

| Smell | Violation | Fix |
|---|---|---|
| Page object > 200 lines | Single Responsibility | Split into smaller page objects |
| Modifying BasePage for new pages | Open/Closed | Extend, don't modify |
| Tests creating page objects directly | Dependency Inversion | Use fixtures |
| Assertions inside page objects | Single Responsibility | Move assertions to tests |
| God class with all methods | Interface Segregation | Split into focused classes |
| Hardcoded data in page objects | Single Responsibility | Move data to JSON/config |

---

## Practice Exercises

1. Review each page object in `src/pages/` and verify it follows Single Responsibility
2. Try adding a new `MenuPage.js` without modifying `BasePage.js` (Open/Closed)
3. Check if any page object contains assertions — move them to the test files if found
4. Count the methods in `BasePage` — are all of them truly universal?
5. Refactor a test to use fixtures instead of manually creating page objects

---

[Next: Custom Fixtures & Advanced Composition →](./21-custom-fixtures-advanced.md)
