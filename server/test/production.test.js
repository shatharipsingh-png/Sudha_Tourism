import test, { beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { env, runtimeSchema } from '../src/config/env.js';
import { publicOrigin } from '../src/utils/publicOrigin.js';
import {
  publicPaths,
  sitemapXml,
  xmlEscape,
  robotsText,
} from '../src/routes/seo.js';
import { seedDatabase } from '../src/db/seedRunner.js';
const frontend = 'https://www.example.test';
let original, connection, calls;
beforeEach(() => {
  original = env.CLIENT_URL;
  env.CLIENT_URL = frontend;
  calls = [];
  connection = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
    query: async (sql) => {
      calls.push(sql);
      return sql.includes('FROM destinations')
        ? [[{ slug: 'rajasthan' }]]
        : [[{ slug: 'heritage-trip' }]];
    },
  };
  mock.method(pool, 'getConnection', async () => connection);
});
afterEach(() => {
  env.CLIENT_URL = original;
  mock.restoreAll();
});
test('sitemap queries published packages and includes all public route types', async () => {
  const result = await request(app).get('/sitemap.xml');
  assert.equal(result.status, 200);
  assert.match(result.headers['content-type'], /application\/xml/);
  for (const path of publicPaths)
    assert.ok(result.text.includes(`${frontend}${path}</loc>`));
  assert.ok(result.text.includes(`${frontend}/destinations/rajasthan`));
  assert.ok(result.text.includes(`${frontend}/packages/heritage-trip`));
  assert.ok(calls.some((value) => value.includes?.("status = 'published'")));
  assert.ok(!result.text.includes('/admin'));
  assert.ok(!result.text.includes('/api/'));
  assert.deepEqual(
    calls.filter((value) => ['begin', 'commit', 'release'].includes(value)),
    ['begin', 'commit', 'release'],
  );
});
test('unconfigured local sitemap returns safe 503 before accessing MySQL', async () => {
  env.CLIENT_URL = 'http://localhost:5173';
  const result = await request(app).get('/sitemap.xml');
  assert.equal(result.status, 503);
  assert.equal(calls.length, 0);
  assert.ok(!result.text.includes('localhost'));
  assert.equal(result.headers['cache-control'], 'no-store');
});
test('sitemap DB failures roll back/release and conceal SQL and credentials', async () => {
  connection.query = async () => {
    throw new Error('SECRET SQL db password');
  };
  const result = await request(app).get('/sitemap.xml');
  assert.equal(result.status, 503);
  assert.ok(!result.text.includes('SECRET'));
  assert.deepEqual(calls, ['begin', 'rollback', 'release']);
});
test('sitemap XML safely escapes source data and removes duplicate paths', () => {
  const xml = sitemapXml(
    frontend,
    [{ slug: 'a&b' }],
    [{ slug: 'a&b' }, { slug: 'a&b' }],
  );
  assert.ok(xml.includes('/packages/a%26b'));
  assert.equal(xml.match(/\/packages\/a%26b/g).length, 1);
  assert.equal(xmlEscape('&<>"\''), '&amp;&lt;&gt;&quot;&apos;');
});
test('robots excludes admin/API while preserving assets and correct sitemap', async () => {
  const result = await request(app).get('/robots.txt');
  assert.equal(result.status, 200);
  assert.match(result.headers['content-type'], /text\/plain/);
  assert.ok(result.text.includes('Disallow: /admin'));
  assert.ok(result.text.includes(`Sitemap: ${frontend}/sitemap.xml`));
  assert.ok(!robotsText(null).includes('Sitemap:'));
});
test('public origins reject credentials, local/private hosts, paths and non-HTTPS', () => {
  for (const origin of [
    'http://example.test',
    'https://localhost',
    'https://127.0.0.1',
    'https://10.0.0.1',
    'https://192.168.1.1',
    'https://[::1]',
    'https://u:p@example.test',
    'https://example.test/path',
  ])
    assert.equal(publicOrigin(origin), null);
  assert.equal(publicOrigin(frontend), frontend);
});
test('production runtime requires HTTPS frontend, independent non-placeholder secrets and explicit proxy bounds', () => {
  const valid = {
    ...process.env,
    NODE_ENV: 'production',
    CLIENT_URL: frontend,
    JWT_SECRET: 'A8ed1e8d44c74bd381a5177f650c493bae3a',
    IP_SALT: 'B16c1a08f6a54beba738d52f6e8a39dc',
  };
  assert.equal(runtimeSchema.safeParse(valid).success, true);
  for (const values of [
    { CLIENT_URL: 'http://localhost:5173' },
    { JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters' },
    { IP_SALT: valid.JWT_SECRET },
    { TRUST_PROXY: 'true' },
  ])
    assert.equal(
      runtimeSchema.safeParse({ ...valid, ...values }).success,
      false,
    );
});
test('production seed refuses administrator provisioning before any DB access', async () => {
  const originalMode = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(
      seedDatabase(
        {},
        { email: 'admin@example.test', password: 'MockOnlyPassword9!' },
      ),
      /admin:create/,
    );
  } finally {
    process.env.NODE_ENV = originalMode;
  }
});
test('cookie-bearing admin writes without approved Origin are refused before SQL', async () => {
  const cookie = `st_admin=${jwt.sign({ sub: '1' }, env.JWT_SECRET)}`;
  for (const method of ['post', 'patch', 'delete']) {
    const result = await request(app)
      [method]('/api/admin/packages/1')
      .set('Cookie', cookie)
      .send({});
    assert.equal(result.status, 403);
    assert.equal(result.body.message, 'Origin not allowed.');
  }
});
test('foreign/null browser origins are rejected including cookie-bearing writes', async () => {
  for (const origin of ['https://attacker.example.test', 'null']) {
    const result = await request(app)
      .post('/api/admin/logout')
      .set('Origin', origin)
      .set('Cookie', 'st_admin=invalid');
    assert.equal(result.status, 403);
    assert.ok(!result.headers['access-control-allow-origin']);
  }
});
test('credentialed CORS accepts only the approved origin and supported methods', async () => {
  const result = await request(app)
    .options('/api/admin/packages')
    .set('Origin', frontend)
    .set('Access-Control-Request-Method', 'PATCH')
    .set('Access-Control-Request-Headers', 'content-type');
  assert.equal(result.status, 204);
  assert.equal(result.headers['access-control-allow-origin'], frontend);
  assert.equal(result.headers['access-control-allow-credentials'], 'true');
  assert.equal(
    result.headers['access-control-allow-methods'],
    'GET,HEAD,POST,PATCH,DELETE',
  );
});
test('private API responses are non-cacheable and excluded from indexing', async () => {
  const result = await request(app).get('/api/admin/me');
  assert.equal(result.status, 401);
  assert.equal(result.headers['cache-control'], 'no-store');
  assert.equal(result.headers['x-robots-tag'], 'noindex, nofollow');
});
test('request ID is generated independently of untrusted incoming values', async () => {
  const result = await request(app)
    .get('/api/health')
    .set('X-Request-ID', 'SECRET credential');
  assert.match(result.headers['x-request-id'], /^[a-f0-9-]{36}$/);
  assert.ok(!result.text.includes('SECRET'));
});
test('metadata routes log correct fixed routes without queries', async () => {
  const logs = [];
  mock.method(console, 'log', (entry) => logs.push(JSON.parse(entry)));
  await request(app).get('/robots.txt?email=SECRET');
  assert.equal(logs[0].path, '/robots.txt');
  assert.ok(!JSON.stringify(logs).includes('SECRET'));
});
