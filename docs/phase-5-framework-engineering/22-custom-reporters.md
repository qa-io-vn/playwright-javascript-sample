# 22 — Custom Reporters & Integrations

[← Previous: Custom Fixtures](./21-custom-fixtures-advanced.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Parallelism & Sharding →](./23-parallelism-and-sharding.md)

---

## What You Will Learn

- How Playwright's reporter API works
- How to build a custom reporter from scratch
- How our project integrates with Teams and Jira
- How to combine multiple reporters

---

## Built-in Reporters

```javascript
// playwright.config.js
reporter: [
  ['list'],                // Terminal output — each test on its own line
  ['html'],                // Interactive HTML report
  ['json', { outputFile: 'results.json' }],  // Machine-readable JSON
  ['junit', { outputFile: 'results.xml' }],  // JUnit XML for Jenkins
  ['dot'],                 // Minimal dots (. for pass, F for fail)
  ['line'],                // One line per test, compact
  ['blob'],                // Binary format for merging sharded results
]
```

---

## Custom Reporter API

A reporter is a class with lifecycle hooks:

```javascript
class MyReporter {
  onBegin(config, suite) {
    // Called once when test run starts
    // config = resolved playwright config
    // suite = root suite containing all tests
    console.log(`Starting ${suite.allTests().length} tests`);
  }

  onTestBegin(test, result) {
    // Called when each test starts
    console.log(`Starting: ${test.title}`);
  }

  onTestEnd(test, result) {
    // Called when each test finishes
    // result.status = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted'
    console.log(`Finished: ${test.title} — ${result.status} (${result.duration}ms)`);
  }

  onEnd(result) {
    // Called once when all tests finish
    // result.status = 'passed' | 'failed' | 'timedOut' | 'interrupted'
    console.log(`All done: ${result.status}`);
  }

  onError(error) {
    // Called on global errors (not test failures)
    console.error(`Global error: ${error.message}`);
  }

  onStdOut(chunk, test, result) {
    // Called when test writes to stdout
  }

  onStdErr(chunk, test, result) {
    // Called when test writes to stderr
  }

  onStepBegin(test, result, step) {
    // Called for each step (action) within a test
  }

  onStepEnd(test, result, step) {
    // Called when a step finishes
  }

  onExit() {
    // Called when the reporter is about to be disposed
  }
}

module.exports = MyReporter;
```

---

## Our Project's Custom Reporter

```javascript
// src/utils/CustomReporter.js
const notificationUtil = require('./NotificationUtil');

class CustomReporter {
  constructor(options) {
    this.options = options;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      startTime: 0,
    };
  }

  onBegin(config, suite) {
    this.results.startTime = Date.now();
    this.results.total = suite.allTests().length;
  }

  async onTestEnd(test, result) {
    if (result.status === 'passed') {
      this.results.passed++;
    } else if (result.status === 'failed') {
      this.results.failed++;

      // Auto-create Jira bug for regression failures in CI
      if (process.env.CI && test.title.includes('@regression')) {
        await notificationUtil.logJiraBug(test.title, result.error.message);
      }
    }
  }

  async onEnd(result) {
    this.results.duration = Date.now() - this.results.startTime;
    const summary = {
      ...this.results,
      status: result.status,
    };

    // Send summary to MS Teams
    if (process.env.CI) {
      await notificationUtil.sendTeamsNotification(summary);
    }
  }
}

module.exports = CustomReporter;
```

### Registering the reporter

```javascript
// playwright.config.js
reporter: [
  ['list'],
  ['allure-playwright', { outputFolder: 'allure-results' }],
  ['./src/utils/CustomReporter.js'],   // Relative path to your reporter
],
```

---

## Accessing Test Details in Reporter

```javascript
onTestEnd(test, result) {
  // Test info
  console.log(test.title);              // 'Login: Success for standard_user'
  console.log(test.id);                 // Unique test ID
  console.log(test.location.file);      // '/path/to/auth.spec.js'
  console.log(test.location.line);      // Line number

  // Parent info
  console.log(test.parent.title);       // 'Authentication @regression' (describe name)

  // Result info
  console.log(result.status);           // 'passed' | 'failed' | 'timedOut' | 'skipped'
  console.log(result.duration);         // 1234 (ms)
  console.log(result.retry);            // 0, 1, 2 (which retry attempt)

  // Error info (only for failures)
  if (result.error) {
    console.log(result.error.message);   // Error message
    console.log(result.error.stack);     // Stack trace
  }

  // Attachments (screenshots, traces)
  for (const attachment of result.attachments) {
    console.log(attachment.name);        // 'screenshot', 'trace'
    console.log(attachment.path);        // File path
    console.log(attachment.contentType); // 'image/png', 'application/zip'
  }

  // Annotations
  for (const annotation of test.annotations) {
    console.log(annotation.type);        // 'issue', 'skip', etc.
    console.log(annotation.description); // URL or description
  }
}
```

---

## Example: Slack Reporter

```javascript
const axios = require('axios');

class SlackReporter {
  constructor() {
    this.failures = [];
    this.stats = { total: 0, passed: 0, failed: 0 };
  }

  onBegin(config, suite) {
    this.stats.total = suite.allTests().length;
  }

  onTestEnd(test, result) {
    if (result.status === 'passed') this.stats.passed++;
    if (result.status === 'failed') {
      this.stats.failed++;
      this.failures.push({
        name: test.title,
        error: result.error?.message?.substring(0, 200),
        file: test.location.file.split('/').pop(),
      });
    }
  }

  async onEnd(result) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    const emoji = this.stats.failed === 0 ? ':white_check_mark:' : ':x:';
    const color = this.stats.failed === 0 ? '#36a64f' : '#ff0000';

    const failureText = this.failures
      .map(f => `• \`${f.name}\` (${f.file})\n  ${f.error}`)
      .join('\n');

    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      attachments: [{
        color,
        title: `${emoji} Playwright Results: ${this.stats.passed}/${this.stats.total} passed`,
        text: this.stats.failed > 0
          ? `*Failures:*\n${failureText}`
          : 'All tests passed!',
        footer: `Duration: ${Math.round(result.duration / 1000)}s`,
      }],
    });
  }
}

module.exports = SlackReporter;
```

---

## Example: CSV Reporter

```javascript
const fs = require('fs');

class CSVReporter {
  constructor() {
    this.rows = [['Test Name', 'Status', 'Duration (ms)', 'Error']];
  }

  onTestEnd(test, result) {
    this.rows.push([
      `"${test.title}"`,
      result.status,
      result.duration,
      result.error ? `"${result.error.message.replace(/"/g, '""')}"` : '',
    ]);
  }

  onEnd() {
    const csv = this.rows.map(row => row.join(',')).join('\n');
    fs.writeFileSync('test-results/results.csv', csv);
  }
}

module.exports = CSVReporter;
```

---

## Practice Exercises

1. Read `src/utils/CustomReporter.js` and trace how `onTestEnd` and `onEnd` work
2. Build a simple reporter that writes results to a JSON file
3. Build a reporter that logs the 3 slowest tests at the end
4. Add step-level logging using `onStepBegin` and `onStepEnd`
5. Create a reporter that sends a Slack webhook notification on test failure

---

[Next: Parallelism, Sharding & Performance →](./23-parallelism-and-sharding.md)
