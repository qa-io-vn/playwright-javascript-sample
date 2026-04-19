import { test, expect } from '@apps/saucedemo/fixtures/saucedemoFixtures';

test.describe('Validation & Negative @regression', () => {
  test.beforeEach(async ({ authActions }) => {
    await authActions.loginAsStandardUser();
  });

  const missingFieldScenarios = [
    { firstName: '', lastName: 'Doe', postalCode: '123', expected: 'First Name is required' },
    { firstName: 'John', lastName: '', postalCode: '123', expected: 'Last Name is required' },
    { firstName: 'John', lastName: 'Doe', postalCode: '', expected: 'Postal Code is required' },
  ];

  for (const scenario of missingFieldScenarios) {
    test(`Checkout rejects missing field → ${scenario.expected}`, async ({
      inventoryPage,
      cartPage,
      checkoutPage,
    }) => {
      await inventoryPage.addItemToCartByIndex(0);
      await inventoryPage.header.openCart();
      await cartPage.proceedToCheckout();
      await checkoutPage.fillInformation(scenario);
      expect(await checkoutPage.getErrorMessage()).toContain(scenario.expected);
    });
  }

  test('Remove all items empties the cart @sanity', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCartByIndex(0);
    await inventoryPage.addItemToCartByIndex(1);
    await inventoryPage.header.openCart();

    while ((await cartPage.getItemCount()) > 0) {
      await cartPage.removeItemAt(0);
    }
    expect(await cartPage.getItemCount()).toBe(0);
  });
});
