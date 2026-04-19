import { Page, Locator } from '@playwright/test';
import { BaseComponent } from '@core/base/BaseComponent';

/** Reusable header (cart badge + menu) across authenticated pages. */
export class HeaderComponent extends BaseComponent {
  private readonly cartBadge: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    const root = page.locator('[data-test="primary-header"]');
    super(page, root);
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
  }

  async getCartCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) return 0;
    const text = (await this.cartBadge.textContent()) ?? '0';
    return Number.parseInt(text, 10);
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
