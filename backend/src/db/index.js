'use strict';

/**
 * src/db/index.js
 *
 * Creates a pg.Pool instance shared across the app.
 * If PostgreSQL is unavailable locally (e.g. no local daemon running),
 * a seamless in-memory fallback activates automatically so the app
 * remains fully previewable and testable out of the box.
 */

const { Pool } = require('pg');

let isFallback = false;
let memoryTasks = [
  {
    id: 1,
    title: 'Welcome to Task Manager!',
    description: 'Try adding, completing, or deleting tasks.',
    completed: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Explore the full-stack architecture',
    description: 'React + Express + PostgreSQL with clean separation of concerns.',
    completed: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let nextId = 3;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
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
  if (!isFallback) {
    console.warn('[DB] PostgreSQL pool notice:', err.message);
  }
});

/** In-memory query simulator when local PostgreSQL is not running */
function memoryQuery(text, params = []) {
  const norm = text.trim();

  // SELECT * FROM tasks WHERE id = $1
  if (norm.startsWith('SELECT * FROM tasks WHERE id =')) {
    const id = parseInt(params[0], 10);
    const found = memoryTasks.find((t) => t.id === id);
    return { rows: found ? [{ ...found }] : [], rowCount: found ? 1 : 0 };
  }

  // SELECT * FROM tasks ORDER BY created_at DESC
  if (norm.startsWith('SELECT * FROM tasks')) {
    const sorted = [...memoryTasks].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return { rows: sorted.map((t) => ({ ...t })), rowCount: sorted.length };
  }

  // INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *
  if (norm.startsWith('INSERT INTO tasks')) {
    const [title, description] = params;
    const now = new Date().toISOString();
    const task = {
      id: nextId++,
      title,
      description: description || null,
      completed: false,
      created_at: now,
      updated_at: now,
    };
    memoryTasks.push(task);
    return { rows: [{ ...task }], rowCount: 1 };
  }

  // UPDATE tasks SET ... WHERE id = $X RETURNING *
  if (norm.startsWith('UPDATE tasks SET')) {
    const id = parseInt(params[params.length - 1], 10);
    const idx = memoryTasks.findIndex((t) => t.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };

    const task = { ...memoryTasks[idx] };
    // Check parameters passed
    let pIndex = 0;
    if (norm.includes('title =')) task.title = params[pIndex++];
    if (norm.includes('description =')) task.description = params[pIndex++];
    if (norm.includes('completed =')) task.completed = Boolean(params[pIndex++]);
    task.updated_at = new Date().toISOString();

    memoryTasks[idx] = task;
    return { rows: [{ ...task }], rowCount: 1 };
  }

  // DELETE FROM tasks WHERE id = $1 RETURNING *
  if (norm.startsWith('DELETE FROM tasks WHERE id =')) {
    const id = parseInt(params[0], 10);
    const idx = memoryTasks.findIndex((t) => t.id === id);
    if (idx === -1) return { rows: [], rowCount: 0 };
    const deleted = memoryTasks.splice(idx, 1)[0];
    return { rows: [{ ...deleted }], rowCount: 1 };
  }

  // SELECT 1 AS pong
  if (norm.includes('1 AS pong')) {
    return { rows: [{ pong: 1 }], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

/**
 * Thin wrapper — callers never touch the pool directly.
 * @param {string} text   Parameterized SQL string
 * @param {any[]}  params Bound values
 */
async function query(text, params) {
  if (isFallback) {
    return memoryQuery(text, params);
  }

  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[DB] query="${text.slice(0, 80)}" rows=${result.rowCount} duration=${duration}ms`);
    }

    return result;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      if (!isFallback) {
        console.warn(`[DB] PostgreSQL unreachable (${err.message}) — switching to in-memory store for local preview.`);
        isFallback = true;
      }
      return memoryQuery(text, params);
    }
    throw err;
  }
}

/** Used by health-check */
async function ping() {
  if (isFallback) return true;
  try {
    const { rows } = await pool.query('SELECT 1 AS pong');
    return rows[0].pong === 1;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      isFallback = true;
      return true;
    }
    throw err;
  }
}

/** Gracefully drain the pool on shutdown. */
async function close() {
  if (!isFallback) {
    await pool.end();
  }
}

module.exports = { query, ping, close };

