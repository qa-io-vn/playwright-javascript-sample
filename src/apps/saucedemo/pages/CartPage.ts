import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/base/BasePage';

export class CartPage extends BasePage {
  readonly url = '/cart.html';
  protected readonly pageIdentifier: Locator;

  private readonly cartItems: Locator;
  private readonly cartItemNames: Locator;
  private readonly checkoutButton: Locator;
  private readonly removeButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('[data-test="cart-list"]');
    this.cartItems = page.locator('[data-test="inventory-item"]');
    this.cartItemNames = page.locator('[data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.removeButtons = page.locator('[data-test^="remove-"]');
  }

  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async getItemNames(): Promise<string[]> {
    return this.cartItemNames.allTextContents();
  }

  async removeItemAt(index = 0): Promise<void> {
    await this.removeButtons.nth(index).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
