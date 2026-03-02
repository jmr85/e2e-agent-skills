# Step Definitions

Implementing `Given`/`When`/`Then` steps in TypeScript using `@cucumber/cucumber` and Playwright.

---

## Critical Rule: Never Use Arrow Functions

Arrow functions lose the `this` binding — the World instance will be `undefined`.

```typescript
// WRONG — arrow function, this is undefined
Given('the user is on the login page', async () => {
  await this.page.goto('/login'); // TypeError: Cannot read properties of undefined
});

// CORRECT — regular async function
Given('the user is on the login page', async function (this: PlaywrightWorld) {
  await this.page.goto('/login');
});
```

---

## Basic Step Definition Structure

```typescript
// step_definitions/auth/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../../utils/world';
import { LoginPage } from '../../pages/auth/LoginPage';

Given('the user is on the login page', async function (this: PlaywrightWorld) {
  await this.page.goto('/login');
});

When(
  'the user enters email {string} and password {string}',
  async function (this: PlaywrightWorld, email: string, password: string) {
    const loginPage = new LoginPage(this.page);
    await loginPage.fillEmail(email);
    await loginPage.fillPassword(password);
    await loginPage.submit();
  }
);

Then(
  'the user should be redirected to the dashboard',
  async function (this: PlaywrightWorld) {
    await expect(this.page).toHaveURL(/dashboard/);
  }
);

Then(
  'the welcome message should display {string}',
  async function (this: PlaywrightWorld, expectedMessage: string) {
    await expect(
      this.page.getByRole('heading', { name: expectedMessage })
    ).toBeVisible();
  }
);
```

---

## Parameter Expressions

| Expression | Matches | TypeScript type |
|------------|---------|-----------------|
| `{string}` | `"quoted text"` or `'quoted text'` | `string` |
| `{int}` | Integer: `42` | `number` |
| `{float}` | Decimal: `3.14` | `number` |
| `{word}` | Single word without spaces | `string` |
| `/regex/` | Full regular expression | `string` |

```typescript
// {string} — most common, for names, labels, URLs
When('the user searches for {string}', async function (this: PlaywrightWorld, query: string) {
  await this.page.getByRole('searchbox').fill(query);
});

// {int} — for counts, quantities
Then('the cart should contain {int} items', async function (this: PlaywrightWorld, count: number) {
  await expect(this.page.getByTestId('cart-count')).toHaveText(String(count));
});

// regex — for flexible matching
Given(/the user is logged in as (?:an? )?(admin|buyer|seller)/, async function (
  this: PlaywrightWorld,
  role: string
) {
  await this.page.goto(`/login?role=${role}`);
});
```

---

## DataTable in Steps

```typescript
import { DataTable } from '@cucumber/cucumber';

When(
  'the user fills in the registration form:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const data = dataTable.rowsHash(); // { firstName: 'John', lastName: 'Doe', ... }

    await this.page.getByLabel('First name').fill(data['firstName']);
    await this.page.getByLabel('Last name').fill(data['lastName']);
    await this.page.getByLabel('Email').fill(data['email']);
    await this.page.getByLabel('Password').fill(data['password']);
  }
);

When(
  'the user adds the following items to the cart:',
  async function (this: PlaywrightWorld, dataTable: DataTable) {
    const rows = dataTable.hashes(); // [{ product: 'Laptop Pro', quantity: '1' }, ...]

    for (const row of rows) {
      await this.page.getByRole('row', { name: row['product'] })
        .getByRole('spinbutton')
        .fill(row['quantity']);
      await this.page.getByRole('row', { name: row['product'] })
        .getByRole('button', { name: 'Add to cart' })
        .click();
    }
  }
);
```

**DataTable methods:**

| Method | Returns | Use for |
|--------|---------|---------|
| `dataTable.hashes()` | `Array<Record<string, string>>` | Table with header row |
| `dataTable.rowsHash()` | `Record<string, string>` | Two-column key/value table |
| `dataTable.rows()` | `string[][]` | Raw rows without header |
| `dataTable.raw()` | `string[][]` | All rows including header |

---

## DocString in Steps

```typescript
When(
  'the user submits a ticket with the following description:',
  async function (this: PlaywrightWorld, docString: string) {
    await this.page.getByLabel('Description').fill(docString);
    await this.page.getByRole('button', { name: 'Submit ticket' }).click();
  }
);
```

---

## Storing State on World

Pass data between steps in the same scenario via `this`:

```typescript
When('the user creates a new order', async function (this: PlaywrightWorld) {
  const response = await this.page.waitForResponse('**/api/orders');
  const body = await response.json();
  this.orderId = body.id; // store for later steps
});

Then('the order confirmation page should show the order ID', async function (this: PlaywrightWorld) {
  await expect(
    this.page.getByTestId('order-id')
  ).toHaveText(this.orderId);
});
```

Declare the property in the World class:
```typescript
// utils/world.ts
export class PlaywrightWorld extends World {
  orderId?: string;
  // ...
}
```

---

## Step Reuse Across Features

Steps are global — a step defined in `auth/login.steps.ts` can be used in any feature file. Keep shared/generic steps in a dedicated file:

```typescript
// step_definitions/shared/common.steps.ts
Given('the application is running', async function (this: PlaywrightWorld) {
  await this.page.goto('/');
  await this.page.waitForLoadState('networkidle');
});

Then(
  'the page title should be {string}',
  async function (this: PlaywrightWorld, title: string) {
    await expect(this.page).toHaveTitle(title);
  }
);
```

---

## Quick Reference

| Pattern | Usage |
|---------|-------|
| `Given/When/Then` | Step decorators — all interchangeable, use for readability |
| `async function (this: PlaywrightWorld)` | Always — never arrow functions |
| `{string}` | Quoted parameter in step text |
| `{int}` / `{float}` | Numeric parameters |
| `DataTable` | Tabular data passed to a step |
| `docString` | Multi-line text passed to a step |
| `this.page` | Playwright Page from World |
| `this.someProperty` | Pass data between steps in same scenario |
