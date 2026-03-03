// cucumber.js — profile configuration for @cucumber/cucumber
// Usage:
//   npx cucumber-js                          (default profile)
//   npx cucumber-js --profile smoke          (smoke profile)
//   npx cucumber-js --profile regression     (regression profile)
//   npx cucumber-js --profile ci             (CI profile)

const common = {
  require: ['tests/hooks.ts', 'step_definitions/**/*.ts'],
  requireModule: ['ts-node/register'],
  publishQuiet: true,
};

module.exports = {
  // ── Default: run all scenarios except @wip ──────────────────────────────
  default: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: 'not @wip',
    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
  },

  // ── Smoke: fast sanity check — @smoke tagged scenarios only ─────────────
  smoke: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: '@smoke and not @wip',
    format: [
      'progress',
      'html:reports/smoke-report.html',
      'json:reports/smoke-report.json',
    ],
  },

  // ── Regression: full suite — @regression tagged scenarios ───────────────
  regression: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: '@regression and not @wip',
    format: [
      'progress',
      'html:reports/regression-report.html',
      'json:reports/regression-report.json',
    ],
  },

  // ── CI: all non-wip with JUnit XML for GitHub Actions ───────────────────
  ci: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: 'not @wip',
    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      'junit:reports/junit-report.xml',
    ],
  },
};
