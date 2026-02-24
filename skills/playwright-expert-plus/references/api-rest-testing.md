# API REST Testing

Testing REST APIs directly with Playwright's `request` context — no browser required.

---

## Setup: API Request Context

```typescript
// fixtures/api.fixture.ts
import { test as base, APIRequestContext } from '@playwright/test';

type ApiFixtures = {
  apiContext: APIRequestContext;
  authToken: string;
};

export const test = base.extend<ApiFixtures>({
  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    await use(context);
    await context.dispose();
  },

  authToken: async ({ apiContext }, use) => {
    const response = await apiContext.post('/api/auth/login', {
      data: { email: 'user@test.com', password: 'password123' },
    });
    const body = await response.json();
    await use(body.token);
  },
});

export { expect } from '@playwright/test';
```

---

## Login & Register — Positive Cases

```typescript
// tests/api/auth.spec.ts
import { test, expect } from '@fixtures/index';

test.describe('POST /api/auth/login', () => {
  test('returns 200 and token with valid credentials', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: {
        email: 'user@test.com',
        password: 'password123',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe('user@test.com');
  });
});

test.describe('POST /api/auth/register', () => {
  test('returns 201 and creates user with valid data', async ({ apiContext }) => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      name: 'Test User',
    };

    const response = await apiContext.post('/api/auth/register', {
      data: newUser,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.email).toBe(newUser.email);
    expect(body).not.toHaveProperty('password'); // Never expose password
  });
});
```

---

## Login & Register — Negative Cases

```typescript
test.describe('POST /api/auth/login — negative', () => {
  test('returns 401 with wrong password', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: { email: 'user@test.com', password: 'wrongpassword' },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body).not.toHaveProperty('token');
  });

  test('returns 401 with non-existent user', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: { email: 'nobody@nowhere.com', password: 'irrelevant' },
    });

    expect(response.status()).toBe(401);
  });

  test('returns 400 when email is missing', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: { password: 'password123' },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 when body is empty', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', { data: {} });
    expect(response.status()).toBe(400);
  });
});

test.describe('POST /api/auth/register — negative', () => {
  test('returns 409 when email already exists', async ({ apiContext }) => {
    const data = { email: 'existing@test.com', password: 'Pass123!', name: 'Existing' };

    // First registration
    await apiContext.post('/api/auth/register', { data });

    // Second registration with same email
    const response = await apiContext.post('/api/auth/register', { data });

    expect(response.status()).toBe(409);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 422 with invalid email format', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/register', {
      data: { email: 'not-an-email', password: 'Pass123!', name: 'Test' },
    });

    expect(response.status()).toBe(422);
  });

  test('returns 422 with weak password', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/register', {
      data: { email: 'test@example.com', password: '123', name: 'Test' },
    });

    expect(response.status()).toBe(422);
  });
});
```

---

## HTTP Status Code Validation

```typescript
// utils/api-assertions.ts
import { APIResponse, expect } from '@playwright/test';

export async function expectStatus(response: APIResponse, expected: number) {
  expect(
    response.status(),
    `Expected HTTP ${expected} but got ${response.status()} — ${response.url()}`
  ).toBe(expected);
}

export async function expectSuccess(response: APIResponse) {
  expect(
    response.ok(),
    `Expected 2xx but got ${response.status()} — ${response.url()}`
  ).toBe(true);
}
```

```typescript
// tests/api/http-codes.spec.ts
test.describe('HTTP status code assertions', () => {
  test('GET /api/users — 200 OK', async ({ apiContext, authToken }) => {
    const response = await apiContext.get('/api/users', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status()).toBe(200);
  });

  test('POST /api/users — 201 Created', async ({ apiContext, authToken }) => {
    const response = await apiContext.post('/api/users', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: 'New User', email: `u${Date.now()}@test.com` },
    });
    expect(response.status()).toBe(201);
  });

  test('GET /api/users/:id — 404 Not Found', async ({ apiContext, authToken }) => {
    const response = await apiContext.get('/api/users/nonexistent-id-999999', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status()).toBe(404);
  });

  test('GET /api/users — 401 Unauthorized (no token)', async ({ apiContext }) => {
    const response = await apiContext.get('/api/users');
    expect(response.status()).toBe(401);
  });

  test('GET /api/admin — 403 Forbidden (non-admin user)', async ({ apiContext, authToken }) => {
    const response = await apiContext.get('/api/admin', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status()).toBe(403);
  });

  test('POST /api/users — 422 Unprocessable (invalid data)', async ({ apiContext, authToken }) => {
    const response = await apiContext.post('/api/users', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { name: '' }, // missing required fields
    });
    expect(response.status()).toBe(422);
  });
});
```

