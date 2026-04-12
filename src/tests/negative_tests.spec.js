const { test, expect } = require('../fixtures/baseTest');

/**
 * Business Logic: Validation & Negative Scenarios
 */
test.describe('Business Logic: Error Handling & Validations @regression', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);
  });

  // Test missing fields in checkout (many permutations)
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

  // Remove items from cart (permutations)
  const removeCounts = [1, 2, 3];
  for (const count of removeCounts) {
    test(`Cart: Add and remove ${count} items @sanity`, async ({ inventoryPage, cartPage }) => {
      for (let i = 0; i < count; i++) {
        await inventoryPage.addItemToCart(i);
      }
      expect(await inventoryPage.getCartCount()).toBe(count.toString());
      
      await inventoryPage.navigateToCart();
      for (let i = 0; i < count; i++) {
        await cartPage.removeItem(0);
      }
      
      const items = await cartPage.getCartItems();
      expect(items.length).toBe(0);
    });
  }

  test('Cart: Checkout with empty cart (Edge Case)', async ({ inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.navigateToCart();
    await cartPage.checkout();
    await checkoutPage.fillInformation('Empty', 'Cart', '000');
    await checkoutPage.finish();
    expect(await checkoutPage.getCompleteHeaderText()).toBe('Thank you for your order!'); // SauceDemo current behavior
  });
});
