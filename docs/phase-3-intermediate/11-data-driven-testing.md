# 11 — Data-Driven Testing

[← Previous: Fixtures](./10-fixtures.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Hooks, Tags & Annotations →](./12-hooks-tags-annotations.md)

---

## What You Will Learn

- How to generate many tests from a single template using data
- How to use JSON files, arrays, and CSV for test data
- How to create parameterized tests with loops and `test.describe`
- How our project generates 100+ test cases from minimal code

---

## The Concept

Instead of writing one test per scenario:

```javascript
test('login as standard_user', async ({ loginPage }) => { /* ... */ });
test('login as problem_user', async ({ loginPage }) => { /* ... */ });
test('login as performance_glitch_user', async ({ loginPage }) => { /* ... */ });
```

Write **one template** and feed it data:

```javascript
const users = ['standard_user', 'problem_user', 'performance_glitch_user'];

for (const user of users) {
  test(`login as ${user}`, async ({ loginPage }) => {
    await loginPage.login(user, process.env.PASSWORD);
    await expect(loginPage.page).toHaveURL(/.*inventory.html/);
  });
}
```

Three tests generated from 5 lines of code.

---

## Method 1: Data from JSON Files

### The data file

```json
// src/data/users.json
[
  { "username": "standard_user", "type": "valid" },
  { "username": "problem_user", "type": "problem" },
  { "username": "performance_glitch_user", "type": "glitch" },
  { "username": "visual_user", "type": "visual" },
  { "username": "error_user", "type": "error" }
]
```

### The test

```javascript
// src/tests/auth.spec.js
const { test, expect } = require('../fixtures/baseTest');
const users = require('../data/users.json');

test.describe('Business Logic: Authentication @regression', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
  });

  for (const user of users) {
    test(`Login: Success for ${user.username} (${user.type}) @sanity`, async ({ loginPage, inventoryPage }) => {
      await loginPage.login(user.username, process.env.PASSWORD);
      await expect(inventoryPage.page).toHaveURL(/.*inventory.html/);
    });
  }
});
```

**Result:** 5 tests generated from 1 loop. Add a new user to the JSON → new test appears automatically.

---

## Method 2: Data from Arrays (Inline)

### Product purchase flow — 6 tests from 1 loop

```javascript
// src/tests/purchase_flow.spec.js
const products = require('../data/products.json');

for (const [index, product] of products.entries()) {
  test(`Purchase: Complete Flow for ${product.name} @smoke`, async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addItemToCart(index);
    await inventoryPage.navigateToCart();

    const cartItems = await cartPage.getCartItemNames();
    expect(cartItems).toContain(product.name);

    await cartPage.checkout();
    await checkoutPage.fillInformation('John', 'Doe', '12345');
    await checkoutPage.finish();

    const completeHeader = await checkoutPage.getCompleteHeaderText();
    expect(completeHeader).toBe('Thank you for your order!');
  });
}
```

---

## Method 3: Nested Loops (Combinatorial Testing)

### 80 invalid login combinations

```javascript
// src/tests/auth.spec.js
const invalidUsers = Array.from({ length: 10 }, (_, i) => `user_${i}`);
const invalidPass = Array.from({ length: 8 }, (_, i) => `pass_${i}`);

for (const u of invalidUsers) {
  for (const p of invalidPass) {
    test(`Login: Invalid combination - User:${u}/Pass:${p}`, async ({ loginPage }) => {
      await loginPage.login(u, p);
      const errorMsg = await loginPage.getErrorMessage();
      expect(errorMsg).toContain('Username and password do not match');
    });
  }
}
```

**10 users × 8 passwords = 80 tests** from 8 lines of code.

### 30 checkout permutations

```javascript
// src/tests/purchase_flow.spec.js
const checkoutVariations = [
  { first: 'A', last: 'B', zip: '123' },
  { first: 'VeryLongFirstNameThatIsMoreThanFiftyCharsLongToTestLimits', last: 'Last', zip: '12345' },
  { first: 'John', last: 'VeryLongLastNameThatIsMoreThanFiftyCharsLongToTestLimits', zip: '12345' },
  { first: 'Special-Chars!@#', last: 'Doe', zip: '90210' },
  { first: 'Numbers123', last: 'Last456', zip: 'ABCDE' }
];

for (const [pIndex, product] of products.entries()) {
  for (const [vIndex, data] of checkoutVariations.entries()) {
    test(`Purchase: Product ${pIndex} with Variation ${vIndex}`, async ({ inventoryPage, cartPage, checkoutPage }) => {
      await inventoryPage.addItemToCart(pIndex);
      await inventoryPage.navigateToCart();
      await cartPage.checkout();
      await checkoutPage.fillInformation(data.first, data.last, data.zip);
      await checkoutPage.finish();
      expect(await checkoutPage.getCompleteHeaderText()).toBe('Thank you for your order!');
    });
  }
}
```

