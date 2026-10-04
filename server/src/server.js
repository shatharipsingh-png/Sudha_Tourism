import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const server = app.listen(env.PORT, () => console.log(`Sudha Tourism API listening on port ${env.PORT}`));
let shuttingDown = false;

function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ event: 'shutdown', reason }));
  const timeout = setTimeout(() => {
    console.error(JSON.stringify({ event: 'shutdown_timeout' }));
    server.closeAllConnections();
    process.exit(1);
  }, 10000);
  server.close(async () => {
    try { await pool.end(); }
    catch { exitCode = 1; console.error(JSON.stringify({ event: 'pool_shutdown_failed' })); }
    clearTimeout(timeout);
    process.exit(exitCode);
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', () => shutdown('unhandledRejection', 1));
process.on('uncaughtException', () => shutdown('uncaughtException', 1));
server.on('error', () => shutdown('http_server_error', 1));
