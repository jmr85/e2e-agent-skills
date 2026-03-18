# Feature Files — Gherkin for Selenium + Cucumber Java

Gherkin is the language that makes your tests readable by everyone on the team — developers, testers, product owners, and stakeholders. Well-written feature files document business behavior, not implementation details.

---

## Core syntax

```gherkin
Feature: Short description of the business capability
  (Optional) Longer description of what this feature does,
  who uses it, and why it matters.

  Background:
    # Steps that run before every scenario in this file
    Given the user is on the login page

  Scenario: Successful login with valid credentials
    When the user enters username "john.doe@example.com" and password "secret123"
    And clicks the login button
    Then they should be redirected to the dashboard
    And the welcome message should show "Welcome, John"

  Scenario Outline: Login fails with invalid credentials
    When the user enters username "<username>" and password "<password>"
    And clicks the login button
    Then an error message "<error>" should be displayed

    Examples:
      | username              | password   | error                        |
      | invalid@example.com   | secret123  | Invalid email or password    |
      | john.doe@example.com  | wrongpass  | Invalid email or password    |
      | ""                    | secret123  | Email is required            |
```

---

## Gherkin keywords reference

| Keyword | Purpose |
|---|---|
| `Feature` | Groups related scenarios; describes a business capability |
| `Background` | Steps run before each scenario in the file (avoid overusing — if backgrounds get complex, split the feature) |
| `Scenario` | A single concrete example of the feature behavior |
| `Scenario Outline` | Parameterized scenario; paired with `Examples` table |
| `Examples` | Data table for `Scenario Outline`; each row is one test run |
| `Given` | Sets up initial state (preconditions) |
| `When` | Describes user action or system event |
| `Then` | Describes observable outcome (assertion lives here in Java) |
| `And` / `But` | Continues the previous keyword's meaning (readability connectors) |
| `@tag` | Labels scenarios for filtering (`@smoke`, `@regression`, `@wip`) |
| `#` | Comment |

---

## DataTable

Use DataTables when a step needs structured data:

```gherkin
Scenario: Register a new user with complete profile
  Given the registration form is open
  When the user fills in the form with:
    | Field       | Value                  |
    | First Name  | John                   |
    | Last Name   | Doe                    |
    | Email       | john.doe@example.com   |
    | Phone       | +1-555-0100            |
  And submits the registration
  Then the account should be created successfully
```

In Java, consume the DataTable as a `Map<String, String>` or `List<Map<String, String>>` — see `references/step-definitions.md`.

---

## DocString

Use DocStrings for multi-line string content (JSON payloads, long messages, HTML snippets):

```gherkin
Scenario: Preview email content before sending
  Given the user has composed a notification
  When they preview the email body:
    """
    Dear {{name}},

    Your order #{{order_id}} has been shipped.
    Expected delivery: {{date}}
    """
  Then the preview should render all placeholders correctly
```

---

## Tags and filtering

```gherkin
@smoke @auth
Scenario: Login with valid credentials
  ...

@regression @wip
Scenario: Login with expired session token
  ...
```

Run specific tags:
```bash
mvn verify -Dcucumber.filter.tags="@smoke"
mvn verify -Dcucumber.filter.tags="@smoke and not @wip"
mvn verify -Dcucumber.filter.tags="@regression or @smoke"
```

**Recommended tag taxonomy:**

| Tag | Meaning |
|---|---|
| `@smoke` | Critical happy paths — run on every build |
| `@regression` | Full regression suite — run nightly |
| `@wip` | Work in progress — exclude from CI |
| `@slow` | Tests that take >30s — skip in fast feedback loops |
| `@negative` | Error/edge case scenarios |
| `@[module]` | e.g., `@checkout`, `@auth` — for feature-level filtering |

---

## Rules for writing good Gherkin

**Write at the business level, not the UI level.** The scenario should describe what the user is trying to accomplish, not how the UI is structured.

Good:
```gherkin
When the user completes the checkout process
Then the order confirmation should be displayed
```

Avoid:
```gherkin
When the user clicks the blue button labeled "Continue"
And fills field id="card-number" with "4111111111111111"
```

**Keep scenarios independent.** Each scenario should be able to run in any order. Shared state between scenarios causes flaky tests that are a nightmare to debug.

**One behavior per scenario.** Don't test three different things in one scenario — when it fails, you won't know which behavior broke.

**Use Background for true preconditions, not setup.** If every scenario in the file genuinely needs the same starting state, `Background` makes sense. If only half the scenarios need it, split the file.

**Scenario Outline for data-driven tests.** When the same flow needs to be tested with many different inputs, use Outline + Examples instead of copy-pasting scenarios.

---

## File organization

Mirror your page/domain structure in your feature files:

```
resources/features/
├── auth/
│   ├── login.feature
│   └── registration.feature
├── checkout/
│   ├── cart.feature
│   └── payment.feature
└── profile/
    └── account_settings.feature
```
