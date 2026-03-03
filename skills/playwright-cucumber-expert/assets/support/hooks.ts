import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import { PlaywrightWorld } from './world';
import { config } from '../utils/config';

// ── Global setup (runs once before ALL scenarios) ──────────────────────────
BeforeAll(async function () {
  // Use for: starting a test server, seeding a DB, pre-generating shared tokens
  // WARNING: `this` is NOT a World instance here — no page/browser/context access
});

// ── Per-scenario setup (runs before EACH scenario) ─────────────────────────
Before(async function (this: PlaywrightWorld) {
  this.browser = await chromium.launch({ headless: config.headless, slowMo: config.slowMo });
  this.context = await this.browser.newContext({
    baseURL: config.baseUrl,
    viewport: { width: 1280, height: 720 },
  });
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(config.timeout);
});

// ── Tagged hook — only runs before @authenticated scenarios ────────────────
Before({ tags: '@authenticated' }, async function (this: PlaywrightWorld) {
  // Load stored auth state to skip the login UI
  await this.context.storageState({ path: 'test-data/auth/user.auth.json' });
});

// ── Per-scenario teardown (runs after EACH scenario) ───────────────────────
After(async function (this: PlaywrightWorld, scenario) {
  try {
    if (scenario.result?.status === Status.FAILED) {
      // Embed screenshot in HTML report
      const screenshot = await this.page.screenshot({ fullPage: true });
      this.attach(screenshot, 'image/png');
    }
  } finally {
    // Always close — even if screenshot capture fails
    await this.page?.close();
    await this.context?.close();
    await this.browser?.close();
  }
});

// ── Global teardown (runs once after ALL scenarios) ────────────────────────
AfterAll(async function () {
  // Use for: stopping a test server, removing test DB records, revoking shared auth
  // WARNING: `this` is NOT a World instance here
});