### HTTP Status Code Reference

| Code | Meaning | When to expect |
|------|---------|----------------|
| `200` | OK | Successful GET, PUT |
| `201` | Created | Successful POST that creates resource |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Malformed request body/params |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Valid token, insufficient permissions |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource (e.g., email already exists) |
| `422` | Unprocessable | Valid JSON but failed validation rules |
| `500` | Server Error | Unexpected backend failure |

---

## Idempotency Verification

Idempotent operations: the same request executed N times produces the same result.

```typescript
// tests/api/idempotency.spec.ts
test.describe('Idempotency', () => {
  test('PUT /api/users/:id is idempotent', async ({ apiContext, authToken }) => {
    const userId = 'user-123';
    const updateData = { name: 'Updated Name' };
    const headers = { Authorization: `Bearer ${authToken}` };

    // Execute the same PUT request 3 times
    const responses = await Promise.all([
      apiContext.put(`/api/users/${userId}`, { headers, data: updateData }),
      apiContext.put(`/api/users/${userId}`, { headers, data: updateData }),
      apiContext.put(`/api/users/${userId}`, { headers, data: updateData }),
    ]);

    // All should return same status
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }

    // Final state must be the same as after the first call
    const bodies = await Promise.all(responses.map(r => r.json()));
    expect(bodies[0].name).toBe(bodies[1].name);
    expect(bodies[1].name).toBe(bodies[2].name);
  });

  test('DELETE /api/users/:id is idempotent', async ({ apiContext, authToken }) => {
    const userId = 'user-to-delete';
    const headers = { Authorization: `Bearer ${authToken}` };

    // First DELETE — should succeed
    const first = await apiContext.delete(`/api/users/${userId}`, { headers });
    expect(first.status()).toBe(204);

    // Second DELETE — resource already gone, should return 404 (not 500)
    const second = await apiContext.delete(`/api/users/${userId}`, { headers });
    expect([404, 204]).toContain(second.status()); // Accept both, never 500
  });

  test('POST /api/orders is NOT idempotent (creates duplicates)', async ({ apiContext, authToken }) => {
    const orderData = { productId: 'prod-1', quantity: 1 };
    const headers = { Authorization: `Bearer ${authToken}` };

    const first = await apiContext.post('/api/orders', { headers, data: orderData });
    const second = await apiContext.post('/api/orders', { headers, data: orderData });

    expect(first.status()).toBe(201);
    expect(second.status()).toBe(201);

    // Two different IDs — POST creates new resources each time
    const [body1, body2] = await Promise.all([first.json(), second.json()]);
    expect(body1.id).not.toBe(body2.id);
  });
});
```

---

## Performance Measurement

```typescript
// tests/api/performance.spec.ts
const THRESHOLDS = {
  login: 500,       // ms
  listUsers: 300,   // ms
  createUser: 400,  // ms
};

test.describe('API Performance', () => {
  test('POST /api/auth/login responds within threshold', async ({ apiContext }) => {
    const start = Date.now();

    const response = await apiContext.post('/api/auth/login', {
      data: { email: 'user@test.com', password: 'password123' },
    });

    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration, `Login took ${duration}ms — threshold: ${THRESHOLDS.login}ms`)
      .toBeLessThan(THRESHOLDS.login);
  });

  test('GET /api/users responds within threshold', async ({ apiContext, authToken }) => {
    const start = Date.now();

    const response = await apiContext.get('/api/users', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration, `List users took ${duration}ms — threshold: ${THRESHOLDS.listUsers}ms`)
      .toBeLessThan(THRESHOLDS.listUsers);
  });

  test('measures p95 response time over 10 requests', async ({ apiContext, authToken }) => {
    const RUNS = 10;
    const P95_THRESHOLD = 400; // ms
    const durations: number[] = [];

    for (let i = 0; i < RUNS; i++) {
      const start = Date.now();
      const response = await apiContext.get('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      durations.push(Date.now() - start);
      expect(response.status()).toBe(200);
    }

    // Calculate p95
    const sorted = [...durations].sort((a, b) => a - b);
    const p95Index = Math.ceil(RUNS * 0.95) - 1;
    const p95 = sorted[p95Index];

    console.log(`p95 response time: ${p95}ms (from ${RUNS} runs: ${sorted.join(', ')}ms)`);

    expect(p95, `p95 ${p95}ms exceeds threshold ${P95_THRESHOLD}ms`)
      .toBeLessThan(P95_THRESHOLD);
  });
});
```

