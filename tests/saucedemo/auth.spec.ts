import { test, expect } from '@apps/saucedemo/fixtures/saucedemoFixtures';
import { Env } from '@core/config/Environment';
import users from '@apps/saucedemo/data/users.json';
import { User } from '@core/types';

test.describe('Authentication @regression', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  for (const user of users as User[]) {
    test(`Login succeeds for ${user.username} (${user.type}) @sanity`, async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.login(user.username, Env.defaultPassword);
      await expect(inventoryPage.rawPage).toHaveURL(/.*inventory\.html/);
    });
  }

  test('Locked-out user sees error @smoke', async ({ loginPage }) => {
    await loginPage.login('locked_out_user', Env.defaultPassword);
    expect(await loginPage.getErrorMessage()).toContain('Sorry, this user has been locked out.');
  });

  test('Invalid credentials show error', async ({ loginPage }) => {
    await loginPage.login('invalid_user', 'wrong_pass');
    expect(await loginPage.getErrorMessage()).toContain('Username and password do not match');
  });
});
