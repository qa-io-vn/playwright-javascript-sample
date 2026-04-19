import { Locator, Page } from '@playwright/test';

/**
 * Deterministic wait helpers - no magic timeouts.
 */
export class WaitHelper {
  static async forVisible(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  static async forHidden(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  static async forUrl(page: Page, pattern: RegExp, timeout = 10_000): Promise<void> {
    await page.waitForURL(pattern, { timeout });
  }
}
