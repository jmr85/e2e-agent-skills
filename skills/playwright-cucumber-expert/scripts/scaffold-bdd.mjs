// scripts/scaffold-bdd.mjs
// Cross-platform scaffolding script for @cucumber/cucumber + Playwright projects.
//
// Usage:
//   node scripts/scaffold-bdd.mjs           — Level 3 (default)
//   node scripts/scaffold-bdd.mjs --level 1 — Basic
//   node scripts/scaffold-bdd.mjs --level 2 — Intermediate
//   node scripts/scaffold-bdd.mjs --level 4 — Enterprise

import { mkdirSync, writeFileSync, existsSync, appendFileSync } from 'fs';

const args = process.argv.slice(2);
const levelArg = args.indexOf('--level');
const level = levelArg !== -1 ? Number(args[levelArg + 1]) : 3;

if (![1, 2, 3, 4].includes(level)) {
  console.error('Error: --level must be 1, 2, 3, or 4');
  process.exit(1);
}

// ── Directory sets by level ───────────────────────────────────────────────

const level1Dirs = [
  'features',
  'step_definitions',
  'reports',
];

const level2Dirs = [
  ...level1Dirs,
  'features/auth',
  'step_definitions/auth',
  'step_definitions/shared',
  'pages/auth',
];

const level3Dirs = [
  ...level2Dirs,
  'features/checkout',
  'step_definitions/checkout',
  'pages/checkout',
  'utils',
  'tests',
  'test-data/auth',
  'test-data/fixtures',
];

const level4Dirs = [
  ...level3Dirs,
  'features/catalog',
  'features/cart',
  'features/admin',
  'step_definitions/catalog',
  'step_definitions/cart',
  'step_definitions/admin',
  'pages/catalog',
  'pages/cart',
  'pages/admin',
  '.github/workflows',
];

const dirSets = { 1: level1Dirs, 2: level2Dirs, 3: level3Dirs, 4: level4Dirs };
const dirs = dirSets[level];

console.log(`\nScaffolding Level ${level} BDD project...\n`);

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
  console.log(`  created: ${dir}/`);
}

// ── cucumber.js ───────────────────────────────────────────────────────────

const requirePaths =
  level >= 3
    ? `['tests/hooks.ts', 'step_definitions/**/*.steps.ts']`
    : `['step_definitions/**/*.steps.ts']`;

const profiles =
  level >= 4
    ? `
const common = {
  require: ${requirePaths},
  requireModule: ['ts-node/register'],
  publishQuiet: true,
};

module.exports = {
  default: {
    ...common,
    paths: ['features/**/*.feature'],
    format: ['progress-bar', 'html:reports/cucumber-report.html', 'json:reports/cucumber-report.json'],
  },
  smoke: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: '@smoke',
    format: ['progress-bar', 'html:reports/smoke-report.html'],
  },
  regression: {
    ...common,
    paths: ['features/**/*.feature'],
    tags: '@regression',
    format: ['progress-bar', 'html:reports/regression-report.html'],
  },
  ci: {
    ...common,
    paths: ['features/**/*.feature'],
    format: ['progress-bar', 'html:reports/cucumber-report.html', 'json:reports/cucumber-report.json', 'junit:reports/junit-report.xml'],
  },
};
`
    : `
module.exports = {
  default: {
    require: ${requirePaths},
    requireModule: ['ts-node/register'],
    publishQuiet: true,
    paths: ['features/**/*.feature'],
    format: ['progress-bar', 'html:reports/cucumber-report.html'],
  },
};
`;

writeFileSync('cucumber.js', profiles.trimStart());
console.log('  created: cucumber.js');

// ── tsconfig.json ─────────────────────────────────────────────────────────

const paths =
  level >= 2
    ? `,\n    "paths": {\n      "@pages/*": ["pages/*"],\n      "@utils/*": ["utils/*"],\n      "@support/*": ["tests/*"]\n    }`
    : '';

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": "."${paths},
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "reports"]
}
`;

writeFileSync('tsconfig.json', tsconfig);
console.log('  created: tsconfig.json');

// ── utils/world.ts (Level 3+) ─────────────────────────────────────────────

if (level >= 3) {
  writeFileSync(
    'utils/world.ts',
    `import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export interface CustomWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  authToken?: string;
}

