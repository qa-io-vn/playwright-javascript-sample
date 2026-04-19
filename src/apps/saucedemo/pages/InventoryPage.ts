import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/base/BasePage';
import { HeaderComponent } from '../components/HeaderComponent';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage extends BasePage {
  readonly url = '/inventory.html';
  readonly header: HeaderComponent;
  protected readonly pageIdentifier: Locator;

  private readonly items: Locator;
  private readonly itemNames: Locator;
  private readonly itemPrices: Locator;
  private readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.pageIdentifier = page.locator('[data-test="inventory-container"]');
    this.items = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="inventory-item-price"]');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
  }

  async addItemToCartByIndex(index = 0): Promise<void> {
    await this.items.nth(index).locator('button[id^="add-to-cart"]').click();
  }

  async addItemToCartByName(name: string): Promise<void> {
    const item = this.items.filter({ hasText: name });
    await item.locator('button[id^="add-to-cart"]').click();
  }

  async getItemName(index = 0): Promise<string> {
    return (await this.itemNames.nth(index).textContent()) ?? '';
  }

  async getItemPrice(index = 0): Promise<string> {
    return (await this.itemPrices.nth(index).textContent()) ?? '';
  }

  async findPriceByName(name: string): Promise<string | null> {
    const count = await this.items.count();
    for (let i = 0; i < count; i++) {
      const n = (await this.items.nth(i).locator('[data-test="inventory-item-name"]').textContent()) ?? '';
      if (n === name) {
        return (await this.items.nth(i).locator('[data-test="inventory-item-price"]').textContent()) ?? '';
      }
    }
    return null;
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }
}
