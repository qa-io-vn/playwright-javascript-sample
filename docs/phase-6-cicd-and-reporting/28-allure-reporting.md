# 28 — Allure Reporting

[← Previous: Docker](./27-docker.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Notifications →](./29-notifications.md)

---

## What You Will Learn

- How to set up Allure reports with Playwright
- How to add metadata, steps, and attachments to Allure reports
- How to generate and serve reports
- How to integrate Allure into CI/CD

---

## Setup (Already Done in This Project)

### Dependencies

```json
// package.json
"devDependencies": {
  "allure-playwright": "^3.7.1",
  "allure-commandline": "^2.38.1"
}
```

### Config

```javascript
// playwright.config.js
reporter: [
  ['list'],
  ['allure-playwright', { outputFolder: 'allure-results' }],
],
```

### npm scripts

```json
"scripts": {
  "test": "npx playwright test; npm run report:generate && npm run report:open",
  "report:generate": "npx allure generate allure-results --clean -o allure-report",
  "report:open": "npx allure open allure-report"
}
```

---

## Generate and View Reports

```bash
# Run tests (generates allure-results/)
npx playwright test

# Generate HTML report from results
npx allure generate allure-results --clean -o allure-report

# Open report in browser
npx allure open allure-report

# Or use the shortcut
npm test   # Runs all three commands
```

---

## Adding Metadata to Tests

### Test labels and descriptions

```javascript
const { test, expect } = require('@playwright/test');
const { allure } = require('allure-playwright');

test('purchase flow', async ({ page }) => {
  await allure.owner('QA Team');
  await allure.severity('critical');
  await allure.epic('E-Commerce');
  await allure.feature('Checkout');
  await allure.story('Standard Purchase');
  await allure.description('Tests the complete purchase flow from login to order confirmation.');
  await allure.link('https://jira.company.com/browse/QA-123', 'Jira Ticket');
  await allure.tag('smoke');
  await allure.tag('e2e');

  // Test code...
});
```

### Test steps

```javascript
test('complete purchase', async ({ page }) => {
  await allure.step('Navigate to login page', async () => {
    await page.goto('/');
  });

  await allure.step('Login with valid credentials', async () => {
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
  });

  await allure.step('Add product to cart', async () => {
    await page.locator('button[id^="add-to-cart"]').first().click();
  });

  await allure.step('Complete checkout', async () => {
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.locator('[data-test="checkout"]').click();
    await page.locator('[data-test="firstName"]').fill('John');
    await page.locator('[data-test="lastName"]').fill('Doe');
    await page.locator('[data-test="postalCode"]').fill('12345');
    await page.locator('[data-test="continue"]').click();
    await page.locator('[data-test="finish"]').click();
  });

  await allure.step('Verify order confirmation', async () => {
    await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
  });
});
```

### Attachments

```javascript
test('with screenshots', async ({ page }) => {
  await page.goto('/');

  // Attach screenshot
  const screenshot = await page.screenshot();
  await allure.attachment('Login Page', screenshot, 'image/png');

  // Attach text
  await allure.attachment('Test Data', JSON.stringify({ user: 'admin' }), 'application/json');

  // Attach HTML
  const html = await page.content();
  await allure.attachment('Page Source', html, 'text/html');
});
```

---

## Allure Report Sections

| Section | Shows |
|---|---|
| **Overview** | Pass/fail chart, severity breakdown, duration trends |
| **Suites** | Tests organized by `test.describe` structure |
| **Behaviors** | Tests organized by epic/feature/story |
| **Graphs** | Duration trends, status distribution, timeline |
| **Packages** | Tests organized by file path |
| **Timeline** | Visual timeline showing parallel execution |
| **Categories** | Custom failure categories |
| **Retries** | Tests that passed on retry (flaky) |

---

## Allure Severity Levels

```javascript
await allure.severity('blocker');   // App is unusable
await allure.severity('critical');  // Major feature broken
await allure.severity('normal');    // Standard test
await allure.severity('minor');     // Cosmetic issue
await allure.severity('trivial');   // Minor inconvenience
```

---

## Allure in CI/CD

### GitHub Actions with Allure

```yaml
      - name: Run tests
        run: npx playwright test

      - name: Generate Allure report
        if: always()
        run: npx allure generate allure-results --clean -o allure-report

      - name: Upload Allure report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-report
          path: allure-report/
          retention-days: 30
```

### Allure with history (trend tracking)

```yaml
      # Download previous report's history
      - name: Get Allure history
        uses: actions/download-artifact@v4
        continue-on-error: true
        with:
          name: allure-history
          path: allure-results/history

      - run: npx playwright test

      - name: Generate report with history
        run: npx allure generate allure-results --clean -o allure-report

      # Save history for next run
      - name: Save Allure history
        uses: actions/upload-artifact@v4
        with:
          name: allure-history
          path: allure-report/history/
```

---

## Practice Exercises

1. Run `npm test` and explore the generated Allure report
2. Add `allure.severity()`, `allure.epic()`, and `allure.feature()` to a test
3. Add `allure.step()` to break down a purchase flow test into readable steps
4. Attach a screenshot to the Allure report using `allure.attachment()`
5. Set up Allure report upload in a GitHub Actions workflow

---

[Next: Notifications — Slack, Teams, Jira →](./29-notifications.md)
