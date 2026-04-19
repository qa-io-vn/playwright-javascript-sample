# 29 — Notifications: Slack, Teams, Jira

[← Previous: Allure Reporting](./28-allure-reporting.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Best Practices →](./30-production-monitoring-and-best-practices.md)

---

## What You Will Learn

- How our project sends notifications to MS Teams
- How to auto-create Jira bugs for test failures
- How to set up Slack notifications
- How these integrations work through the Custom Reporter

---

## Architecture

```
Test Run Finishes
  └── CustomReporter.onEnd()
      └── NotificationUtil.sendTeamsNotification(summary)
  └── CustomReporter.onTestEnd() [on failure]
      └── NotificationUtil.logJiraBug(title, error)
```

---

## MS Teams Notifications

### How our project does it

```javascript
// src/utils/NotificationUtil.js
async sendTeamsNotification(summary) {
  if (!this.teamsWebhook) return;

  const message = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": summary.status === 'passed' ? "0076D7" : "FF0000",
    "summary": "Playwright Test Execution Summary",
    "sections": [{
      "activityTitle": `Playwright Tests: ${summary.status.toUpperCase()}`,
      "activitySubtitle": "Project: SauceDemo Automation",
      "facts": [
        { "name": "Total Tests", "value": summary.total.toString() },
        { "name": "Passed", "value": summary.passed.toString() },
        { "name": "Failed", "value": summary.failed.toString() },
        { "name": "Duration", "value": `${Math.round(summary.duration / 1000)}s` }
      ],
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "View Allure Report",
      "targets": [{ "os": "default", "uri": process.env.ALLURE_REPORT_URL || '#' }]
    }]
  };

  await axios.post(this.teamsWebhook, message);
}
```

### Setup

1. In MS Teams, create an **Incoming Webhook** connector for your channel
2. Copy the webhook URL
3. Add to `.env` or GitHub Secrets: `TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...`

---

## Jira Bug Auto-Creation

### How our project does it

```javascript
// src/utils/NotificationUtil.js
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

  await axios.post(`${this.jiraApiUrl}/rest/api/3/issue`, data, {
    headers: {
      'Authorization': `Basic ${this.jiraAuth}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### When it triggers

```javascript
// src/utils/CustomReporter.js
async onTestEnd(test, result) {
  if (result.status === 'failed') {
    // Only in CI, only for regression tests
    if (process.env.CI && test.title.includes('@regression')) {
      await notificationUtil.logJiraBug(test.title, result.error.message);
    }
  }
}
```

### Setup

1. Create a Jira API token: [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Base64 encode: `echo -n "email@company.com:your-api-token" | base64`
3. Add environment variables:
   ```
   JIRA_API_URL=https://your-org.atlassian.net
   JIRA_API_TOKEN=base64encodedstring
   JIRA_PROJECT_KEY=QA
   ```

---

## Slack Notifications

### Setup a Slack webhook

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. Enable **Incoming Webhooks**
3. Add webhook to your channel
4. Copy the URL

### Implementation

```javascript
const axios = require('axios');

async function sendSlackNotification(summary) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = summary.failed === 0 ? ':white_check_mark:' : ':x:';
  const color = summary.failed === 0 ? '#36a64f' : '#ff0000';

  const payload = {
    attachments: [{
      color,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Playwright Test Results`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Total:*\n${summary.total}` },
            { type: 'mrkdwn', text: `*Passed:*\n${summary.passed}` },
            { type: 'mrkdwn', text: `*Failed:*\n${summary.failed}` },
            { type: 'mrkdwn', text: `*Duration:*\n${Math.round(summary.duration / 1000)}s` },
          ],
        },
      ],
    }],
  };

  await axios.post(webhookUrl, payload);
}
```

---

## Deduplication: Avoid Duplicate Jira Bugs

```javascript
async logJiraBug(testTitle, errorLog) {
  // Search for existing bug first
  const searchQuery = `project = ${process.env.JIRA_PROJECT_KEY} AND summary ~ "${testTitle}" AND status != Done`;
  const searchResponse = await axios.get(
    `${this.jiraApiUrl}/rest/api/3/search?jql=${encodeURIComponent(searchQuery)}`,
    { headers: { 'Authorization': `Basic ${this.jiraAuth}` } }
  );

  if (searchResponse.data.total > 0) {
    console.log(`Jira bug already exists for: ${testTitle}`);
    // Optionally add a comment to the existing bug
    const issueKey = searchResponse.data.issues[0].key;
    await axios.post(
      `${this.jiraApiUrl}/rest/api/3/issue/${issueKey}/comment`,
      { body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: `Failed again: ${errorLog}` }] }] } },
      { headers: { 'Authorization': `Basic ${this.jiraAuth}`, 'Content-Type': 'application/json' } }
    );
    return;
  }

  // Create new bug only if none exists
  // ... (existing creation code)
}
```

---

## Environment Variables Summary

| Variable | Purpose | Where to Set |
|---|---|---|
| `TEAMS_WEBHOOK_URL` | MS Teams incoming webhook URL | GitHub Secrets |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | GitHub Secrets |
| `JIRA_API_URL` | Jira instance URL | GitHub Secrets |
| `JIRA_API_TOKEN` | Base64(email:api-token) | GitHub Secrets |
| `JIRA_PROJECT_KEY` | Project key (e.g., "QA") | GitHub Secrets |
| `ALLURE_REPORT_URL` | URL to deployed Allure report | GitHub Secrets |

---

## Practice Exercises

1. Read `src/utils/NotificationUtil.js` and trace the full notification flow
2. Set up a Slack workspace and create a test webhook
3. Build a Slack reporter that sends notifications on test completion
4. Add deduplication logic to the Jira bug creation
5. Add failure screenshots as Jira attachments using the Jira REST API

---

[Next: Production Monitoring & Best Practices →](./30-production-monitoring-and-best-practices.md)
