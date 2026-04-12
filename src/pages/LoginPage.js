const BasePage = require('./BasePage');

/**
 * LoginPage class for SauceDemo
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = '[data-test="username"]';
    this.passwordInput = '[data-test="password"]';
    this.loginButton = '[data-test="login-button"]';
    this.errorMessage = '[data-test="error"]';
  }

  async login(username, password) {
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMessage);
  }

  async isErrorMessageDisplayed() {
    return await this.isVisible(this.errorMessage);
  }
}

module.exports = LoginPage;
