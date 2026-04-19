import { test, expect } from '@apps/saucedemo/fixtures/saucedemoFixtures';
import products from '@apps/saucedemo/data/products.json';
import { Product } from '@core/types';

test.describe('Purchase Flow @e2e', () => {
  test.beforeEach(async ({ authActions }) => {
    await authActions.loginAsStandardUser();
  });

  for (const [index, product] of (products as Product[]).entries()) {
    test(`Completes full purchase for "${product.name}" @smoke`, async ({
      inventoryPage,
      cartPage,
      checkoutPage,
    }) => {
      await inventoryPage.addItemToCartByIndex(index);
      await inventoryPage.header.openCart();

      expect(await cartPage.getItemNames()).toContain(product.name);
      await cartPage.proceedToCheckout();

      await checkoutPage.fillInformation({
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '12345',
      });
      await checkoutPage.finish();

      expect(await checkoutPage.getCompleteHeader()).toBe('Thank you for your order!');
    });
  }

  test('Multi-item purchase updates cart badge @regression', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCartByIndex(0);
    await inventoryPage.addItemToCartByIndex(1);
    await inventoryPage.addItemToCartByIndex(2);

    expect(await inventoryPage.header.getCartCount()).toBe(3);

    await inventoryPage.header.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillInformation({ firstName: 'Test', lastName: 'User', postalCode: '00000' });
    await checkoutPage.finish();

    expect(await checkoutPage.getCompleteHeader()).toBe('Thank you for your order!');
  });
});
