import { test, expect } from '@apps/saucedemo/fixtures/saucedemoFixtures';
import products from '@apps/saucedemo/data/products.json';
import { Product } from '@core/types';

test.describe('Inventory @regression', () => {
  test.beforeEach(async ({ authActions }) => {
    await authActions.loginAsStandardUser();
  });

  for (const product of products as Product[]) {
    test(`Displays product "${product.name}" with correct price @sanity`, async ({ inventoryPage }) => {
      const price = await inventoryPage.findPriceByName(product.name);
      expect(price).toBe(product.price);
    });
  }

  const sortingCases = [
    { option: 'az', firstItem: 'Sauce Labs Backpack' },
    { option: 'za', firstItem: 'Test.allTheThings() T-Shirt (Red)' },
    { option: 'lohi', firstItem: 'Sauce Labs Onesie' },
    { option: 'hilo', firstItem: 'Sauce Labs Fleece Jacket' },
  ] as const;

  for (const { option, firstItem } of sortingCases) {
    test(`Sorts by ${option} @smoke`, async ({ inventoryPage }) => {
      await inventoryPage.sortBy(option);
      expect(await inventoryPage.getItemName(0)).toBe(firstItem);
    });
  }
});
