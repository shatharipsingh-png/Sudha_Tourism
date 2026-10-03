import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/health returns healthy response', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
});
