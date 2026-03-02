# Hooks & World

Managing browser lifecycle, shared scenario context, and setup/teardown with `@cucumber/cucumber`.

---

## World Class

The `World` is a per-scenario shared state object. Every step function's `this` is bound to the current scenario's World instance. Use it to share `browser`, `context`, `page`, and any scenario-scoped data between steps.

```typescript
// utils/world.ts
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export interface CustomWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  // Scenario-scoped data — add fields as needed
  authToken?: string;
  userId?: string;
  orderId?: string;
}

export class PlaywrightWorld extends World implements CustomWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  authToken?: string;
  userId?: string;
  orderId?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
```

**Rules:**
- One `PlaywrightWorld` instance per scenario — never shared across scenarios
- `browser`, `context`, and `page` are populated by the `Before` hook
- Properties added to `this` (e.g. `this.orderId`) are accessible in all steps of the same scenario
- `setWorldConstructor` must be called once — typically at the bottom of `world.ts`

---

## Hooks

```typescript
// tests/hooks.ts
import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import { PlaywrightWorld } from '../utils/world';
import { config } from '../utils/config';

// ── Global setup (runs once before ALL scenarios) ──────────────────────────
BeforeAll(async function () {
  // Use for: starting a test server, seeding a database, creating a shared auth token
  // WARNING: `this` is NOT a World instance here — no page/browser access
});

// ── Per-scenario setup (runs before EACH scenario) ─────────────────────────
Before(async function (this: PlaywrightWorld) {
  this.browser = await chromium.launch({
    headless: config.headless,
    slowMo:   config.slowMo,
  });
  this.context = await this.browser.newContext({
    baseURL:  config.baseUrl,
    viewport: { width: 1280, height: 720 },
  });
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(config.timeout);
});

// ── Tagged hook — only runs before @authenticated scenarios ────────────────
Before({ tags: '@authenticated' }, async function (this: PlaywrightWorld) {
  // Load stored auth state to skip login UI
  await this.context.addCookies([
    {
      name:   'auth_token',
      value:  process.env.TEST_AUTH_TOKEN || 'test-token',
      domain: 'localhost',
      path:   '/',
    },
  ]);
});

// ── Per-scenario teardown (runs after EACH scenario) ───────────────────────
After(async function (this: PlaywrightWorld, scenario) {
  try {
    if (scenario.result?.status === Status.FAILED) {
      // Embed screenshot in HTML report
      const screenshot = await this.page.screenshot({ fullPage: true });
      this.attach(screenshot, 'image/png');

      // Embed page HTML for debugging
      const html = await this.page.content();
      this.attach(html, 'text/html');
    }
  } finally {
    // Always close — even if screenshot fails
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
  }
});

// ── Global teardown (runs once after ALL scenarios) ────────────────────────
AfterAll(async function () {
  // Use for: stopping a test server, cleaning up DB, revoking shared auth
  // WARNING: `this` is NOT a World instance here
});
```

---

## Hook Order and Priority

When multiple `Before` hooks apply to the same scenario, they run in the order they are defined. Use `order` to control priority explicitly:

```typescript
Before({ order: 1 }, async function (this: PlaywrightWorld) {
  // Runs first — browser setup
});

Before({ order: 2, tags: '@authenticated' }, async function (this: PlaywrightWorld) {
  // Runs second — only for @authenticated scenarios
});
```

`After` hooks run in **reverse** order of definition (last defined runs first).

---

## Loading Auth State from File

For faster test runs, save auth state once and reuse it across scenarios:

```typescript
// tests/global-setup.ts — run once to generate auth state
import { chromium } from '@playwright/test';
import { config } from '../utils/config';
import path from 'path';

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: config.baseUrl });
  const page = await context.newPage();

  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(/dashboard/);

  await context.storageState({ path: 'test-data/auth/user.auth.json' });
  await browser.close();
}

export default globalSetup;
```

```typescript
// hooks.ts — load auth state in Before hook
Before({ tags: '@authenticated' }, async function (this: PlaywrightWorld) {
  await this.context.storageState({ path: 'test-data/auth/user.auth.json' });
});
```

---

## BeforeAll / AfterAll Limitations

| Feature | `Before`/`After` | `BeforeAll`/`AfterAll` |
|---------|-----------------|----------------------|
| Access to `this.page` | Yes | **No** — no World instance |
| Runs per | Scenario | Once per worker process |
| Parallel note | Each worker has its own `Before`/`After` | Runs once **per worker**, not globally |

> If you need true global setup (once for the entire suite), use an external script or a `BeforeAll` that writes to a shared file/DB that all workers can read.

---

## Quick Reference

| Hook | When | `this` is World? |
|------|------|-----------------|
| `BeforeAll` | Once before all scenarios (per worker) | No |
| `Before` | Before each scenario | Yes |
| `Before({ tags })` | Before matching scenarios only | Yes |
| `After` | After each scenario | Yes |
| `After({ tags })` | After matching scenarios only | Yes |
| `AfterAll` | Once after all scenarios (per worker) | No |
