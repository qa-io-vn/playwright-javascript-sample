const { test, expect } = require('../fixtures/baseTest');
const users = require('../data/users.json');

/**
 * Data-driven Authentication Tests
 */
test.describe('Business Logic: Authentication @regression', () => {
  
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate('/');
  });

  // Test success login for all valid/problem users
  for (const user of users) {
    test(`Login: Success for ${user.username} (${user.type}) @sanity`, async ({ loginPage, inventoryPage }) => {
      await loginPage.login(user.username, process.env.PASSWORD);
      await expect(inventoryPage.page).toHaveURL(/.*inventory.html/);
    });
  }

  // High volume of invalid combinations (80 cases)
  const invalidUsers = Array.from({ length: 10 }, (_, i) => `user_${i}`);
  const invalidPass = Array.from({ length: 8 }, (_, i) => `pass_${i}`);
  
  for (const u of invalidUsers) {
    for (const p of invalidPass) {
      test(`Login: Invalid combination - User:${u}/Pass:${p}`, async ({ loginPage }) => {
        await loginPage.login(u, p);
        const errorMsg = await loginPage.getErrorMessage();
        expect(errorMsg).toContain('Username and password do not match');
      });
    }
  }

  test('Login: Error for locked out user @smoke', async ({ loginPage }) => {
    await loginPage.login('locked_out_user', process.env.PASSWORD);
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Sorry, this user has been locked out.');
  });
});
