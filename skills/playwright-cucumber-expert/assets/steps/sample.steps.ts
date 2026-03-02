import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';
// import { LoginPage } from '../page-objects/auth/LoginPage'; // add when POM is ready

// ── Given ─────────────────────────────────────────────────────────────────

Given('I am on the login page', async function (this: PlaywrightWorld) {
  await this.page.goto('/login');
  await expect(this.page.getByRole('heading', { name: 'Log in' })).toBeVisible();
});

// ── When ──────────────────────────────────────────────────────────────────

When('I enter valid credentials', async function (this: PlaywrightWorld) {
  // Use a LoginPage Page Object here once created (see playwright-automation-expert)
  await this.page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || 'user@example.com');
  await this.page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'password123');
  await this.page.getByRole('button', { name: 'Log in' }).click();
});

When('I enter an invalid password', async function (this: PlaywrightWorld) {
  await this.page.getByLabel('Email').fill('user@example.com');
  await this.page.getByLabel('Password').fill('wrong-password');
  await this.page.getByRole('button', { name: 'Log in' }).click();
});

When(
  'I submit the login form with email {string} and password {string}',
  async function (this: PlaywrightWorld, email: string, password: string) {
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
