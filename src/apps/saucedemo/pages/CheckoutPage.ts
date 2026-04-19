import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/base/BasePage';
import { CheckoutInfo } from '@core/types';

export class CheckoutPage extends BasePage {
  readonly url = '/checkout-step-one.html';
  protected readonly pageIdentifier: Locator;

  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly postalCode: Locator;
  private readonly continueBtn: Locator;
  private readonly finishBtn: Locator;
  private readonly cancelBtn: Locator;
  private readonly completeHeader: Locator;
  private readonly totalLabel: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.pageIdentifier = page.locator('[data-test="firstName"], [data-test="finish"], [data-test="complete-header"]').first();
    this.firstName = page.locator('[data-test="firstName"]');
    this.lastName = page.locator('[data-test="lastName"]');
    this.postalCode = page.locator('[data-test="postalCode"]');
    this.continueBtn = page.locator('[data-test="continue"]');
    this.finishBtn = page.locator('[data-test="finish"]');
    this.cancelBtn = page.locator('[data-test="cancel"]');
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async fillInformation(info: CheckoutInfo): Promise<void> {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
    await this.continueBtn.click();
  }

  async finish(): Promise<void> {
    await this.finishBtn.click();
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }

  async getCompleteHeader(): Promise<string> {
    return (await this.completeHeader.textContent()) ?? '';
  }

  async getTotalLabel(): Promise<string> {
    return (await this.totalLabel.textContent()) ?? '';
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
