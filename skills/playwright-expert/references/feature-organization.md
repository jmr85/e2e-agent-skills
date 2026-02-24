# Feature-Based Organization

## When to Switch from Flat to Feature-Based

Start with a **flat structure** and migrate to **feature-based** when you cross these thresholds:

| Signal | Action |
|--------|--------|
| More than ~15 spec files | Group by feature |
| Multiple teams owning different areas | Group by team/domain |
| Tests for same feature scattered in different files | Consolidate into feature folder |
| `pages/` has 10+ files | Consider feature subfolders |

---

## Level 1: Flat Structure (small projects, < 15 specs)

Best for: small apps, single developer, early stage projects.

```
tests/
  login.spec.ts
  register.spec.ts
  dashboard.spec.ts
  profile.spec.ts
  settings.spec.ts

pages/
  LoginPage.ts
  RegisterPage.ts
  DashboardPage.ts
  ProfilePage.ts
  SettingsPage.ts
```

Simple, easy to navigate. No nesting required.

---

## Level 2: Feature-Grouped (medium projects, 15–50 specs)

Best for: growing teams, clear feature boundaries.

```
tests/
  auth/
    login.spec.ts
    register.spec.ts
    password-reset.spec.ts
  dashboard/
    dashboard-overview.spec.ts
    dashboard-widgets.spec.ts
  user-management/
    profile.spec.ts
    settings.spec.ts
    notifications.spec.ts
  orders/
    create-order.spec.ts
    order-history.spec.ts

pages/
  auth/
    LoginPage.ts
    RegisterPage.ts
    PasswordResetPage.ts
  dashboard/
    DashboardPage.ts
  user-management/
    ProfilePage.ts
    SettingsPage.ts
  orders/
    CreateOrderPage.ts
    OrderHistoryPage.ts

components/
  NavBar.ts
  Modal.ts
  DataTable.ts
  Pagination.ts
```

Mirror the feature structure between `tests/` and `pages/`.

---

## Level 3: Domain-Based (large projects, 50+ specs, multi-team)

Best for: monorepos, large teams, multiple product areas.

```
tests/
  e2e/                          # Full end-to-end user flows
    checkout-flow.spec.ts
    onboarding-flow.spec.ts
  features/                     # Feature-specific tests
    auth/
      login.spec.ts
      sso.spec.ts
    catalog/
      product-search.spec.ts
      product-detail.spec.ts
    cart/
      add-to-cart.spec.ts
      cart-summary.spec.ts
    checkout/
      payment.spec.ts
      confirmation.spec.ts
  api/                          # API-level tests via Playwright
    auth-api.spec.ts
    orders-api.spec.ts
  visual/                       # Screenshot / visual regression tests
    homepage.spec.ts
    product-card.spec.ts

pages/
  auth/
  catalog/
  cart/
  checkout/

fixtures/
  auth.fixture.ts
  catalog.fixture.ts

utils/
  api/
    auth-api.ts
    orders-api.ts
  builders/
    user-builder.ts
    product-builder.ts

test-data/
  auth/
  catalog/
  checkout/
```

---

## Organizing `playwright.config.ts` for Multiple Test Types

When using Level 3 structure, configure separate projects per test type:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // Full E2E tests — all browsers
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    // Feature tests — fast, Chrome only
    {
      name: 'features',
      testDir: './tests/features',
      use: { ...devices['Desktop Chrome'] },
    },
    // Visual tests — separate run
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'] },
    },
    // API tests — no browser needed
    {
      name: 'api',
      testDir: './tests/api',
      use: { browserName: 'chromium' },
    },
  ],
});
```

Run specific groups:
```bash
npx playwright test --project=features
npx playwright test --project=e2e-chromium
npx playwright test --project=visual
```

---

## Sharing Fixtures Across Features

When fixtures are feature-specific, co-locate them:

```
fixtures/
  index.ts                # Master fixture — merges all below
  auth.fixture.ts         # Shared across all features
  catalog.fixture.ts      # Only needed in catalog tests
  checkout.fixture.ts     # Only needed in checkout tests
```

```typescript
// fixtures/index.ts — merge all into one export
import { test as base } from '@playwright/test';
import { authFixtures } from './auth.fixture';
import { catalogFixtures } from './catalog.fixture';

export const test = base
  .extend(authFixtures)
  .extend(catalogFixtures);

export { expect } from '@playwright/test';
```

Tests always import from `@fixtures/index` — never directly from individual fixture files.

---

## Decision Guide

```
New project (< 15 tests)?
  → Use Level 1: flat structure

Project growing (15-50 tests)?
  → Use Level 2: group by feature

Multiple teams or test types (50+ tests)?
  → Use Level 3: domain-based with separate playwright projects

Not sure?
  → Start Level 1, refactor to Level 2 when you feel friction navigating files
```

---

## Anti-Patterns to Avoid

| Anti-pattern | Problem | Fix |
|---|---|---|
| `tests/pages/` (tests inside pages folder) | Mixes concerns | Keep `tests/` and `pages/` as siblings at root |
| `tests/test-login.spec.ts` | Redundant "test-" prefix | `tests/auth/login.spec.ts` |
| One giant spec file per feature | Hard to parallelize, slow CI | Split by scenario into multiple files |
| Feature folder with > 10 spec files | Too large | Add a sub-level: `tests/orders/history/`, `tests/orders/creation/` |
| `pages/helpers/` inside pages folder | Wrong abstraction | Move helpers to `utils/` |
