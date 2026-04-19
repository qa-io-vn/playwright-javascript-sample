import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { Env } from '@core/config/Environment';

/**
 * Action/Service layer - composes page objects into business workflows.
 * Keeps tests declarative and promotes reuse across suites.
 */
export class AuthActions {
  constructor(
    private readonly loginPage: LoginPage,
    private readonly inventoryPage: InventoryPage,
  ) {}

  async loginAs(username: string, password: string = Env.defaultPassword): Promise<void> {
    await this.loginPage.goto();
    await this.loginPage.login(username, password);
    await this.inventoryPage.waitForLoad();
  }

  async loginAsStandardUser(): Promise<void> {
    await this.loginAs(Env.defaultUser, Env.defaultPassword);
  }
}
