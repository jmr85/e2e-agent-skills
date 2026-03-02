// scripts/scaffold.mjs
// Cross-platform scaffolding script for Playwright projects.
// Usage: node scripts/scaffold.mjs
import { mkdirSync, writeFileSync, existsSync, appendFileSync } from 'fs';

const dirs = [
  'tests/auth',
  'tests/dashboard',
  'tests/settings',
  'pages',
  'components',
  'fixtures',
  'utils',
  'mocks',
  'test-data/auth',
  'test-data/images',
  '.github/workflows',
];

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
  console.log(`  created: ${dir}/`);
}

// Fixtures barrel
writeFileSync(
  'fixtures/index.ts',
  `import { test as base, expect } from '@playwright/test';\n\n// Extend with your custom fixtures here\n// import { authFixtures } from './auth.fixture';\n// export const test = base.extend(authFixtures);\n\nexport const test = base;\nexport { expect };\n`
);
console.log('  created: fixtures/index.ts');

// Gitignore entries
const gitignoreEntries = [
  '\n# Playwright',
  'playwright-report/',
  'test-results/',
  'blob-report/',
  'test-data/auth/*.auth.json',
].join('\n');

if (!existsSync('.gitignore')) {
  writeFileSync('.gitignore', gitignoreEntries.trimStart());
} else {
  appendFileSync('.gitignore', gitignoreEntries);
}
console.log('  updated: .gitignore');

console.log('\nPlaywright project structure created successfully.');
console.log('Next steps:');
console.log('  1. npx playwright install    — install browsers');
console.log('  2. npx playwright test --list — verify config');
console.log('  3. npx playwright test        — run tests');