export class PlaywrightWorld extends World implements CustomWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  authToken?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(PlaywrightWorld);
`
  );
  console.log('  created: utils/world.ts');

  // ── utils/config.ts ──────────────────────────────────────────────────────
  writeFileSync(
    'utils/config.ts',
    `export const config = {
  baseUrl:  process.env.BASE_URL  || 'http://localhost:3000',
  headless: process.env.HEADLESS  !== 'false',
  slowMo:   Number(process.env.SLOW_MO) || 0,
  timeout:  Number(process.env.TIMEOUT) || 30000,
};
`
  );
  console.log('  created: utils/config.ts');

  // ── tests/hooks.ts ───────────────────────────────────────────────────────
  writeFileSync(
    'tests/hooks.ts',
    `import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import { PlaywrightWorld } from '../utils/world';
import { config } from '../utils/config';

BeforeAll(async function () {
  // Global setup — no World instance available here
});

Before(async function (this: PlaywrightWorld) {
  this.browser = await chromium.launch({ headless: config.headless, slowMo: config.slowMo });
  this.context = await this.browser.newContext({ baseURL: config.baseUrl, viewport: { width: 1280, height: 720 } });
  this.page    = await this.context.newPage();
  this.page.setDefaultTimeout(config.timeout);
});

Before({ tags: '@authenticated' }, async function (this: PlaywrightWorld) {
  await this.context.storageState({ path: 'test-data/auth/user.auth.json' });
});

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

AfterAll(async function () {
  // Global teardown — no World instance available here
});
`
  );
  console.log('  created: tests/hooks.ts');
}

// ── .gitignore ────────────────────────────────────────────────────────────

const gitignoreContent = [
  '# Reports',
  'reports/',
  'cucumber-report.html',
  'cucumber-report.json',
  'junit-report.xml',
  '',
  '# Auth state',
  'test-data/auth/*.auth.json',
  '',
  '# Node',
  'node_modules/',
  'dist/',
  '',
  '# Environment',
  '.env',
  '.env.local',
].join('\n');

if (!existsSync('.gitignore')) {
  writeFileSync('.gitignore', gitignoreContent + '\n');
} else {
  appendFileSync('.gitignore', '\n# Cucumber BDD\n' + gitignoreContent + '\n');
}
console.log('  updated: .gitignore');

// ── CI workflow (Level 4) ─────────────────────────────────────────────────

if (level >= 4) {
  writeFileSync(
    '.github/workflows/cucumber.yml',
    `name: Cucumber BDD Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  smoke:
    name: Smoke Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx cucumber-js --profile smoke
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: smoke-report
          path: reports/

  regression:
    name: Regression Tests
    runs-on: ubuntu-latest
    needs: smoke
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx cucumber-js --profile regression
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: regression-report
          path: reports/
`
  );
  console.log('  created: .github/workflows/cucumber.yml');
}

// ── package.json scripts hint ─────────────────────────────────────────────

console.log('\nBDD project structure created successfully.');
console.log('\nAdd these scripts to your package.json:');

if (level >= 4) {
  console.log('  "test":            "npx cucumber-js"');
  console.log('  "test:smoke":      "npx cucumber-js --profile smoke"');
  console.log('  "test:regression": "npx cucumber-js --profile regression"');
  console.log('  "test:ci":         "npx cucumber-js --profile ci"');
} else {
  console.log('  "test": "npx cucumber-js"');
}

console.log('\nNext steps:');
console.log('  1. npm install @cucumber/cucumber @playwright/test ts-node typescript');
console.log('  2. npx playwright install chromium');
console.log('  3. Write your first .feature file in features/');
console.log('  4. npx cucumber-js --dry-run   — verify step definitions load');
console.log('  5. npx cucumber-js             — run all tests');
