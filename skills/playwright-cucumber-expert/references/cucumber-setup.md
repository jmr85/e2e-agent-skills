# Cucumber Setup

## Required Packages

```bash
npm install --save-dev @cucumber/cucumber @playwright/test playwright ts-node typescript
npx playwright install chromium
```

```json
{
  "devDependencies": {
    "@cucumber/cucumber": "^10.0.0",
    "@playwright/test": "^1.44.0",
    "playwright": "^1.44.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.4.0"
  }
}
```

> **Important:** `@playwright/test` provides `chromium`, `expect`, and browser types.
> The Cucumber CLI (`cucumber-js`) is the test runner — **not** `@playwright/test`'s `test()`.

---

## tsconfig.json

`"module": "commonjs"` is non-negotiable. Cucumber's `require` loader does not support ESM.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@pages/*":   ["pages/*"],
      "@utils/*":   ["utils/*"],
      "@support/*": ["support/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "reports"]
}
```

---

## cucumber.js — Minimal Config

```javascript
// cucumber.js (project root)
module.exports = {
  default: {
    require:       ['tests/hooks.ts', 'step_definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress',
      'html:reports/cucumber-report.html',
    ],
    paths:        ['features/**/*.feature'],
    publishQuiet: true,
  },
};
```

| Key | Purpose |
|-----|---------|
| `require` | Files loaded before tests — hooks first, then steps |
| `requireModule` | `['ts-node/register']` enables TypeScript |
| `format` | Output formatters (console + file) |
| `paths` | Glob to `.feature` files |
| `publishQuiet` | Suppresses Cucumber Cloud publishing prompt |

---

## package.json Scripts

```json
{
  "scripts": {
    "test":            "cucumber-js",
    "test:smoke":      "cucumber-js --profile smoke",
    "test:regression": "cucumber-js --profile regression",
    "test:headed":     "HEADLESS=false cucumber-js",
    "test:debug":      "HEADLESS=false SLOWMO=500 cucumber-js"
  }
}
```

---

## utils/config.ts

Centralize all environment configuration here. Never hardcode URLs or credentials in steps.

```typescript
// utils/config.ts
export const config = {
  baseUrl:  process.env.BASE_URL  || 'http://localhost:3000',
  headless: process.env.HEADLESS  !== 'false',
  slowMo:   Number(process.env.SLOWMO) || 0,
  timeout:  Number(process.env.TIMEOUT) || 30000,
};
```

---

## First Run

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Run all tests
npm test

# 4. Run smoke tests only
npm run test:smoke

# 5. Run a single feature file
npx cucumber-js features/auth/login.feature

# 6. Run by ad-hoc tag
npx cucumber-js --tags "@login and not @wip"

# 7. Run headed (visible browser) for debugging
npm run test:headed
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run default profile |
| `npm run test:smoke` | Run `@smoke` tagged scenarios |
| `npm run test:regression` | Run `@regression` (excluding `@wip`) |
| `npx cucumber-js --tags "@tag"` | Ad-hoc tag filter |
| `npx cucumber-js features/auth/login.feature` | Single feature file |
| `HEADLESS=false npm test` | Visible browser |
