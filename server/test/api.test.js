import test, { beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { env, runtimeSchema } from '../src/config/env.js';
import { leadSchema } from '../src/validators/leads.js';

let ip = 1;
let dbCalls;
let execute;
let query;
function api(method, path, address = `192.0.2.${ip++}`) {
  return request(app)[method](path).set('X-Forwarded-For', address);
}
beforeEach(() => {
  dbCalls = [];
  execute = async () => { throw new Error('Unexpected execute'); };
  query = async () => { throw new Error('Unexpected query'); };
  mock.method(pool, 'execute', async (sql, params) => { dbCalls.push({ sql, params }); return execute(sql, params); });
  mock.method(pool, 'query', async (sql, params) => { dbCalls.push({ sql, params }); return query(sql, params); });
});
afterEach(() => mock.restoreAll());

test('readiness checks DB and hides connection errors', async () => {
  query = async (options) => { assert.equal(options.sql, 'SELECT 1'); return [[{ 1: 1 }]]; };
  const ready = await api('get', '/api/health/ready');
  assert.equal(ready.status, 200);
  assert.deepEqual(ready.body.data, { status: 'ready', database: 'connected' });
  query = async () => { throw new Error('SECRET database host/password'); };
  const failed = await api('get', '/api/health/ready');
  assert.equal(failed.status, 503);
  assert.ok(!JSON.stringify(failed.body).includes('SECRET'));
});

test('admin routes reject anonymous requests before querying DB', async () => {
  for (const path of ['/api/admin/me', '/api/admin/leads']) {
    assert.equal((await api('get', path)).status, 401);
  }
  assert.equal(dbCalls.length, 0);
});

test('invalid login is generic and performs bcrypt for unknown accounts', async () => {
  execute = async () => [[]];
  const compare = mock.method(bcrypt, 'compare', async () => false);
  const response = await api('post', '/api/admin/login').send({ email: 'unknown@example.test', password: 'wrong' });
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Invalid email or password');
  assert.equal(compare.mock.callCount(), 1);
  assert.match(compare.mock.calls[0].arguments[1], /^\$2[ab]\$12\$/);
});

test('login issues eight-hour HttpOnly SameSite strict HS256 cookie', async () => {
  execute = async () => [[{ id: 7, email: 'admin@example.test', password_hash: 'dummy' }]];
  mock.method(bcrypt, 'compare', async () => true);
  const response = await api('post', '/api/admin/login').send({ email: 'admin@example.test', password: 'password' });
  assert.equal(response.status, 200);
  const cookie = response.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  const token = cookie.split(';')[0].slice('st_admin='.length);
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  assert.equal(payload.sub, '7');
  assert.equal(payload.exp - payload.iat, 8 * 3600);
});

test('JWT algorithm restriction rejects HS384 without DB access', async () => {
  const token = jwt.sign({ sub: '7' }, env.JWT_SECRET, { algorithm: 'HS384' });
  assert.equal((await api('get', '/api/admin/me').set('Cookie', `st_admin=${token}`)).status, 401);
  assert.equal(dbCalls.length, 0);
});

test('invalid leads and invalid booking dates never reach SQL', async () => {
  const bodies = [
    { type: 'enquiry', email: 'bad' },
    { type: 'booking', name: 'Test', email: 'test@example.test', phone: '+91 12345678', package_id: 1, travelers: 2, travel_date: '2000-01-01' },
    { type: 'booking', name: 'Test', email: 'test@example.test', phone: '+91 12345678', package_id: '', travelers: '', travel_date: '2099-02-30' },
    { type: 'newsletter', email: 'test@example.test' }
  ];
  for (const body of bodies) assert.equal((await api('post', '/api/leads').send(body)).status, 400);
  assert.equal(dbCalls.length, 0);
});

test('valid enquiry normalizes blank optional fields before inserting', async () => {
  execute = async (sql, params) => {
    assert.match(sql, /INSERT INTO leads/);
    assert.deepEqual(params.slice(4, 9), [null, null, null, null, null]);
    assert.match(params[10], /^[a-f0-9]{64}$/);
    return [{ insertId: 11 }];
  };
  const response = await api('post', '/api/leads').send({
    type: 'enquiry', name: 'Test', email: 'TEST@example.test', phone: '+91 12345678',
    package_id: '', destination_id: ' ', travel_date: '', travelers: '', details: ''
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.id, 11);
  assert.equal(dbCalls[0].params[2], 'test@example.test');
});

test('valid contact accepts an empty optional phone', async () => {
  execute = async (sql, params) => { assert.equal(params[3], null); return [{ insertId: 12 }]; };
  const response = await api('post', '/api/leads').send({
    type: 'contact', name: 'Test', email: 'test@example.test', phone: '', message: 'Please contact me about travel.'
  });
  assert.equal(response.status, 200);
});

test('unknown details keys and impossible dates are rejected', () => {
  const base = { type: 'enquiry', name: 'Test', email: 'test@example.test', phone: '+91 12345678' };
  assert.equal(leadSchema.safeParse({ ...base, details: { sensitive: 'uncontrolled' } }).success, false);
  assert.equal(leadSchema.safeParse({ ...base, travel_date: '2027-02-30' }).success, false);
  assert.equal(leadSchema.safeParse({ ...base, travelers: '' }).data.travelers, undefined);
});

test('newsletter duplicate and concurrent requests return identical private response', async () => {
  execute = async (sql, params) => {
    assert.match(sql, /ON DUPLICATE KEY UPDATE id = id/);
    assert.match(sql, /consent_at/);
    assert.equal(params[0], 'test@example.test');
    return [{ insertId: 123, affectedRows: 1 }];
  };
  const responses = await Promise.all(Array.from({ length: 3 }, () =>
    api('post', '/api/leads').send({ type: 'newsletter', email: 'TEST@example.test', consent: true })));
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { success: true, data: { id: null }, message: 'Lead received.' });
  }
  assert.equal(dbCalls.length, 3);
});

