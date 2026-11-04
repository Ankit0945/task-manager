'use strict';

/**
 * src/db/index.js
 *
 * Creates a single pg.Pool instance shared across the whole app.
 * Configuration is read exclusively from environment variables —
 * never hard-coded here.
 */

const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        // Required when connecting to hosted PostgreSQL over TLS (e.g. Railway, Neon)
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME     || 'taskmanager',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: false,
      }
);

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Thin wrapper — callers never touch the pool directly.
 * @param {string} text   Parameterized SQL string
 * @param {any[]}  params Bound values (never string-concatenated into SQL)
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[DB] query="${text.slice(0, 80)}" rows=${result.rowCount} duration=${duration}ms`);
  }

  return result;
}

/** Used by the health-check endpoint to verify DB connectivity. */
async function ping() {
  const { rows } = await pool.query('SELECT 1 AS pong');
  return rows[0].pong === 1;
}

/** Gracefully drain the pool on shutdown. */
async function close() {
  await pool.end();
}

module.exports = { query, ping, close };

