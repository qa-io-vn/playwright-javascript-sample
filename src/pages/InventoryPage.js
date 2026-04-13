const BasePage = require('./BasePage');

/**
 * InventoryPage class for SauceDemo
 */
class InventoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.inventoryItem = '[data-test="inventory-item"]';
    this.inventoryItemName = '[data-test="inventory-item-name"]';
    this.addToCartButton = 'button[id^="add-to-cart"]';
    this.removeFromCartButton = 'button[id^="remove"]';
    this.cartBadge = '[data-test="shopping-cart-badge"]';
    this.cartLink = '[data-test="shopping-cart-link"]';
    this.sortDropdown = '[data-test="product-sort-container"]';
  }

  async addItemToCart(index = 0) {
    const item = this.page.locator(this.inventoryItem).nth(index);
    const button = item.locator(this.addToCartButton);
    await button.click();
  }

  async getItemName(index = 0) {
    return await this.page.locator(this.inventoryItemName).nth(index).textContent();
  }

  async getCartCount() {
    try {
      // Wait for badge to appear if not there yet (some buffer for CI)
      await this.page.waitForSelector(this.cartBadge, { state: 'visible', timeout: 5000 });
      return await this.page.textContent(this.cartBadge);
    } catch (e) {
      return '0';
    }
  }

  async navigateToCart() {
    await this.click(this.cartLink);
  }

  async sortItems(option) {
    await this.page.selectOption(this.sortDropdown, option);
  }
}

module.exports = InventoryPage;
