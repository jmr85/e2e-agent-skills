import { APIResponse, expect } from '@playwright/test';

/**
 * Asserts that the response has the expected HTTP status code.
 * Includes a descriptive failure message with the actual status and URL.
 */
export async function expectStatus(response: APIResponse, expected: number) {
  expect(
    response.status(),
    `Expected HTTP ${expected} but got ${response.status()} — ${response.url()}`
  ).toBe(expected);
}

/**
 * Asserts that the response has a 2xx status code.
 * Includes a descriptive failure message with the actual status and URL.
 */
export async function expectSuccess(response: APIResponse) {
  expect(
    response.ok(),
    `Expected 2xx but got ${response.status()} — ${response.url()}`
  ).toBe(true);
}
