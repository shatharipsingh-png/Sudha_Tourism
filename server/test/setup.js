// This preload never reads .env. Every DB entry point fails closed until
// a test deliberately replaces it with an in-memory fake.
Object.assign(process.env, {
  NODE_ENV: 'test', PORT: '5000', CLIENT_URL: 'http://localhost:5173',
  DB_HOST: 'invalid.test', DB_PORT: '3306', DB_USER: 'test_only',
  DB_PASSWORD: '', DB_NAME: 'sudha_tourism_test',
  JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters',
  IP_SALT: 'test-only-ip-salt-32-characters', TRUST_PROXY: '1'
});
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
process.env.SMTP_ENABLED = 'false';
for (const key of ['SMTP_HOST','SMTP_PORT','SMTP_SECURE','SMTP_USER','SMTP_PASSWORD','LEAD_NOTIFICATION_TO','MAIL_FROM']) delete process.env[key];
const { pool } = await import('../src/db/pool.js');
for (const method of ['execute', 'query', 'getConnection']) {
  pool[method] = async () => { throw new Error('Real database access prohibited in tests.'); };
}
