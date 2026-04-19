# 01 — Installation & Project Setup

[Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Your First Test →](./02-your-first-test.md)

---

## What You Will Learn

- How to install Node.js and Playwright from scratch
- How to understand what gets installed and why
- How to set up a professional project structure
- How environment variables work with `dotenv`

---

## Step 1: Prerequisites

### Install Node.js

Playwright runs on Node.js. You need **Node.js 18+**.

```bash
# Check if Node.js is installed
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

If not installed, download from [https://nodejs.org](https://nodejs.org) (use the LTS version).

### Install VS Code (Recommended)

Download from [https://code.visualstudio.com](https://code.visualstudio.com). Install the **Playwright Test for VS Code** extension for:
- Running tests with one click
- Debugging with breakpoints
- Picking locators visually

---

## Step 2: Create a New Playwright Project

### Option A: Start from scratch (recommended for learning)

```bash
# Create a new folder
mkdir my-playwright-project
cd my-playwright-project

# Initialize Playwright — this is the official way
npm init playwright@latest
```

The installer will ask you:
- **TypeScript or JavaScript?** — Choose JavaScript for this guide (our project uses JS)
- **Where to put tests?** — `tests` or `src/tests` (our project uses `src/tests`)
- **Add a GitHub Actions workflow?** — Yes (you'll learn this in Phase 6)
- **Install Playwright browsers?** — Yes

### What gets installed

```
node_modules/
├── @playwright/test     # The test runner + assertion library
├── playwright-core       # The browser automation engine
```

Three browsers get downloaded to a cache folder:
- **Chromium** (Chrome/Edge engine)
- **Firefox** (Gecko engine)
- **WebKit** (Safari engine)

```bash
# See where browsers are stored
npx playwright install --dry-run
```

### Option B: Clone this project (to follow along with examples)

```bash
git clone <this-repo-url>
cd playwright-javascript-sample
npm install
npx playwright install
```

---

## Step 3: Understanding package.json

This is the heart of any Node.js project. Here's what our project uses:

```json
{
  "name": "playwright-javascript-sample",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "test": "npx playwright test; npm run report:generate && npm run report:open",
    "test:smoke": "npx playwright test --grep @smoke",
    "test:sanity": "npx playwright test --grep @sanity",
    "test:regression": "npx playwright test --grep @regression",
    "test:e2e": "npx playwright test --grep @e2e",
    "report:generate": "npx allure generate allure-results --clean -o allure-report",
    "report:open": "npx allure open allure-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.59.1",
    "allure-commandline": "^2.38.1",
    "allure-playwright": "^3.7.1",
    "dotenv": "^17.4.1"
  },
  "dependencies": {
    "axios": "^1.15.0"
  }
}
```

### Key fields explained

| Field | Purpose |
|---|---|
| `"type": "commonjs"` | Uses `require()` syntax instead of `import`. Our project uses CommonJS. |
| `"scripts"` | Shortcuts you run with `npm run <name>`. E.g., `npm run test:smoke` |
| `"devDependencies"` | Packages needed only for development/testing (not shipped to production) |
| `"dependencies"` | Packages needed at runtime. `axios` is used for HTTP calls (Jira, Teams) |

### Why each dependency exists

| Package | Why We Use It |
|---|---|
| `@playwright/test` | The main test framework — includes test runner, assertions, browser control |
| `allure-playwright` | Generates detailed Allure report data from test results |
| `allure-commandline` | CLI to build and serve the Allure HTML report |
| `dotenv` | Loads `.env` file variables into `process.env` (passwords, URLs) |
| `axios` | HTTP client for sending notifications to Teams/Jira |

---

## Step 4: Environment Variables with dotenv

**Never hardcode passwords or secrets in your code.** Use a `.env` file:

```bash
# .env (at project root — add this to .gitignore!)
BASE_URL=https://www.saucedemo.com
PASSWORD=secret_sauce
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
JIRA_API_URL=https://your-org.atlassian.net
JIRA_API_TOKEN=base64encodedtoken
JIRA_PROJECT_KEY=QA
```

In your config or code, `dotenv` loads these automatically:

```javascript
// playwright.config.js — first line
require('dotenv').config();

// Now you can use:
process.env.BASE_URL      // "https://www.saucedemo.com"
process.env.PASSWORD       // "secret_sauce"
```

### Security rules

1. **Always** add `.env` to `.gitignore`
2. **Never** commit real passwords to version control
3. In CI/CD, use **GitHub Secrets** or **environment variables** instead of `.env` files
4. Create a `.env.example` file with placeholder values for documentation

```bash
# .env.example (safe to commit)
BASE_URL=https://www.saucedemo.com
PASSWORD=your_password_here
```

---

## Step 5: Understanding the Project Structure

A professional Playwright project separates concerns into clear folders:

```
src/
├── data/          # Test data files (JSON, CSV)
│   ├── users.json
│   └── products.json
├── fixtures/      # Custom test fixtures (dependency injection)
│   └── baseTest.js
├── pages/         # Page Object Model classes
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   └── CheckoutPage.js
├── tests/         # Test specification files
│   ├── auth.spec.js
│   ├── inventory.spec.js
│   ├── purchase_flow.spec.js
│   └── negative_tests.spec.js
└── utils/         # Shared utilities
    ├── CustomReporter.js
    └── NotificationUtil.js
```

### Why this structure matters

| Folder | Principle | Benefit |
|---|---|---|
| `data/` | Separation of data and logic | Change test data without touching code |
| `pages/` | Single Responsibility (SOLID) | Each page = one file. UI change = one file update |
| `fixtures/` | Dependency Injection | Tests receive ready-to-use objects, no manual setup |
| `tests/` | Test clarity | Each spec file covers one business domain |
| `utils/` | Reusability | Shared code lives in one place |

---

## Practice Exercise

1. Create a brand new Playwright project with `npm init playwright@latest`
2. Create a `.env` file with `BASE_URL=https://www.saucedemo.com`
3. Install `dotenv` with `npm install dotenv`
4. Verify the setup by running `npx playwright test` (the example tests should pass)
5. Explore the generated folder structure and compare it with this project

---

[Next: Your First Test →](./02-your-first-test.md)