---

## JSON Schema Validation

```typescript
// utils/schema-validator.ts
import { expect } from '@playwright/test';

type Schema = {
  required?: string[];
  properties: Record<string, { type: string; format?: string; nullable?: boolean }>;
};

export function validateSchema(body: unknown, schema: Schema, context = 'response body') {
  expect(typeof body, `${context} must be an object`).toBe('object');
  expect(body).not.toBeNull();

  const obj = body as Record<string, unknown>;

  // Check required fields
  for (const field of schema.required ?? []) {
    expect(obj, `${context} is missing required field "${field}"`).toHaveProperty(field);
  }

  // Check property types
  for (const [field, def] of Object.entries(schema.properties)) {
    if (field in obj && obj[field] !== null) {
      expect(
        typeof obj[field],
        `${context}.${field} should be ${def.type} but got ${typeof obj[field]}`
      ).toBe(def.type);

      // Format checks
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
```

```typescript
// tests/api/schemas.spec.ts
import { test, expect } from '@fixtures/index';
import { validateSchema } from '@utils/schema-validator';

// Define schemas
const userSchema = {
  required: ['id', 'email', 'name', 'createdAt'],
  properties: {
    id:        { type: 'string', format: 'uuid' },
    email:     { type: 'string', format: 'email' },
    name:      { type: 'string' },
    role:      { type: 'string' },
    createdAt: { type: 'string', format: 'iso-date' },
    password:  { type: 'string' }, // Should NOT be present
  },
};

const loginResponseSchema = {
  required: ['token', 'user'],
  properties: {
    token:      { type: 'string' },
    expiresIn:  { type: 'number' },
    user:       { type: 'object' },
  },
};

test.describe('JSON Schema Validation', () => {
  test('GET /api/users/:id — validates user schema', async ({ apiContext, authToken }) => {
    const response = await apiContext.get('/api/users/user-123', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    validateSchema(body, userSchema, 'GET /api/users/:id');

    // Password must NEVER be exposed
    expect(body).not.toHaveProperty('password');
  });

  test('POST /api/auth/login — validates login response schema', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: { email: 'user@test.com', password: 'password123' },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    validateSchema(body, loginResponseSchema, 'POST /api/auth/login');
  });

  test('GET /api/users — validates array response', async ({ apiContext, authToken }) => {
    const response = await apiContext.get('/api/users', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    // Validate each item in the array
    for (const user of body) {
      validateSchema(user, userSchema, `user item in GET /api/users`);
      expect(user).not.toHaveProperty('password');
    }
  });

  test('error responses include error field', async ({ apiContext }) => {
    const response = await apiContext.post('/api/auth/login', {
      data: { email: 'bad@bad.com', password: 'wrong' },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});
```

---

## Quick Reference

| Topic | Pattern |
|-------|---------|
| API context setup | `playwright.request.newContext({ baseURL })` |
| Authenticated requests | Pass `Authorization: Bearer <token>` header |
| Assert status first | `expect(response.status()).toBe(200)` before body |
| Idempotency (PUT) | Run N times, assert same final state |
| Idempotency (DELETE) | Second call returns `404`, never `500` |
| Performance threshold | `expect(duration).toBeLessThan(THRESHOLD)` |
| p95 measurement | Sort N durations, pick index `ceil(N * 0.95) - 1` |
| Schema validation | Check required fields + property types + formats |
| Never expose | `password`, internal tokens, PII in API responses |

| HTTP Method | Idempotent? | Expected status on repeat |
|-------------|-------------|---------------------------|
| GET | Yes | Always `200` |
| PUT | Yes | Always `200` |
| DELETE | Yes | `204` then `404` |
| POST | No | Creates new resource each time (`201`) |
| PATCH | Depends | Check API contract |