**6 products × 5 variations = 30 tests.**

---

## Method 4: Multi-Item Combinations

```javascript
// src/tests/purchase_flow.spec.js
const itemCombinations = [
  [0, 1], [0, 2], [1, 2], [3, 4, 5], [0, 1, 2, 3, 4, 5]
];

for (const combination of itemCombinations) {
  test(`Purchase: Multi-item [${combination.join(',')}] @regression`, async ({ inventoryPage, cartPage, checkoutPage }) => {
    for (const idx of combination) {
      await inventoryPage.addItemToCart(idx);
    }

    const count = await inventoryPage.getCartCount();
    expect(count).toBe(combination.length.toString());

    await inventoryPage.navigateToCart();
    await cartPage.checkout();
    await checkoutPage.fillInformation('Test', 'User', '00000');
    await checkoutPage.finish();
    expect(await checkoutPage.getCompleteHeaderText()).toBe('Thank you for your order!');
  });
}
```

---

## Method 5: Validation Scenarios

```javascript
// src/tests/negative_tests.spec.js
const missingFieldScenarios = [
  { first: '', last: 'Doe', zip: '123', error: 'First Name is required' },
  { first: 'John', last: '', zip: '123', error: 'Last Name is required' },
  { first: 'John', last: 'Doe', zip: '', error: 'Postal Code is required' },
  { first: '', last: '', zip: '', error: 'First Name is required' }
];

for (const [index, scenario] of missingFieldScenarios.entries()) {
  test(`Validation: Missing fields [Case ${index}] - ${scenario.error}`, async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addItemToCart(0);
    await inventoryPage.navigateToCart();
    await cartPage.checkout();
    await checkoutPage.fillInformation(scenario.first, scenario.last, scenario.zip);

    const errorMsg = await checkoutPage.getText('[data-test="error"]');
    expect(errorMsg).toContain(scenario.error);
  });
}
```

---

## Method 6: CSV Data (for large datasets)

```javascript
const fs = require('fs');
const path = require('path');

function readCSV(filePath) {
  const content = fs.readFileSync(path.resolve(__dirname, filePath), 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header.trim()] = values[i].trim();
      return obj;
    }, {});
  });
}

const testData = readCSV('../data/test-cases.csv');

for (const data of testData) {
  test(`Test: ${data.scenario}`, async ({ page }) => {
    // Use data.field1, data.field2, etc.
  });
}
```

---

## Test Count Summary for This Project

| File | Data Source | Loop Type | Tests Generated |
|---|---|---|---|
| `auth.spec.js` | `users.json` (5 users) | Single loop | 5 |
| `auth.spec.js` | 10 × 8 invalid combos | Nested loop | 80 |
| `auth.spec.js` | Static | None | 1 |
| `inventory.spec.js` | `products.json` (6 items) | Single loop | 6 |
| `inventory.spec.js` | 4 sort options | Single loop | 4 |
| `purchase_flow.spec.js` | 6 products | Single loop | 6 |
| `purchase_flow.spec.js` | 6 products × 5 variations | Nested loop | 30 |
| `purchase_flow.spec.js` | 5 combinations | Single loop | 5 |
| `negative_tests.spec.js` | 4 scenarios | Single loop | 4 |
| `negative_tests.spec.js` | 3 remove counts | Single loop | 3 |
| `negative_tests.spec.js` | Static | None | 1 |
| | | **Total** | **~145 tests** |

All from just **4 spec files**.

---

## Practice Exercises

1. Add a new user to `users.json` and verify a new test case appears automatically
2. Create a `checkoutData.json` with 10 different address combinations and generate tests from it
3. Write a data-driven test that sorts products by all 4 options and verifies the first AND last item
4. Create a CSV file with login credentials and write a test that reads from it
5. Generate 100+ test cases by combining products, checkout variations, and user types in a triple-nested loop

---

[Next: Hooks, Tags & Annotations →](./12-hooks-tags-annotations.md)
