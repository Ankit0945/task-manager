'use strict';

/**
 * src/services/taskService.js
 *
 * Business-logic / data-access layer.
 * All SQL lives here — routes never build SQL strings themselves.
 * Uses parameterized queries exclusively to prevent SQL injection.
 */

const db = require('../db');

/** Return all tasks, newest first. */
async function getAllTasks() {
  const { rows } = await db.query(
    'SELECT * FROM tasks ORDER BY created_at DESC'
  );
  return rows;
}

/** Return one task by integer id, or null if not found. */
async function getTaskById(id) {
  const { rows } = await db.query(
    'SELECT * FROM tasks WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new task.
 * @param {{ title: string, description?: string }} data
 */
async function createTask({ title, description }) {
  const safeTitle = typeof title === 'string' ? title.trim() : '';
  const { rows } = await db.query(
    `INSERT INTO tasks (title, description)
     VALUES ($1, $2)
     RETURNING *`,
    [safeTitle, description ? description.trim() : null]
  );
  return rows[0];
}

/**
 * Update allowed fields (title, description, completed).
 * Only columns explicitly provided are changed.
 * @param {number} id
 * @param {{ title?: string, description?: string, completed?: boolean }} updates
 * @returns updated task or null if not found
 */
async function updateTask(id, updates) {
  // Build SET clause dynamically but safely using parameterized placeholders
  const fields = [];
  const values = [];
  let idx = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(updates.title.trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description === '' ? null : updates.description.trim());
  }
  if (updates.completed !== undefined) {
    fields.push(`completed = $${idx++}`);
    values.push(Boolean(updates.completed));
  }

  if (fields.length === 0) return getTaskById(id); // nothing to change

  values.push(id); // $idx — the WHERE clause value
  const { rows } = await db.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
}

/** Hard-delete a task. Returns the deleted row or null. */
async function deleteTask(id) {
  const { rows } = await db.query(
    'DELETE FROM tasks WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] || null;
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };

