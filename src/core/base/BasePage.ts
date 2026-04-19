import { Page, Locator, expect } from '@playwright/test';
import { ILogger, logger } from '../logger/Logger';

/**
 * Abstract BasePage - foundation for all Page Objects.
 *
 * SOLID:
 *  - SRP: navigation & common interactions only.
 *  - OCP: subclasses extend behavior without modifying this class.
 *  - LSP: subclasses must honor the `url` contract.
 *  - ISP: exposes minimal shared surface.
 *  - DIP: depends on the `ILogger` abstraction.
 */
export abstract class BasePage {
  protected readonly logger: ILogger;

  protected constructor(
    protected readonly page: Page,
    logInstance: ILogger = logger,
  ) {
    this.logger = logInstance;
  }

  /** Each page MUST declare its relative URL path. */
  abstract readonly url: string;

  /** Optional unique locator used by `isLoaded()` and `waitForLoad()`. */
  protected abstract readonly pageIdentifier: Locator;

  async goto(): Promise<void> {
    this.logger.info(`Navigating to ${this.url}`);
    await this.page.goto(this.url);
    await this.waitForLoad();
  }

  async waitForLoad(): Promise<void> {
    await expect(this.pageIdentifier).toBeVisible();
  }

  async isLoaded(): Promise<boolean> {
    return this.pageIdentifier.isVisible();
  }

  get rawPage(): Page {
    return this.page;
  }
}
