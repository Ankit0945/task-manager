'use strict';

/**
 * backend/__tests__/tasks.test.js
 *
 * Integration tests for the tasks REST API using Supertest.
 * The database module is mocked so no live PostgreSQL connection is needed
 * during CI or local test runs without a database.
 */

// ── Mock the DB module before importing app ────────────────────────────────────
jest.mock('../src/db', () => ({
  query: jest.fn(),
  ping:  jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app     = require('../src/app');
const db      = require('../src/db');

// ── Sample data ───────────────────────────────────────────────────────────────
const sampleTask = {
  id:          1,
  title:       'Write tests',
  description: 'Make sure everything works',
  completed:   false,
  created_at:  new Date().toISOString(),
  updated_at:  new Date().toISOString(),
};

// ── Reset mocks before each test ──────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ── Health check ──────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns 200 when db ping succeeds', async () => {
    db.ping.mockResolvedValue(true);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });

  it('returns 503 when db ping fails', async () => {
    db.ping.mockRejectedValue(new Error('DB down'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
  });
});

// ── GET /api/tasks ────────────────────────────────────────────────────────────
describe('GET /api/tasks', () => {
  it('returns an array of tasks', async () => {
    db.query.mockResolvedValue({ rows: [sampleTask] });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe(1);
  });

  it('returns empty array when no tasks exist', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────
describe('GET /api/tasks/:id', () => {
  it('returns a single task', async () => {
    db.query.mockResolvedValue({ rows: [sampleTask] });
    const res = await request(app).get('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Write tests');
  });

  it('returns 404 for a missing task', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/tasks/999');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-integer id', async () => {
    const res = await request(app).get('/api/tasks/abc');
    expect(res.status).toBe(400);
  });
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────
describe('POST /api/tasks', () => {
  it('creates a task and returns 201', async () => {
    db.query.mockResolvedValue({ rows: [sampleTask] });
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write tests', description: 'Make sure everything works' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Write tests');
  });

  it('returns 422 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'No title' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when title is empty string', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when title exceeds 255 characters', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'a'.repeat(256) });
    expect(res.status).toBe(422);
  });
});

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────
describe('PATCH /api/tasks/:id', () => {
  it('marks a task as completed', async () => {
    const updated = { ...sampleTask, completed: true };
    db.query.mockResolvedValue({ rows: [updated] });
    const res = await request(app)
      .patch('/api/tasks/1')
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(true);
  });

  it('returns 404 when task does not exist', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).patch('/api/tasks/999').send({ completed: true });
    expect(res.status).toBe(404);
  });

  it('returns 422 when completed is not a boolean', async () => {
    const res = await request(app).patch('/api/tasks/1').send({ completed: 'yes' });
    expect(res.status).toBe(422);
  });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns the deleted row', async () => {
    db.query.mockResolvedValue({ rows: [sampleTask] });
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task deleted successfully');
  });

  it('returns 404 when task does not exist', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });
});

// ── Unknown route ─────────────────────────────────────────────────────────────
describe('Unknown routes', () => {
  it('returns 404 for unmatched paths', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});

