/**
 * src/api/tasks.js
 *
 * Thin client over the Task Manager REST API.
 * All network calls live here — components never call fetch() directly.
 *
 * Base URL is read from the Vite env variable VITE_API_BASE_URL.
 * During local development the Vite proxy handles /api/* so the browser
 * never makes cross-origin requests on localhost.
 */

const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'; // falls through to Vite's dev-server proxy

/**
 * Generic fetch wrapper.
 * Throws an Error with a user-readable message on non-2xx responses.
 */
async function request(path, options = {}) {
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Server returned ${res.status} with no JSON body`);
  }

  if (!res.ok) {
    const message =
      body?.error?.code
        ? `${body.error.message}: ${body.error.code}`
        : body?.error?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body;
}

// ── Task API calls ─────────────────────────────────────────────────────────────

/** Fetch all tasks (newest first). */
export function getTasks() {
  return request('/tasks');
}

/** Fetch a single task. */
export function getTask(id) {
  return request(`/tasks/${id}`);
}

/**
 * Create a new task.
 * @param {{ title: string, description?: string }} data
 */
export function createTask(data) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Partial update — pass only the fields you want to change.
 * @param {number} id
 * @param {{ title?: string, description?: string, completed?: boolean }} updates
 */
export function updateTask(id, updates) {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/** Delete a task permanently. */
export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}
