# Tags & Profiles

Controlling which scenarios run and how, using Cucumber tags and `cucumber.js` profiles.

---

## Tags in Feature Files

Tags are applied with `@` prefix. They cascade from Feature to all its Scenarios.

```gherkin
@checkout @regression          ← inherited by ALL scenarios in this feature
Feature: Checkout Flow

  @smoke                       ← this scenario also gets @checkout and @regression
  Scenario: Complete checkout with credit card
    Given the user has items in the cart
    When the user completes the checkout with a valid credit card
    Then the order confirmation page should be displayed

  @wip                         ← work in progress — excluded from CI
  Scenario: Checkout with PayPal
    ...

  @negative @edge-case
  Scenario: Checkout fails with expired card
    ...
```

**Recommended tag taxonomy:**

| Category | Tags | Purpose |
|----------|------|---------|
| Domain | `@auth`, `@checkout`, `@catalog`, `@profile`, `@orders` | What area the test covers |
| Run level | `@smoke`, `@regression`, `@sanity` | When the test should run |
| Status | `@wip`, `@flaky`, `@skip` | Development/stability state |
| Type | `@positive`, `@negative`, `@edge-case` | Nature of the test case |

> Every scenario should have at least one domain tag and one run-level tag.

---

## Tag Expressions

Used in `cucumber.js` profiles and CLI to filter scenarios:

| Expression | Meaning |
|------------|---------|
| `@smoke` | Only scenarios tagged `@smoke` |
| `@smoke and @auth` | Must have both tags |
| `@smoke or @sanity` | Must have at least one |
| `@regression and not @wip` | Regression, excluding work-in-progress |
| `not @skip` | Everything except `@skip` |

---

## cucumber.js — Multi-Profile Configuration

```javascript
// cucumber.js (project root)
const common = {
  require:       ['tests/hooks.ts', 'step_definitions/**/*.ts'],
  requireModule: ['ts-node/register'],
  publishQuiet:  true,
};

module.exports = {
  // Default — runs everything except @wip
  default: {
    ...common,
    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    paths: ['features/**/*.feature'],
    tags:  'not @wip',
  },

  // Smoke — fast subset for every deploy
  smoke: {
    ...common,
    format: [
      'progress',
      'html:reports/smoke-report.html',
    ],
    paths: ['features/**/*.feature'],
    tags:  '@smoke and not @wip',
  },

  // Regression — full suite for nightly / pre-release
  regression: {
    ...common,
    format: [
      'progress',
      'html:reports/regression-report.html',
      'json:reports/regression-report.json',
      'junit:reports/junit-report.xml',
    ],
    paths:    ['features/**/*.feature'],
    tags:     '@regression and not @wip',
    parallel: 4,
  },

  // Sanity — critical path only, fastest possible
  sanity: {
    ...common,
    format: ['progress', 'html:reports/sanity-report.html'],
    paths:  ['features/**/*.feature'],
    tags:   '@sanity',
  },
};
```

---

## Running Profiles

```bash
# Run default profile (all non-wip tests)
npm test
npx cucumber-js

# Run smoke profile
npm run test:smoke
npx cucumber-js --profile smoke

# Run regression profile (parallel)
npm run test:regression
npx cucumber-js --profile regression

# Ad-hoc tag from CLI (overrides profile tags)
npx cucumber-js --tags "@auth and not @wip"

# Run against staging environment
BASE_URL=https://staging.example.com npm run test:smoke

# Run headed (visible browser)
HEADLESS=false npm run test:smoke
```

---

## Parallel Execution

Add `parallel` to any profile in `cucumber.js`:

```javascript
regression: {
  ...common,
  parallel: 4,   // 4 worker processes
  // ...
}
```

Or via CLI:
```bash
npx cucumber-js --parallel 4
```

**How it works:** Each worker is a separate Node.js process. Scenarios (not steps) are distributed across workers. Each worker has its own `World` instance — there is no shared state between workers.

**Parallel gotchas:**

| Issue | Solution |
|-------|---------|
| `BeforeAll`/`AfterAll` run once **per worker**, not globally | Use external resource (DB/API) for true global setup |
| Port conflicts if your app starts per-worker | Use a shared running test server |
| Flaky tests amplified by parallelism | Fix flakiness before enabling parallel |
| File system write conflicts | Each profile writes to a distinct report file |

---

## Quick Reference

| Goal | Config / Command |
|------|-----------------|
| Run a profile | `npx cucumber-js --profile <name>` |
| Filter by tag | `npx cucumber-js --tags "@smoke"` |
| Exclude a tag | `tags: 'not @wip'` |
| Combine tags (AND) | `tags: '@smoke and @auth'` |
| Combine tags (OR) | `tags: '@smoke or @sanity'` |
| Parallel workers | `parallel: 4` in profile or `--parallel 4` CLI |
| Override base URL | `BASE_URL=https://staging.example.com npm test` |
