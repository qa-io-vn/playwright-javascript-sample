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
    const items = await this.page.$$(this.inventoryItem);
    if (items.length > index) {
      const button = await items[index].$(this.addToCartButton);
      if (button) {
        await button.click();
      }
    }
  }

  async getItemName(index = 0) {
    const names = await this.page.$$(this.inventoryItemName);
    if (names.length > index) {
      return await names[index].textContent();
    }
    return '';
  }

  async getCartCount() {
    const badge = await this.page.$(this.cartBadge);
    if (badge) {
      return await badge.textContent();
    }
    return '0';
  }

  async navigateToCart() {
    await this.click(this.cartLink);
  }

  async sortItems(option) {
    await this.page.selectOption(this.sortDropdown, option);
  }
}

module.exports = InventoryPage;
