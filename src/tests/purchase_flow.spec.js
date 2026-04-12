const { test, expect } = require('../fixtures/baseTest');
const products = require('../data/products.json');

/**
 * Data-driven Purchase Flow Tests
 */
test.describe('Business Logic: Purchase Flow @e2e', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);
  });

  // Test single purchase for every item (6 cases)
  for (const [index, product] of products.entries()) {
    test(`Purchase: Complete Flow for ${product.name} @smoke`, async ({ inventoryPage, cartPage, checkoutPage }) => {
      await inventoryPage.addItemToCart(index); // Add specific item
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

  // Test checkout permutations (30 cases - 6 products * 5 fields variations)
  const checkoutVariations = [
    { first: 'A', last: 'B', zip: '123' },
    { first: 'VeryLongFirstNameThatIsMoreThanFiftyCharsLongToTestLimits', last: 'Last', zip: '12345' },
    { first: 'John', last: 'VeryLongLastNameThatIsMoreThanFiftyCharsLongToTestLimits', zip: '12345' },
    { first: 'Special-Chars!@#', last: 'Doe', zip: '90210' },
    { first: 'Numbers123', last: 'Last456', zip: 'ABCDE' }
  ];

  for (const [pIndex, product] of products.entries()) {
    for (const [vIndex, data] of checkoutVariations.entries()) {
      test(`Purchase: Checkout Permutation - Product ${pIndex} with Var ${vIndex}`, async ({ inventoryPage, cartPage, checkoutPage }) => {
        await inventoryPage.addItemToCart(pIndex);
        await inventoryPage.navigateToCart();
        await cartPage.checkout();
        await checkoutPage.fillInformation(data.first, data.last, data.zip);
        await checkoutPage.finish();
        const completeHeader = await checkoutPage.getCompleteHeaderText();
        expect(completeHeader).toBe('Thank you for your order!');
      });
    }
  }

  // Multi-item purchase (many permutations)
  const itemCombinations = [
    [0, 1], [0, 2], [1, 2], [3, 4, 5], [0, 1, 2, 3, 4, 5]
  ];

  for (const combination of itemCombinations) {
    test(`Purchase: Multi-item Combination - [${combination.join(',')}] @regression`, async ({ inventoryPage, cartPage, checkoutPage }) => {
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
});
