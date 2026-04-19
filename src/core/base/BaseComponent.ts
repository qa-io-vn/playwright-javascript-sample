import { Locator, Page } from '@playwright/test';

/**
 * Abstract BaseComponent - models a reusable UI component (Composite pattern).
 * Scoped to a root `Locator`, enabling reuse across pages (e.g. HeaderComponent).
 */
export abstract class BaseComponent {
  protected constructor(
    protected readonly page: Page,
    protected readonly root: Locator,
  ) {}

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  get locator(): Locator {
    return this.root;
  }
}
