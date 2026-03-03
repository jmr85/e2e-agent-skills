// utils/config.ts
// All environment configuration lives here — never hardcode URLs or credentials in step files.
export const config = {
  baseUrl:       process.env.BASE_URL           || 'http://localhost:3000',
  headless:      process.env.HEADLESS           !== 'false',
  slowMo:        Number(process.env.SLOWMO)     || 0,
  timeout:       Number(process.env.TIMEOUT)    || 30000,
  testUserEmail: process.env.TEST_USER_EMAIL    || 'user@example.com',
  testUserPassword: process.env.TEST_USER_PASSWORD || 'password123',
};