test('malformed JSON is 400 and oversized body is 413', async () => {
  const bad = await api('post', '/api/leads').set('Content-Type', 'application/json').send('{"type":');
  assert.equal(bad.status, 400);
  const large = await api('post', '/api/leads').send({ message: 'x'.repeat(25000) });
  assert.equal(large.status, 413);
  assert.equal(dbCalls.length, 0);
});

test('CORS deliberately rejects other origins and permits configured origin', async () => {
  assert.equal((await api('get', '/api/health').set('Origin', 'https://untrusted.example')).status, 403);
  const allowed = await api('get', '/api/health').set('Origin', env.CLIENT_URL);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers['access-control-allow-origin'], env.CLIENT_URL);
});

test('invalid pagination and slugs fail validation without SQL', async () => {
  for (const path of ['/api/packages?page=-1', '/api/packages?page=100001', '/api/packages?limit=25', '/api/packages?category=invalid', '/api/packages?minPrice=100&maxPrice=2', '/api/packages?destination=a%27', '/api/packages/Bad_slug', '/api/destinations/Bad_slug']) {
    assert.equal((await api('get', path)).status, 400);
  }
  assert.equal(dbCalls.length, 0);
});

test('package pagination uses text protocol and bounded numeric parameters', async () => {
  execute = async () => [[{ total: 3 }]];
  query = async (sql, params) => {
    assert.match(sql, /LIMIT \? OFFSET \?/);
    assert.deepEqual(params, ['family', 2, 2]);
    return [[{ id: 1 }]];
  };
  const response = await api('get', '/api/packages?page=2&limit=2&category=family');
  assert.equal(response.status, 200);
  assert.equal(response.body.data.totalPages, 2);
});

test('admin leads validate pagination and sort ties by ID', async () => {
  execute = async (sql) => sql.includes('FROM admins') ? [[{ id: 7, email: 'admin@example.test' }]] : [[{ total: 0 }]];
  query = async (sql, params) => {
    assert.match(sql, /ORDER BY l.created_at DESC, l.id DESC/);
    assert.deepEqual(params, [20, 20]);
    return [[]];
  };
  const cookie = `st_admin=${jwt.sign({ sub: '7' }, env.JWT_SECRET, { algorithm: 'HS256' })}`;
  assert.equal((await api('get', '/api/admin/leads?page=bad').set('Cookie', cookie)).status, 400);
  assert.equal((await api('get', '/api/admin/leads?page=2').set('Cookie', cookie)).status, 200);
});

test('lead limiter enforces five requests per configured proxy IP', async () => {
  for (let count = 0; count < 5; count++) assert.equal((await api('post', '/api/leads', '198.51.100.10').send({})).status, 400);
  assert.equal((await api('post', '/api/leads', '198.51.100.10').send({})).status, 429);
  assert.equal((await api('post', '/api/leads', '198.51.100.11').send({})).status, 400);
});

test('successful logins do not consume failed-login allowance', async () => {
  execute = async () => [[{ id: 7, email: 'admin@example.test', password_hash: 'dummy' }]];
  mock.method(bcrypt, 'compare', async () => true);
  for (let count = 0; count < 6; count++) {
    assert.equal((await api('post', '/api/admin/login', '198.51.100.20').send({ email: 'admin@example.test', password: 'password' })).status, 200);
  }
});

test('unexpected SQL failure hides internals', async () => {
  const logs = [];
  mock.method(console, 'log', (entry) => logs.push(entry));
  execute = async () => { throw new Error('SECRET SQL password filesystem stack'); };
  const response = await api('get', '/api/packages');
  assert.equal(response.status, 500);
  assert.equal(JSON.stringify(response.body).includes('SECRET'), false);
  assert.equal(JSON.parse(logs[0]).path, '/api/packages');
});

test('runtime validates secrets/proxy without requiring seed credentials', () => {
  assert.equal(runtimeSchema.safeParse(process.env).success, true);
  for (const values of [{ JWT_SECRET: 'short' }, { IP_SALT: 'short' }, { TRUST_PROXY: 'true' }, { TRUST_PROXY: '-1' }, { TRUST_PROXY: '11' }]) {
    assert.equal(runtimeSchema.safeParse({ ...process.env, ...values }).success, false);
  }
});

test('request logs exclude queries, cookies and body data', async () => {
  const logs = [];
  mock.method(console, 'log', (entry) => logs.push(entry));
  await api('get', '/api/health?email=SECRET').set('Cookie', 'SECRET');
  assert.equal(logs.length, 1);
  const record = JSON.parse(logs[0]);
  assert.deepEqual(Object.keys(record).sort(), ['durationMs', 'method', 'path', 'status']);
  assert.equal(record.path, '/api/health');
  assert.equal(logs[0].includes('SECRET'), false);
});
