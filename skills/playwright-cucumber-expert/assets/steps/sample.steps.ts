import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';
import { config } from '../utils/config';
// NOTE: Replace direct page interactions below with a LoginPage Page Object.
// See playwright-automation-expert > references/page-object-model.md
// import { LoginPage } from '../pages/auth/LoginPage';

// ── Given ─────────────────────────────────────────────────────────────────

Given('I am on the login page', async function (this: PlaywrightWorld) {
  await this.page.goto('/login');
  // Navigate only — no assertions in Given steps
});

// ── When ──────────────────────────────────────────────────────────────────

When('I enter valid credentials', async function (this: PlaywrightWorld) {
  // TODO: replace with LoginPage.login() once Page Object is created
  await this.page.getByLabel('Email').fill(config.testUserEmail);
  await this.page.getByLabel('Password').fill(config.testUserPassword);
  await this.page.getByRole('button', { name: 'Log in' }).click();
});

When('I enter an invalid password', async function (this: PlaywrightWorld) {
  // TODO: replace with LoginPage.login() once Page Object is created
  await this.page.getByLabel('Email').fill(config.testUserEmail);
  await this.page.getByLabel('Password').fill('wrong-password');
  await this.page.getByRole('button', { name: 'Log in' }).click();
});

When(
  'I submit the login form with email {string} and password {string}',
  async function (this: PlaywrightWorld, email: string, password: string) {
    // TODO: replace with LoginPage.login() once Page Object is created
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }
);

// ── Then ──────────────────────────────────────────────────────────────────

Then('I should be redirected to the dashboard', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/dashboard/);
});

Then('I should see my username in the header', async function (this: PlaywrightWorld) {
  await expect(this.page.getByTestId('user-menu')).toBeVisible();
});

Then(
  'I should see an error message {string}',
  async function (this: PlaywrightWorld, message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
);

Then('I should remain on the login page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/login/);
});

Then(
  'I should see a validation error for the {string} field',
  async function (this: PlaywrightWorld, fieldName: string) {
    const field = this.page.getByLabel(new RegExp(fieldName, 'i'));
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  }
);
