# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: negative_tests.spec.js >> Business Logic: Error Handling & Validations @regression >> Cart: Checkout with empty cart (Edge Case)
- Location: src/tests/negative_tests.spec.js:52:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-test="shopping-cart-link"]')

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
  1  | /**
  2  |  * BasePage class containing common methods for all pages
  3  |  */
  4  | class BasePage {
  5  |   constructor(page) {
  6  |     this.page = page;
  7  |   }
  8  | 
  9  |   async navigate(path = '') {
  10 |     await this.page.goto(path);
  11 |   }
  12 | 
  13 |   async getTitle() {
  14 |     return await this.page.title();
  15 |   }
  16 | 
  17 |   async getUrl() {
  18 |     return this.page.url();
  19 |   }
  20 | 
  21 |   async waitForElement(selector) {
  22 |     await this.page.waitForSelector(selector);
  23 |   }
  24 | 
  25 |   async click(selector) {
> 26 |     await this.page.click(selector);
     |                     ^ Error: page.click: Test timeout of 60000ms exceeded.
  27 |   }
  28 | 
  29 |   async type(selector, text) {
  30 |     await this.page.fill(selector, text);
  31 |   }
  32 | 
  33 |   async getText(selector) {
  34 |     return await this.page.textContent(selector);
  35 |   }
  36 | 
  37 |   async isVisible(selector) {
  38 |     return await this.page.isVisible(selector);
  39 |   }
  40 | }
  41 | 
  42 | module.exports = BasePage;
  43 | 
```