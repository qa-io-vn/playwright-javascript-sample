# 30 — Production Monitoring & Best Practices

[← Previous: Notifications](./29-notifications.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md)

---

## What You Will Learn

- How to use Playwright for production synthetic monitoring
- The complete best practices checklist for professional SDET work
- Anti-patterns to avoid
- Career growth path and what separates good from great SDETs

---

## Synthetic Monitoring

Run critical tests against production on a schedule to detect outages before users report them.

### GitHub Actions scheduled monitoring

```yaml
name: Production Smoke Tests

on:
  schedule:
    - cron: '*/5 * * * *'    # Every 5 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install chromium --with-deps

      - name: Run smoke tests against production
        run: npx playwright test --grep @smoke --project=chromium
        env:
          BASE_URL: https://www.saucedemo.com
          PASSWORD: ${{ secrets.SAUCEDEMO_PASSWORD }}

      - name: Alert on failure
        if: failure()
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
            -H 'Content-type: application/json' \
            -d '{"text":"🚨 PRODUCTION ALERT: Smoke tests failed! Check GitHub Actions."}'
```

### What to monitor

| Test | Frequency | Priority |
|---|---|---|
| Homepage loads | Every 5 min | P0 |
| Login flow works | Every 5 min | P0 |
| Product page loads | Every 15 min | P1 |
| Checkout completes | Every 30 min | P1 |
| Search returns results | Every 15 min | P1 |
| API health check | Every 1 min | P0 |

---

## Best Practices Checklist

### Test Design

- [ ] Tests are **independent** — can run in any order, any subset
- [ ] Tests are **deterministic** — same result every time
- [ ] Tests are **isolated** — no shared state between tests
- [ ] No hard waits (`waitForTimeout`) — use auto-waiting assertions
- [ ] No `try/catch` around assertions — let them fail naturally
- [ ] Each test tests **one thing** — single responsibility
- [ ] Test names describe the **expected behavior**, not implementation

### Locators

- [ ] Use `getByRole()`, `getByTestId()`, `getByText()` first
- [ ] Avoid XPath unless absolutely necessary
- [ ] Avoid position-based selectors (`nth-child`, `:first-of-type`)
- [ ] Avoid auto-generated CSS class names
- [ ] Request developers add `data-testid` attributes

### Page Objects

- [ ] One class per page/component
- [ ] No assertions inside page objects
- [ ] Methods named after **user actions** (not UI elements)
- [ ] Selectors defined as class properties
- [ ] Inherits from a BasePage for shared methods

### Framework Architecture

- [ ] Fixtures for dependency injection (not `beforeEach` for page objects)
- [ ] Data-driven testing with external data files
- [ ] Environment variables for secrets (never hardcoded)
- [ ] Custom reporters for team notifications
- [ ] Tags for test categorization (`@smoke`, `@regression`)

### CI/CD

- [ ] Tests run on every PR
- [ ] Smoke tests run on every deploy
- [ ] Full regression runs nightly
- [ ] Artifacts uploaded (reports, traces, screenshots)
- [ ] Sharding for large suites
- [ ] Retries only in CI (not locally)
- [ ] `forbidOnly: true` in CI

### Reporting & Observability

- [ ] HTML or Allure report generated
- [ ] Failures notify the team (Slack, Teams)
- [ ] Flaky tests are tracked and fixed
- [ ] Test execution trends are monitored
- [ ] Screenshots and traces captured on failure

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| `page.waitForTimeout(5000)` | Slow, flaky | Use web-first assertions |
| `try/catch` around assertions | Hides real failures | Let assertions fail |
| `test.only()` committed to repo | Skips all other tests | Use `forbidOnly` in CI |
| Shared state between tests | Order-dependent, flaky | Use fixtures for isolation |
| Assertions in page objects | Mixing responsibilities | Keep assertions in tests |
| Hardcoded passwords in code | Security risk | Use env variables |
| `page.$()` / `page.$$()` | Can go stale | Use `page.locator()` |
| Testing implementation details | Brittle tests | Test user-visible behavior |
| Giant test files (500+ lines) | Hard to maintain | Split by feature/flow |
| No tags on tests | Can't run subsets | Tag every test |

---

## What Makes an Expert SDET

### Junior SDET
- Writes tests that pass
- Uses record & playback
- Copy-pastes test patterns
- Fixes tests when they break

### Mid-Level SDET
- Designs page objects
- Uses data-driven testing
- Configures CI/CD pipelines
- Understands flakiness

### Senior SDET
- Architects the entire framework
- Applies SOLID principles
- Builds custom reporters and fixtures
- Mentors junior SDETs
- Optimizes test execution speed
- Integrates with Jira/Slack/Teams

### Staff/Principal SDET
- Designs test strategy for the organization
- Evaluates and selects tools
- Builds reusable testing platforms
- Defines quality gates for releases
- Drives shift-left testing culture
- Contributes to open source testing tools

---

## Career Growth Actions

1. **Contribute to Playwright's GitHub** — Report bugs, answer issues, submit PRs
2. **Build a testing platform** — Don't just write tests, build tools for others to write tests
3. **Learn performance testing** — k6, Artillery, or Playwright's load testing capabilities
4. **Learn accessibility testing** — `@axe-core/playwright` for a11y auditing
5. **Learn security testing basics** — OWASP ZAP integration with Playwright
6. **Present at meetups/conferences** — Share your framework architecture
7. **Write technical articles** — Document patterns you've discovered
8. **Get certified** — ISTQB, or build a public portfolio of test frameworks

---

## Recommended Learning Resources

| Resource | Type | URL |
|---|---|---|
| Playwright Official Docs | Documentation | [playwright.dev/docs](https://playwright.dev/docs/intro) |
| Playwright GitHub | Source Code | [github.com/microsoft/playwright](https://github.com/microsoft/playwright) |
| Playwright Discord | Community | [discord.gg/playwright](https://aka.ms/playwright/discord) |
| Playwright YouTube | Videos | [youtube.com/@playwright](https://www.youtube.com/@playwright) |
| Testing Trophy (Kent C. Dodds) | Philosophy | Understanding test pyramid vs trophy |
| ISTQB Foundation | Certification | Formal testing knowledge |

---

## Final Summary

```
Phase 1: Foundations          → Install, write tests, understand config
Phase 2: Core Concepts        → Locators, actions, assertions, auto-waiting
Phase 3: Intermediate         → POM, fixtures, data-driven, auth
Phase 4: Advanced             → Network mocking, API, visual, emulation, debugging
Phase 5: Framework Engineering → SOLID, custom fixtures/reporters, parallelism, retries
Phase 6: CI/CD & DevOps       → GitHub Actions, Docker, Allure, notifications, monitoring
```

You now have the complete roadmap. Start from Phase 1, build each concept on top of the previous one, and refer to this project's source code as your working reference implementation.

---

**You've completed the guide. Now go build something.**

[← Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md)
