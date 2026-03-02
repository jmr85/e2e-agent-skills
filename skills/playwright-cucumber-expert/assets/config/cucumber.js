// cucumber.js — profile configuration for @cucumber/cucumber
// Usage:
//   npx cucumber-js                          (default profile)
//   npx cucumber-js --profile smoke          (smoke profile)
//   npx cucumber-js --profile regression     (regression profile)

const common = {
  require: ['tests/hooks.ts', 'tests/step_definitions/**/*.steps.ts'],
  requireModule: ['ts-node/register'],
  publishQuiet: true,
};

module.exports = {
  // ── Default: run all scenarios ──────────────────────────────────────────
  default: {
    ...common,
    paths: ['tests/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
  },

  // ── Smoke: fast sanity check — @smoke tagged scenarios only ─────────────
  smoke: {
    ...common,
    paths: ['tests/features/**/*.feature'],
    tags: '@smoke',
    format: [
      'progress-bar',
      'html:reports/smoke-report.html',
      'json:reports/smoke-report.json',
    ],
  },

  // ── Regression: full suite — @regression tagged scenarios ───────────────
  regression: {
    ...common,
    paths: ['tests/features/**/*.feature'],
    tags: '@regression',
    format: [
      'progress-bar',
      'html:reports/regression-report.html',
      'json:reports/regression-report.json',
    ],
  },

  // ── CI: lean output for GitHub Actions ──────────────────────────────────
  ci: {
    ...common,
    paths: ['tests/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      'junit:reports/junit-report.xml',
    ],
  },
};
