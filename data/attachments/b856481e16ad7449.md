# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: purchase_flow.spec.js >> Business Logic: Purchase Flow @e2e >> Purchase: Checkout Permutation - Product 5 with Var 2
- Location: src/tests/purchase_flow.spec.js:43:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-test="inventory-item"]').nth(5).locator('button[id^="add-to-cart"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: Swag Labs
  - generic [ref=e5]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - textbox "Username" [ref=e11]: standard_user
        - img [ref=e12]
      - generic [ref=e14]:
        - textbox "Password" [ref=e15]
        - img [ref=e16]
      - 'heading "Epic sadface: Password is required" [level=3] [ref=e19]':
        - button [ref=e20] [cursor=pointer]:
          - img [ref=e21]
        - text: "Epic sadface: Password is required"
      - button "Login" [active] [ref=e23] [cursor=pointer]
    - generic [ref=e25]:
      - generic [ref=e26]:
        - heading "Accepted usernames are:" [level=4] [ref=e27]
        - text: standard_user
        - text: locked_out_user
        - text: problem_user
        - text: performance_glitch_user
        - text: error_user
        - text: visual_user
      - generic [ref=e28]:
        - heading "Password for all users:" [level=4] [ref=e29]
        - text: secret_sauce
```

# Test source

```ts
  1  | const BasePage = require('./BasePage');
  2  | 
  3  | /**
  4  |  * InventoryPage class for SauceDemo
  5  |  */
  6  | class InventoryPage extends BasePage {
  7  |   constructor(page) {
  8  |     super(page);
  9  |     this.inventoryItem = '[data-test="inventory-item"]';
  10 |     this.inventoryItemName = '[data-test="inventory-item-name"]';
  11 |     this.addToCartButton = 'button[id^="add-to-cart"]';
  12 |     this.removeFromCartButton = 'button[id^="remove"]';
  13 |     this.cartBadge = '[data-test="shopping-cart-badge"]';
  14 |     this.cartLink = '[data-test="shopping-cart-link"]';
  15 |     this.sortDropdown = '[data-test="product-sort-container"]';
  16 |   }
  17 | 
  18 |   async addItemToCart(index = 0) {
  19 |     const item = this.page.locator(this.inventoryItem).nth(index);
  20 |     const button = item.locator(this.addToCartButton);
> 21 |     await button.click();
     |                  ^ Error: locator.click: Test timeout of 60000ms exceeded.
  22 |   }
  23 | 
  24 |   async getItemName(index = 0) {
  25 |     return await this.page.locator(this.inventoryItemName).nth(index).textContent();
  26 |   }
  27 | 
  28 |   async getCartCount() {
  29 |     try {
  30 |       // Wait for badge to appear if not there yet (some buffer for CI)
  31 |       await this.page.waitForSelector(this.cartBadge, { state: 'visible', timeout: 5000 });
  32 |       return await this.page.textContent(this.cartBadge);
  33 |     } catch (e) {
  34 |       return '0';
  35 |     }
  36 |   }
  37 | 
  38 |   async navigateToCart() {
  39 |     await this.click(this.cartLink);
  40 |   }
  41 | 
  42 |   async sortItems(option) {
  43 |     await this.page.selectOption(this.sortDropdown, option);
  44 |   }
  45 | }
  46 | 
  47 | module.exports = InventoryPage;
  48 | 
```