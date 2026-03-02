# Reporting

Configuring HTML, JSON, and JUnit reporters for `@cucumber/cucumber` + Playwright.

---

## Configuring Formatters in cucumber.js

Multiple formatters can run simultaneously. List them all in the `format` array:

```javascript
// cucumber.js
module.exports = {
  default: {
    format: [
      'progress',                              // Console: dot per step
      'html:reports/cucumber-report.html',     // HTML report with embedded screenshots
      'json:reports/cucumber-report.json',     // JSON for CI dashboards / custom parsing
    ],
    publishQuiet: true,
  },

  regression: {
    format: [
      'progress',
      'html:reports/regression-report.html',
      'json:reports/regression-report.json',
      'junit:reports/junit-report.xml',        // JUnit XML for Jenkins / GitHub Actions
    ],
    publishQuiet: true,
  },
};
```

---

## Available Formatters

| Formatter | Output | Best for |
|-----------|--------|----------|
| `progress` | Console dots (`.` pass, `F` fail, `U` undefined) | CI console output |
| `summary` | Console summary only | Minimal CI output |
| `html:<path>` | HTML file with embedded screenshots | Local debugging, stakeholder reports |
| `json:<path>` | JSON file | Custom dashboards, CI artifact parsing |
| `junit:<path>` | JUnit XML | Jenkins, GitHub Actions test results |
| `@cucumber/pretty-formatter` | Colorized console output | Local development (install separately) |

---

## Embedding Screenshots on Failure

Screenshots are attached to the HTML report via `this.attach()` in the `After` hook. No external image files are needed — they are base64-embedded directly in the HTML.

```typescript
// tests/hooks.ts
import { After, Status } from '@cucumber/cucumber';
import { PlaywrightWorld } from '../utils/world';

After(async function (this: PlaywrightWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    // Screenshot embedded in HTML report
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, 'image/png');

    // Page HTML for DOM inspection
    const html = await this.page.content();
    this.attach(html, 'text/html');

    // Current URL for context
    this.attach(`Failed at URL: ${this.page.url()}`, 'text/plain');
  }
});
```

---

## Attaching Custom Data

`this.attach()` can embed any data type in the report:

```typescript
// Attach text logs
this.attach(`Response status: ${response.status()}`, 'text/plain');

// Attach JSON payload
const body = await response.json();
this.attach(JSON.stringify(body, null, 2), 'application/json');

// Attach screenshot (always)
const screenshot = await this.page.screenshot();
this.attach(screenshot, 'image/png');

// Attach video (if recorded)
const video = this.page.video();
if (video) {
  const path = await video.path();
  this.attach(`Video: ${path}`, 'text/plain');
}
```

---

## GitHub Actions CI — Uploading Reports as Artifacts

```yaml
# .github/workflows/cucumber.yml
name: Cucumber BDD Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          HEADLESS: 'true'

      - name: Upload Cucumber report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cucumber-report
          path: reports/
          retention-days: 14
```

---

## Pretty Formatter (Optional — Local Dev Only)

Install for colorized console output during local development:

```bash
npm install --save-dev @cucumber/pretty-formatter
```

Add to a local profile (do not use in CI — it does not buffer output correctly with `--parallel`):

```javascript
// cucumber.js
module.exports = {
  local: {
    require:       ['tests/hooks.ts', 'step_definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format:        ['@cucumber/pretty-formatter'],
    paths:         ['features/**/*.feature'],
    publishQuiet:  true,
  },
};
```

```bash
npx cucumber-js --profile local
```

---

## Quick Reference

| Goal | Config |
|------|--------|
| HTML report | `'html:reports/cucumber-report.html'` |
| JSON report | `'json:reports/cucumber-report.json'` |
| JUnit XML | `'junit:reports/junit-report.xml'` |
| Console dots | `'progress'` |
| Console summary | `'summary'` |
| Embed screenshot | `this.attach(screenshot, 'image/png')` in `After` |
| Suppress Cloud prompt | `publishQuiet: true` in every profile |
| CI artifact | `actions/upload-artifact@v4` with `path: reports/` |
