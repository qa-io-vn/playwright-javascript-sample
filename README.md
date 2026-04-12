# SauceDemo Playwright Automation Framework

A professional-grade test automation framework for [SauceDemo](https://www.saucedemo.com/) using **Playwright**, **JavaScript**, and the **Page Object Model (POM)**. Designed with **SOLID** principles to be clean, readable, and highly reusable.

## 🚀 Key Features
- **Page Object Model (POM)**: Modular and maintainable page abstractions.
- **Parallel Execution**: Configured to run with **5 concurrent workers**.
- **Data-Driven Testing**: Over **145+ test cases** generated via data sets.
- **Multi-Category Suites**: Organized into **Smoke**, **Sanity**, **Regression**, and **E2E**.
- **Allure Reporting**: Detailed visual reports with screenshots/videos on failure.
- **CI/CD**: Integrated with **GitHub Actions**.
- **External Integrations**: Automated **MS Teams** notifications and **Jira** bug logging.

---

## 🛠 Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Allure Commandline](https://www.npmjs.com/package/allure-commandline) (for local report generation)

---

## 📥 Installation

1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright Browsers:
   ```bash
   npx playwright install chromium
   ```

---

## ⚙️ Configuration

### Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
BASE_URL=https://www.saucedemo.com
STANDARD_USER=standard_user
PASSWORD=secret_sauce

# Optional Integrations
TEAMS_WEBHOOK_URL=your_teams_webhook
JIRA_API_URL=your_jira_instance_url
JIRA_API_TOKEN=your_base64_auth_token
JIRA_PROJECT_KEY=PROJ
```

### Browser & Concurrency (`playwright.config.js`)
- **Workers**: Modify `workers: 5` to change concurrency.
- **Browsers**: Currently configured for **Chromium**. Add more in the `projects` array.
- **Timeout**: Global timeout set to **60 seconds** per test.

---

## 🏃 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Suites (By Tag)
- **Smoke Tests**: `npm run test:smoke`
- **Sanity Tests**: `npm run test:sanity`
- **Regression Tests**: `npm run test:regression`
- **E2E Flow Tests**: `npm run test:e2e`

### Run in Headed Mode
```bash
npx playwright test --headed
```

---

## 📊 Reporting

### Local Allure Report
1. Generate the report:
   ```bash
   npm run report:generate
   ```
2. Open the report:
   ```bash
   npm run report:open
   ```

---

## 🤖 CI/CD with GitHub Actions

The workflow is defined in `.github/workflows/playwright.yml`. It triggers on:
- Every `push` to `main/master` branches.
- Pull requests.
- Manual triggers (`workflow_dispatch`).

### Required GitHub Secrets
To enable all features in CI, add these secrets to your GitHub repository:
- `STANDARD_USER`
- `PASSWORD`
- `TEAMS_WEBHOOK_URL` (Optional)
- `JIRA_API_TOKEN` (Optional)

---

## 📁 Project Structure
- `src/pages/`: Page Object classes.
- `src/tests/`: Test specifications organized by business logic.
- `src/fixtures/`: Custom Playwright fixtures (Base test).
- `src/data/`: JSON files for data-driven testing.
- `src/utils/`: Reporters, notification services, and Jira utilities.
