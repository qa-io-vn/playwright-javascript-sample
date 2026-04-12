const BasePage = require('./BasePage');

/**
 * CheckoutPage class for SauceDemo
 */
class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstNameInput = '[data-test="firstName"]';
    this.lastNameInput = '[data-test="lastName"]';
    this.postalCodeInput = '[data-test="postalCode"]';
    this.continueButton = '[data-test="continue"]';
    this.finishButton = '[data-test="finish"]';
    this.cancelButton = '[data-test="cancel"]';
    this.completeHeader = '[data-test="complete-header"]';
    this.summaryTotalLabel = '[data-test="total-label"]';
  }

  async fillInformation(firstName, lastName, postalCode) {
    await this.type(this.firstNameInput, firstName);
    await this.type(this.lastNameInput, lastName);
    await this.type(this.postalCodeInput, postalCode);
    await this.click(this.continueButton);
  }

  async finish() {
    await this.click(this.finishButton);
  }

  async getCompleteHeaderText() {
    return await this.getText(this.completeHeader);
  }

  async getTotalPrice() {
    return await this.getText(this.summaryTotalLabel);
  }

  async cancel() {
    await this.click(this.cancelButton);
  }
}

module.exports = CheckoutPage;
