# Scaffolding Commands

Commands to generate the standard Playwright project structure from scratch.

---

## Bash / macOS / Linux / WSL

### Base structure (Level 1 — flat)

```bash
mkdir -p tests pages components fixtures utils test-data/auth test-data/images .github/workflows

# Placeholder files to preserve folders in git
touch pages/.gitkeep
touch components/.gitkeep
touch utils/.gitkeep
touch test-data/images/.gitkeep

# Gitignore auth state files
echo "test-data/auth/\*.auth.json" >> .gitignore
echo "playwright-report/" >> .gitignore
echo "test-results/" >> .gitignore
echo "blob-report/" >> .gitignore

# Fixtures barrel file
cat > fixtures/index.ts << 'EOF'
import { test as base, expect } from '@playwright/test';

// Extend with your custom fixtures here
// import { authFixtures } from './auth.fixture';
// export const test = base.extend(authFixtures);

export const test = base;
export { expect };
EOF

echo "Base structure created."
```

---

### Feature-grouped structure (Level 2)

```bash
# Tests grouped by feature
mkdir -p tests/auth tests/dashboard tests/settings

# Pages grouped by feature
mkdir -p pages/auth pages/dashboard pages/settings

# Shared components
mkdir -p components

# Fixtures, utils, test-data
mkdir -p fixtures utils test-data/auth test-data/images

# CI
mkdir -p .github/workflows

# Gitignore
cat >> .gitignore << 'EOF'
playwright-report/
test-results/
blob-report/
test-data/auth/*.auth.json
EOF

echo "Feature-grouped structure created."
```

---

### Full domain-based structure (Level 3)

```bash
# Test directories by type and feature
mkdir -p \
  tests/e2e \
  tests/features/auth \
  tests/features/catalog \
  tests/features/cart \
  tests/features/checkout \
  tests/api \
  tests/visual

# Page Objects by feature
mkdir -p \
  pages/auth \
  pages/catalog \
  pages/cart \
  pages/checkout

# Components
mkdir -p components

# Fixtures
mkdir -p fixtures

# Utils with subfolders
mkdir -p utils/api utils/builders

# Test data by feature
mkdir -p \
  test-data/auth \
  test-data/catalog \
  test-data/checkout \
  test-data/images

# CI
mkdir -p .github/workflows

# Gitignore
cat >> .gitignore << 'EOF'
playwright-report/
test-results/
blob-report/
test-data/auth/*.auth.json
EOF

echo "Domain-based structure created."
```

---

## PowerShell (Windows)

### Base structure (Level 1 — flat)

```powershell
# Create folders
$folders = @(
  "tests", "pages", "components", "fixtures",
  "utils", "test-data\auth", "test-data\images", ".github\workflows"
)
foreach ($f in $folders) { New-Item -ItemType Directory -Force -Path $f }

# Gitignore entries
Add-Content .gitignore "`nplaywright-report/"
Add-Content .gitignore "test-results/"
Add-Content .gitignore "blob-report/"
Add-Content .gitignore "test-data/auth/*.auth.json"

# Fixtures barrel
Set-Content fixtures\index.ts @"
import { test as base, expect } from '@playwright/test';

// Extend with your custom fixtures here
// import { authFixtures } from './auth.fixture';
// export const test = base.extend(authFixtures);

export const test = base;
export { expect };
"@

Write-Host "Base structure created."
```

---

### Feature-grouped structure (Level 2 — PowerShell)

```powershell
$folders = @(
  "tests\auth", "tests\dashboard", "tests\settings",
  "pages\auth", "pages\dashboard", "pages\settings",
  "components", "fixtures", "utils",
  "test-data\auth", "test-data\images",
  ".github\workflows"
)
foreach ($f in $folders) { New-Item -ItemType Directory -Force -Path $f }

Add-Content .gitignore "`nplaywright-report/"
Add-Content .gitignore "test-results/"
Add-Content .gitignore "test-data/auth/*.auth.json"

Write-Host "Feature-grouped structure created."
```

---

## npm Script (cross-platform, add to package.json)

Add this script to `package.json` for a one-command setup:

```json
{
  "scripts": {
    "scaffold": "node scripts/scaffold.mjs"
  }
}
```

Create `scripts/scaffold.mjs`:

```javascript
// scripts/scaffold.mjs
import { mkdirSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const dirs = [
  'tests/auth',
  'tests/dashboard',
  'tests/settings',
  'pages',
  'components',
  'fixtures',
  'utils',
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
  `import { test as base, expect } from '@playwright/test';\n\nexport const test = base;\nexport { expect };\n`
);

// Gitignore entries
const gitignoreEntries = [
  '\n# Playwright',
  'playwright-report/',
  'test-results/',
  'blob-report/',
  'test-data/auth/*.auth.json',
].join('\n');

if (!existsSync('.gitignore')) {
  writeFileSync('.gitignore', gitignoreEntries);
} else {
  appendFileSync('.gitignore', gitignoreEntries);
}

console.log('\nPlaywright project structure created successfully.');
console.log('Next: npx playwright install');
```

Run with:

```bash
npm run scaffold
```

---

## After Scaffolding — Next Steps

```bash
# 1. Install Playwright (if not done)
npm init playwright@latest

# 2. Install browsers
npx playwright install

# 3. Verify config
npx playwright test --list

# 4. Run first test
npx playwright test

# 5. Open report
npx playwright show-report
```

---

## Quick Reference

| Goal | Command |
|------|---------|
| Flat structure (bash) | Copy Level 1 bash block above |
| Feature structure (bash) | Copy Level 2 bash block above |
| Domain structure (bash) | Copy Level 3 bash block above |
| Windows flat (PowerShell) | Copy Level 1 PowerShell block above |
| Cross-platform script | Add `scripts/scaffold.mjs` + npm script |
| Install Playwright browsers | `npx playwright install` |
| Open HTML report | `npx playwright show-report` |
