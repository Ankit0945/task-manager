'use strict';

/**
 * src/server.js
 *
 * Entry point — loads env vars, starts the HTTP server, and handles
 * graceful shutdown signals so hosted platforms (Railway, Render, etc.)
 * can recycle the process cleanly.
 */

require('dotenv').config();

const app = require('./app');
const db  = require('./db');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`[server] Personal Task Manager API running on port ${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[server] ${signal} received — shutting down…`);
  server.close(async () => {
    await db.close();
    console.log('[server] HTTP server closed, DB pool drained');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

