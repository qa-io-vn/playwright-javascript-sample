const { test, expect } = require('../fixtures/baseTest');
const products = require('../data/products.json');

/**
 * Data-driven Inventory Tests
 */
test.describe('Business Logic: Inventory Management @regression', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
    await loginPage.login('standard_user', process.env.PASSWORD);
  });

  // Verify all products exist and display correct details on inventory page
  for (const product of products) {
    test(`Inventory: Display Product - ${product.name} @sanity`, async ({ inventoryPage }) => {
      const items = await inventoryPage.page.$$(inventoryPage.inventoryItem);
      let found = false;
      for (const item of items) {
        const name = await item.$eval('.inventory_item_name', el => el.textContent);
        if (name === product.name) {
          found = true;
          const price = await item.$eval('.inventory_item_price', el => el.textContent);
          expect(price).toBe(product.price);
        }
      }
      expect(found).toBe(true);
    });
  }

  // Sorting tests for all 4 options
  const sortingOptions = [
    { label: 'Name (A to Z)', value: 'az', firstItem: 'Sauce Labs Backpack' },
    { label: 'Name (Z to A)', value: 'za', firstItem: 'Test.allTheThings() T-Shirt (Red)' },
    { label: 'Price (low to high)', value: 'lohi', firstItem: 'Sauce Labs Onesie' },
    { label: 'Price (high to low)', value: 'hilo', firstItem: 'Sauce Labs Fleece Jacket' }
  ];

  for (const sort of sortingOptions) {
    test(`Inventory: Sort by ${sort.label} @smoke`, async ({ inventoryPage }) => {
      await inventoryPage.sortItems(sort.value);
      const firstItem = await inventoryPage.getItemName(0);
      expect(firstItem).toBe(sort.firstItem);
    });
  }
});
