# Project Structure

Folder layout for `@cucumber/cucumber` + Playwright projects by complexity level.

---

## Level 1 — Basic (1–5 feature files, single developer)

```
my-project/
├── cucumber.js
├── tsconfig.json
├── package.json
├── .gitignore
│
├── features/
│   └── login.feature
│
├── step_definitions/
│   └── login.steps.ts
│
└── reports/                   ← gitignored, generated at runtime
    └── cucumber-report.html
```

Best for: prototypes, single feature, learning BDD.

---

## Level 2 — Intermediate (5–15 feature files, Page Objects added)

```
my-project/
├── cucumber.js
├── tsconfig.json
├── package.json
├── .gitignore
│
├── features/
│   ├── auth/
│   │   ├── login.feature
│   │   └── register.feature
│   └── checkout/
│       └── checkout.feature
│
├── step_definitions/
│   ├── auth/
│   │   ├── login.steps.ts
│   │   └── register.steps.ts
│   ├── checkout/
│   │   └── checkout.steps.ts
│   └── shared/
│       └── common.steps.ts    ← reusable steps (navigation, assertions)
│
├── pages/                     ← Page Objects (see playwright-automation-expert)
│   ├── auth/
│   │   ├── LoginPage.ts
│   │   └── RegisterPage.ts
│   └── checkout/
│       └── CheckoutPage.ts
│
└── reports/
```

---

## Level 3 — Advanced (15+ feature files, World + hooks + config)

```
my-project/
├── cucumber.js
├── tsconfig.json
├── package.json
├── .gitignore
│
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   └── checkout/
│
├── step_definitions/
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   └── shared/
│
├── pages/                     ← Page Objects
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   └── checkout/
│
├── utils/
│   ├── world.ts               ← Custom World (browser/context/page)
│   ├── config.ts              ← Environment variables
│   └── data-helpers.ts        ← Test data factories
│
├── tests/
│   └── hooks.ts               ← Before/After browser lifecycle
│
├── test-data/
│   ├── auth/                  ← *.auth.json files (gitignored)
│   └── fixtures/              ← Static JSON test data
│
└── reports/
```

---

## Level 4 — Enterprise (50+ feature files, multi-team, CI/CD)

```
my-project/
├── cucumber.js                ← Multi-profile config
├── tsconfig.json
├── package.json
├── .gitignore
│
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   └── admin/
│
├── step_definitions/          ← Mirrors features/ structure
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── admin/
│   └── shared/
│
├── pages/                     ← Page Objects (see playwright-automation-expert)
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   └── admin/
│
├── utils/
│   ├── world.ts
│   ├── config.ts
│   ├── data-helpers.ts
│   └── api-client.ts          ← Direct API calls for test setup
│
├── tests/
│   └── hooks.ts
│
├── test-data/
│   ├── auth/                  ← gitignored *.auth.json
│   ├── users/
│   └── products/
│
├── .github/
│   └── workflows/
│       └── cucumber.yml       ← CI pipeline
│
└── reports/                   ← gitignored
    ├── cucumber-report.html
    ├── cucumber-report.json
    └── junit-report.xml
```

---

## Folder Purpose Reference

| Folder | Contents | Notes |
|--------|----------|-------|
| `features/` | `.feature` files (Gherkin) | Group by domain |
| `step_definitions/` | TypeScript step files | Mirror `features/` structure |
| `pages/` | Page Object classes | See `playwright-automation-expert` |
| `utils/` | World, config, helpers | No Playwright `page` in config/helpers |
| `tests/` | `hooks.ts` only | Browser lifecycle management |
| `test-data/auth/` | `*.auth.json` storage state | Must be gitignored |
| `reports/` | Generated HTML/JSON/XML | Must be gitignored |

---

## .gitignore

```
# Reports
reports/
cucumber-report.html
cucumber-report.json
junit-report.xml

# Auth state
test-data/auth/*.auth.json

# Node
node_modules/
dist/

# Environment
.env
.env.local
```

---

## tsconfig.json Path Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@pages/*":   ["pages/*"],
      "@utils/*":   ["utils/*"],
      "@support/*": ["tests/*"]
    }
  }
}
```

Import cleanly in step definitions:
```typescript
import { LoginPage }       from '@pages/auth/LoginPage';
import { config }          from '@utils/config';
import { PlaywrightWorld } from '@utils/world';
```

---

## Decision Guide

```
1–5 feature files, learning BDD?
  → Level 1: flat structure

5–15 features, need Page Objects?
  → Level 2: feature subfolders + pages/

15+ features, multiple developers?
  → Level 3: add World + hooks + utils/

50+ features, multiple teams, CI/CD pipelines?
  → Level 4: full enterprise with profiles + runners + CI workflow
```
