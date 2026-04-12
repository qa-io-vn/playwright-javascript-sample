const notificationUtil = require('./NotificationUtil');

/**
 * Custom Playwright Reporter
 * - MS Teams Notifications
 * - Jira Bug Logging on Failure
 */
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
      
      // Auto-Log Bug in Jira for Regression test failures in CI
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
