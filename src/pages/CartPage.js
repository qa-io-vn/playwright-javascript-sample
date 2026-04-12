const BasePage = require('./BasePage');

/**
 * CartPage class for SauceDemo
 */
class CartPage extends BasePage {
  constructor(page) {
    super(page);
    this.cartItem = '[data-test="inventory-item"]';
    this.cartItemName = '[data-test="inventory-item-name"]';
    this.checkoutButton = '[data-test="checkout"]';
    this.continueShoppingButton = '[data-test="continue-shopping"]';
    this.removeButton = '[data-test^="remove-"]';
  }

  async getCartItems() {
    return await this.page.$$(this.cartItem);
  }

  async getCartItemNames() {
    const names = await this.page.$$(this.cartItemName);
    const itemNames = [];
    for (const name of names) {
      itemNames.push(await name.textContent());
    }
    return itemNames;
  }

  async checkout() {
    await this.click(this.checkoutButton);
  }

  async removeItem(index = 0) {
    const buttons = await this.page.$$(this.removeButton);
    if (buttons.length > index) {
      await buttons[index].click();
    }
  }
}

module.exports = CartPage;
