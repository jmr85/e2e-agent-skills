# Anti-patterns

Common mistakes when using `@cucumber/cucumber` with Playwright and how to fix them.

---

## 1. Arrow Functions in Step Definitions

**Problem:** Arrow functions do not have their own `this` binding. The World instance (`this.page`, `this.browser`, etc.) will be `undefined`.

```typescript
// WRONG
Given('the user is on the login page', async () => {
  await this.page.goto('/login'); // TypeError: Cannot read properties of undefined
});

// CORRECT
Given('the user is on the login page', async function (this: PlaywrightWorld) {
  await this.page.goto('/login');
});
```

---

## 2. Playwright Interactions in Step Definitions

**Problem:** Putting `page.click()`, `page.fill()`, `page.locator()` directly in step files bypasses the Page Object Model. Steps become brittle and unreadable.

```typescript
// WRONG — steps know about UI implementation
When('the user logs in', async function (this: PlaywrightWorld) {
  await this.page.locator('#email').fill('user@test.com');
  await this.page.locator('#password').fill('password123');
  await this.page.locator('button[type="submit"]').click();
});

// CORRECT — steps delegate to Page Objects
When('the user logs in', async function (this: PlaywrightWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.login('user@test.com', 'password123');
});
```

---

## 3. Assertions in Given or When Steps

**Problem:** `Given` and `When` describe setup and actions. Assertions in these steps make failures confusing — is the setup wrong or the assertion wrong?

```typescript
// WRONG — assertion in When
When('the user submits the form', async function (this: PlaywrightWorld) {
  await this.page.getByRole('button', { name: 'Submit' }).click();
  await expect(this.page).toHaveURL('/success'); // assertion belongs in Then
});

// CORRECT — action only in When, assertion in Then
When('the user submits the form', async function (this: PlaywrightWorld) {
  await this.page.getByRole('button', { name: 'Submit' }).click();
});

Then('the user should be redirected to the success page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL('/success');
});
```

---

## 4. Shared Mutable State via Module-Level Variables

**Problem:** Module-level variables persist across scenarios. Tests become order-dependent and fail randomly in parallel execution.

```typescript
// WRONG — module-level state
let userId: string;

When('the user creates an account', async function (this: PlaywrightWorld) {
  userId = await createUser(); // shared across ALL scenarios
});

// CORRECT — store on World (per-scenario)
When('the user creates an account', async function (this: PlaywrightWorld) {
  this.userId = await createUser(); // isolated to this scenario
});
```

---

## 5. Mixing @playwright/test Runner with Cucumber

**Problem:** `@playwright/test`'s `test()`, `describe()`, and fixture dependency injection are incompatible with Cucumber's runner. Using them causes silent failures or test hangs.

```typescript
// WRONG — mixing runners
import { test } from '@playwright/test'; // DO NOT use test() from @playwright/test
test('login', async ({ page }) => { ... });

// CORRECT — use @playwright/test only for browser API and expect
import { chromium, expect } from '@playwright/test'; // chromium and expect are safe
```

---

## 6. Accessing this.page in BeforeAll / AfterAll

**Problem:** `BeforeAll` and `AfterAll` run in module scope, not in a World instance. `this` is not a `PlaywrightWorld` — accessing `this.page` throws.

```typescript
// WRONG
BeforeAll(async function (this: PlaywrightWorld) {
  await this.page.goto('/setup'); // this.page does not exist here
});

// CORRECT — use Before for per-scenario setup with page access
Before(async function (this: PlaywrightWorld) {
  this.browser = await chromium.launch();
  this.page = await this.browser.newPage();
});

// BeforeAll is for global setup that does NOT need a browser
BeforeAll(async function () {
  await seedDatabase();
});
```

---

## 7. Not Closing the Browser on Failure

**Problem:** If the `After` hook throws before `browser.close()`, the browser process leaks, consuming memory and eventually crashing CI runners.

```typescript
// WRONG — browser leaks if screenshot fails
After(async function (this: PlaywrightWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    await this.page.screenshot(); // if this throws, browser never closes
  }
  await this.browser.close();
});

// CORRECT — always close in finally
After(async function (this: PlaywrightWorld, scenario) {
  try {
    if (scenario.result?.status === Status.FAILED) {
      const screenshot = await this.page.screenshot({ fullPage: true });
      this.attach(screenshot, 'image/png');
    }
  } finally {
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
  }
});
```

---

## 8. Hardcoded URLs and Credentials in Steps

**Problem:** Steps with hardcoded values cannot be reused across environments (dev/staging/prod) and expose credentials in source code.

```typescript
// WRONG
Given('the user navigates to the app', async function (this: PlaywrightWorld) {
  await this.page.goto('http://localhost:3000'); // hardcoded
});

// CORRECT — use config.ts
import { config } from '@utils/config';

Given('the user navigates to the app', async function (this: PlaywrightWorld) {
  await this.page.goto(config.baseUrl);
});
```

---

## 9. Missing publishQuiet: true

**Problem:** Without `publishQuiet: true`, every test run prints a multi-line banner asking to publish results to Cucumber Cloud. This pollutes CI output.

```javascript
// WRONG — noisy CI output
module.exports = {
  default: {
    format: ['progress'],
    paths:  ['features/**/*.feature'],
  },
};

// CORRECT
module.exports = {
  default: {
    format:       ['progress'],
    paths:        ['features/**/*.feature'],
    publishQuiet: true,   // always include this
  },
};
```

---

## 10. UI-Focused Step Descriptions

**Problem:** Steps that describe UI implementation details break when the UI changes, even if the behaviour is unchanged.

```gherkin
# WRONG — describes UI, not behaviour
When the user clicks the blue "Submit" button in the bottom-right corner
Then the green success banner at the top should appear

# CORRECT — describes behaviour
When the user submits the registration form
Then the account should be created successfully
```

---

## Quick Reference

| Anti-pattern | Fix |
|---|---|
| Arrow functions in steps | Use `async function (this: PlaywrightWorld)` |
| Page interactions in steps | Delegate to Page Objects |
| Assertions in Given/When | Move `expect()` to Then steps only |
| Module-level variables | Store on `this` (World) |
| Using `test()` from `@playwright/test` | Use `chromium` + `expect` only |
| `this.page` in BeforeAll | Use `Before` for per-scenario browser setup |
| No try/finally in After | Always close browser in `finally` block |
| Hardcoded URLs/credentials | Use `utils/config.ts` + env vars |
| Missing `publishQuiet: true` | Add to every profile |
| UI-focused step text | Write steps in business language |
