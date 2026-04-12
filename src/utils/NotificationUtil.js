const axios = require('axios');

/**
 * Utility for external integrations (Teams, Jira)
 * Following SOLID - Integration Service
 */
class NotificationUtil {
  constructor() {
    this.teamsWebhook = process.env.TEAMS_WEBHOOK_URL;
    this.jiraApiUrl = process.env.JIRA_API_URL;
    this.jiraAuth = process.env.JIRA_API_TOKEN; // Base64(email:api_token)
  }

  /**
   * Send notification to MS Teams
   */
  async sendTeamsNotification(summary) {
    if (!this.teamsWebhook) return;
    
    const message = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": summary.status === 'passed' ? "0076D7" : "FF0000",
      "summary": "Playwright Test Execution Summary",
      "sections": [{
        "activityTitle": `Playwright Tests: ${summary.status.toUpperCase()}`,
        "activitySubtitle": `Project: SauceDemo Automation`,
        "facts": [
          { "name": "Total Tests", "value": summary.total.toString() },
          { "name": "Passed", "value": summary.passed.toString() },
          { "name": "Failed", "value": summary.failed.toString() },
          { "name": "Duration", "value": `${Math.round(summary.duration / 1000)}s` }
        ],
        "markdown": true
      }],
      "potentialAction": [{
        "@type": "OpenUri",
        "name": "View Allure Report",
        "targets": [{ "os": "default", "uri": process.env.ALLURE_REPORT_URL || '#' }]
      }]
    };

    try {
      await axios.post(this.teamsWebhook, message);
    } catch (error) {
      console.error('Failed to send Teams notification:', error.message);
    }
  }

  /**
   * Log failure into Jira as a Bug
   */
  async logJiraBug(testTitle, errorLog) {
    if (!this.jiraApiUrl || !this.jiraAuth) return;

    const data = {
      fields: {
        project: { key: process.env.JIRA_PROJECT_KEY },
        summary: `[Playwright Failure] - ${testTitle}`,
        description: `Automated test failed.\n\nError Log:\n${errorLog}`,
        issuetype: { name: "Bug" },
        priority: { name: "Medium" }
      }
    };

    try {
      await axios.post(`${this.jiraApiUrl}/rest/api/3/issue`, data, {
        headers: {
          'Authorization': `Basic ${this.jiraAuth}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to log Jira bug:', error.message);
    }
  }
}

module.exports = new NotificationUtil();
