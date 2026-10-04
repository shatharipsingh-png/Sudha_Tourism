import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

test('server starts, serves probes and gracefully closes HTTP/pool on SIGTERM', async () => {
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const code = `
    process.env.PORT = '${port}';
    const { pool } = await import('./src/db/pool.js');
    pool.query = async () => [[{ result: 1 }]];
    pool.end = async () => console.log('TEST_POOL_CLOSED');
    await import('./src/server.js');
    process.stdin.once('data', () => process.emit('SIGTERM'));
  `;
  const child = spawn(process.execPath, ['--import', './test/setup.js', '--input-type=module', '--eval', code], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true
  });
  let output = '';
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  const exited = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (exitCode) => resolve(exitCode));
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 15000);
      child.stdout.on('data', (chunk) => {
        output += chunk;
        if (output.includes('API listening')) { clearTimeout(timeout); resolve(); }
      });
      child.on('exit', () => { clearTimeout(timeout); reject(new Error('Server exited before listening')); });
      child.on('error', (error) => { clearTimeout(timeout); reject(error); });
    });
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).data.status, 'ok');
    const ready = await fetch(`http://127.0.0.1:${port}/api/health/ready`);
    assert.equal(ready.status, 200);
    assert.equal((await ready.json()).data.database, 'connected');
    // Windows kills native SIGTERM immediately. Emit the Node signal event in
    // the child to exercise the actual registered shutdown handler portably.
    child.stdin.end("\n");
    assert.equal(await Promise.race([exited, new Promise((_, reject) => {
      const timeout = setTimeout(() => reject(new Error('Shutdown timed out')), 15000);
      timeout.unref();
    })]), 0);
    assert.match(output, /"reason":"SIGTERM"/);
    assert.match(output, /TEST_POOL_CLOSED/);
    assert.equal(errors.includes('SECRET'), false);
  } finally {
    if (child.exitCode === null) child.kill();
  }
});
