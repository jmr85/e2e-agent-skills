import { expect } from '@playwright/test';

type Schema = {
  required?: string[];
  properties: Record<string, { type: string; format?: string; nullable?: boolean }>;
};

/**
 * Validates the shape of a JSON response body against a lightweight schema definition.
 *
 * Checks:
 * - All required fields are present
 * - Present fields match the declared type
 * - String fields with format 'email', 'uuid', or 'iso-date' pass format validation
 * - Non-nullable fields that are present are not null
 *
 * Usage:
 *   const body = await response.json();
 *   validateSchema(body, userSchema, 'GET /api/users/:id');
 */
export function validateSchema(body: unknown, schema: Schema, context = 'response body') {
  expect(typeof body, `${context} must be an object`).toBe('object');
  expect(body).not.toBeNull();

  const obj = body as Record<string, unknown>;

  // Check required fields
  for (const field of schema.required ?? []) {
    expect(obj, `${context} is missing required field "${field}"`).toHaveProperty(field);
  }

  // Check property types and formats
  for (const [field, def] of Object.entries(schema.properties)) {
    if (field in obj && obj[field] !== null) {
      expect(
        typeof obj[field],
        `${context}.${field} should be ${def.type} but got ${typeof obj[field]}`
      ).toBe(def.type);

      if (def.format === 'email') {
        expect(obj[field] as string).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
      if (def.format === 'uuid') {
        expect(obj[field] as string).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
      }
      if (def.format === 'iso-date') {
        expect(new Date(obj[field] as string).toString()).not.toBe('Invalid Date');
      }
    } else if (!def.nullable && field in obj) {
      expect(obj[field], `${context}.${field} should not be null`).not.toBeNull();
    }
  }
}
