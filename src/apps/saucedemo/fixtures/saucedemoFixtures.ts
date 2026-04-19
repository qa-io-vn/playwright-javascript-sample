import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AuthActions } from '../actions/AuthActions';

/**
 * Dependency-injected fixtures (DIP).
 * Each test declares only the objects it needs - Playwright instantiates lazily.
 */
export interface SauceDemoFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  authActions: AuthActions;
}

export const test = base.extend<SauceDemoFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  authActions: async ({ loginPage, inventoryPage }, use) =>
    use(new AuthActions(loginPage, inventoryPage)),
});

export { expect };
