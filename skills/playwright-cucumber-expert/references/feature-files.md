# Feature Files

Writing Gherkin `.feature` files that are readable by both technical and non-technical stakeholders.

---

## Basic Structure

```gherkin
@auth @smoke
Feature: User Authentication
  As a registered user
  I want to log in to the application
  So that I can access my account

  Background:
    Given the application is running

  @regression
  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When the user enters email "user@test.com" and password "Password123!"
    Then the user should be redirected to the dashboard
    And the welcome message should display "Welcome back"

  @regression @negative
  Scenario: Login fails with invalid password
    Given the user is on the login page
    When the user enters email "user@test.com" and password "wrongpassword"
    Then an error message "Invalid credentials" should be displayed
    And the user should remain on the login page
```

---

## Scenario Outline — Data-Driven Tests

Use when the same flow needs to run with multiple data sets.

```gherkin
@auth @regression
Feature: Login Validation

  Scenario Outline: Login with invalid credentials shows correct error
    Given the user is on the login page
    When the user enters email "<email>" and password "<password>"
    Then an error message "<error>" should be displayed

    Examples:
      | email               | password      | error                    |
      | invalid-email       | Password123!  | Invalid email format     |
      | user@test.com       |               | Password is required     |
      |                     | Password123!  | Email is required        |
      | nobody@nowhere.com  | Password123!  | Invalid credentials      |
```

---

## Background — Shared Preconditions

`Background` runs before **every** scenario in the feature. Use for common setup steps only.

```gherkin
Feature: Product Catalog

  Background:
    Given the user is logged in as "buyer"
    And the product catalog is loaded

  Scenario: Search for a product
    When the user searches for "laptop"
    Then the results should contain at least 1 product

  Scenario: Filter products by category
    When the user filters by category "Electronics"
    Then all results should belong to "Electronics"
```

> **Rule:** Keep `Background` short (1–3 steps). If it grows longer, the feature is doing too much.

---

## DataTable — Structured Input Data

Use for steps that receive tabular data.

```gherkin
Scenario: Register a new user with all required fields
  Given the user is on the registration page
  When the user fills in the registration form:
    | field     | value               |
    | firstName | John                |
    | lastName  | Doe                 |
    | email     | john.doe@test.com   |
    | password  | SecurePass123!      |
  Then the account should be created successfully
```

```gherkin
Scenario: Add multiple items to the cart
  Given the user is on the product catalog page
  When the user adds the following items to the cart:
    | product      | quantity |
    | Laptop Pro   | 1        |
    | USB Hub      | 2        |
    | Mouse Pad    | 1        |
  Then the cart should contain 3 items
```

---

## DocString — Multi-line Text Input

Use for steps that receive long text or JSON payloads.

```gherkin
Scenario: Submit a support ticket with a long description
  Given the user is on the support page
  When the user submits a ticket with the following description:
    """
    I am unable to complete the checkout process.
    The payment page shows an error after entering card details.
    This issue occurs on Chrome and Firefox.
    """
  Then the ticket should be created with status "Open"
```

---

## Tags — Classification and Filtering

Tags cascade from Feature to Scenario. A Scenario inherits all Feature-level tags.

```gherkin
@checkout @regression          ← applies to ALL scenarios below
Feature: Checkout Flow

  @smoke                       ← only this scenario gets @smoke
  Scenario: Complete checkout with credit card
    ...

  @wip                         ← skip this in CI with "not @wip"
  Scenario: Checkout with PayPal (in progress)
    ...
```

**Recommended tag taxonomy:**

| Category | Examples |
|----------|---------|
| Domain | `@auth`, `@checkout`, `@catalog`, `@profile` |
| Run level | `@smoke`, `@regression`, `@sanity` |
| Status | `@wip`, `@flaky`, `@skip` |
| Type | `@positive`, `@negative`, `@edge-case` |

---

## Rules for Writing Good Feature Files

| Rule | Good | Bad |
|------|------|-----|
| Orient steps to behaviour, not UI | `When the user submits the login form` | `When the user clicks the blue Submit button` |
| Use business language | `Then the order is confirmed` | `Then the element with id "order-status" has text "confirmed"` |
| One action per `When` step | `When the user logs in` | `When the user clicks login, fills in email, fills in password, and submits` |
| Assertions only in `Then` | `Then the dashboard is displayed` | `When the user sees the dashboard` |
| `Background` for shared state only | 1–3 common preconditions | All setup steps for every scenario |
| Scenario Outline for multiple data sets | `Examples:` table with variants | Copying the same scenario 5 times with different values |
| Avoid conjunctive steps | Separate `Given`/`When`/`Then` | `When the user logs in and navigates to the profile` |
