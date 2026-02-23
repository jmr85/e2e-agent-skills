# Naming Conventions

## Spec Files (Tests)

| Pattern | Example |
|---------|---------|
| `<feature>.spec.ts` | `login.spec.ts` |
| `<feature>-<scenario>.spec.ts` | `login-oauth.spec.ts` |
| `<page>-<action>.spec.ts` | `checkout-payment.spec.ts` |

Rules:
- Always use `.spec.ts` extension — never `.test.ts` for Playwright E2E tests
- Use **kebab-case** for file names
- Name after the **feature or user flow**, not the technical component
- Group related specs in a subfolder: `tests/checkout/` not `tests/checkout-page.spec.ts` + `tests/checkout-payment.spec.ts` as loose files
- API specs go in `tests/api/` — they follow the same naming pattern but test REST endpoints directly (no browser)

```
tests/
  auth/
    login.spec.ts            ✓
    login-social.spec.ts     ✓
    logout.spec.ts           ✓
  checkout/
    checkout-flow.spec.ts    ✓
    checkout-payment.spec.ts ✓
  api/
    auth.spec.ts             ✓  (API test, no browser)
    users.spec.ts            ✓
login_page.spec.ts           ✗  (underscore)
LoginSpec.ts                 ✗  (PascalCase, missing .spec)
test-login.ts                ✗  (missing .spec, prefixed with "test-")
```

---

## API Spec Files

| Pattern | Example |
|---------|---------|
| `<resource>.spec.ts` | `auth.spec.ts`, `users.spec.ts` |
| `<resource>-<action>.spec.ts` | `users-pagination.spec.ts` |

Rules:
- Located in `tests/api/` — never mixed with E2E specs
- Use `apiContext` fixture, not `page`
- Same **kebab-case** as other specs
- Name after the resource/endpoint being tested

```
tests/
  api/
    auth.spec.ts             ✓
    users.spec.ts            ✓
    orders-create.spec.ts    ✓
    users-api.spec.ts        ✗  (redundant "-api")
    API_auth.spec.ts         ✗  (PascalCase)
```

---

## Page Object Files and Classes

| File name pattern | Class name pattern | Example |
|-------------------|--------------------|---------|
| `<Name>Page.ts` | `<Name>Page` | `LoginPage.ts` → `class LoginPage` |
| `<Name>Page.ts` | `<Name>Page` | `CheckoutPage.ts` → `class CheckoutPage` |

Rules:
- File name and class name **must match exactly**
- Use **PascalCase** for both file and class
- Always suffix with `Page`
- One class per file

```typescript
// pages/LoginPage.ts
export class LoginPage { ... }       ✓

// pages/login.ts
export class Login { ... }           ✗  (no Page suffix, no PascalCase file)

// pages/LoginPageHelper.ts
export class LoginPageHelper { ... } ✗  (redundant suffix)
```

---

## Component Page Object Files and Classes

| File name pattern | Class name | Example |
|-------------------|------------|---------|
| `<Name>.ts` | `<Name>` | `NavBar.ts` → `class NavBar` |
| `<Name>Component.ts` | `<Name>Component` | `DatePickerComponent.ts` → `class DatePickerComponent` |

Rules:
- Components **do not** need the `Page` suffix — they represent UI components, not full pages
- Use PascalCase
- Prefer the plain name when the component name is unambiguous (`NavBar`, `Modal`, `DataTable`)
- Add `Component` suffix only when the name alone is too generic (e.g., `InputComponent`)

---

## Fixture Files

| File name pattern | Export pattern | Example |
|-------------------|----------------|---------|
| `<name>.fixture.ts` | `export const test = base.extend(...)` | `auth.fixture.ts` |
| `index.ts` | Re-exports all fixtures | `fixtures/index.ts` |

Rules:
- Use `.fixture.ts` suffix for all custom fixture files
- Use **kebab-case** for file names
- `fixtures/index.ts` should merge and re-export all fixtures for a single import point in tests

```typescript
// fixtures/index.ts
import { test as authTest } from './auth.fixture';
import { test as dbTest } from './database.fixture';

export const test = authTest.extend(dbTest);
export { expect } from '@playwright/test';
```

```typescript
// In tests — single clean import
import { test, expect } from '@fixtures/index';
```

---

## Utility / Helper Files

| File name pattern | Export style | Example |
|-------------------|--------------|---------|
| `<domain>-helpers.ts` | Named exports | `date-helpers.ts` |
| `<entity>-builder.ts` | Named exports | `user-builder.ts` |
| `<domain>-api.ts` | Named exports | `orders-api.ts` |

Rules:
- Use **kebab-case** with a descriptive suffix (`-helpers`, `-builder`, `-api`, `-utils`)
- Prefer named exports over default exports in utils
- No Playwright `Page` dependencies in `utils/` — keep them framework-agnostic where possible

```typescript
// utils/user-builder.ts
export function buildUser(overrides = {}) { ... }     ✓
export function randomEmail() { ... }                  ✓

// utils/helpers.ts  ✗  (too generic)
// utils/UserBuilder.ts  ✗  (PascalCase for non-class file)
```

---

## Test Data Files

| Type | Pattern | Example |
|------|---------|---------|
| JSON datasets | `<entity>.json` | `users.json`, `products.json` |
| CSV files | `<entity>.csv` | `orders.csv` |
| Images | `<description>.<ext>` | `test-avatar.png`, `large-upload.pdf` |
| Auth state | `<role>.auth.json` | `admin.auth.json`, `user.auth.json` |

Rules:
- Use **kebab-case** for all test data files
- Group by type in subfolders: `test-data/images/`, `test-data/auth/`
- All `*.auth.json` files must be **gitignored**

---

## Mock / HAR Files

| Pattern | Example |
|---------|---------|
| `<domain>.har` | `users-api.har`, `auth.har` |
| `<domain>-<scenario>.json` | `users-empty-response.json` |
| `<domain>-<scenario>.har` | `orders-timeout.har` |

Rules:
- Located in `mocks/` at project root
- Use **kebab-case**
- Name after the domain/resource being mocked
- HAR files for recorded network sessions, JSON for static mock responses

```
mocks/
  auth.har                     ✓
  users-api.har                ✓
  products-empty.json          ✓
  orders-error-500.json        ✓
  AuthMock.har                 ✗  (PascalCase)
  api_mocks.har                ✗  (underscore)
```

---

## Summary Table

| Type | File naming | Class/export naming |
|------|-------------|---------------------|
| Spec file (E2E) | `feature-name.spec.ts` | — |
| Spec file (API) | `tests/api/resource.spec.ts` | — |
| Page Object | `LoginPage.ts` | `class LoginPage` |
| Component PO | `NavBar.ts` | `class NavBar` |
| Fixture | `auth.fixture.ts` | `export const test` |
| Fixture barrel | `index.ts` | `export const test` |
| Utility helper | `date-helpers.ts` | named exports |
| Data builder | `user-builder.ts` | named exports |
| Schema validator | `schema-validator.ts` | named exports |
| Test data | `users.json` | — |
| Auth state | `admin.auth.json` | — (gitignored) |
| Mock / HAR file | `mocks/users-api.har` | — |
