'use strict';

/**
 * src/controllers/taskController.js
 *
 * HTTP layer: parse requests, call the service, format responses.
 * No SQL here — that belongs in the service layer.
 */

const taskService = require('../services/taskService');

// ── Helpers ────────────────────────────────────────────────────────────────────

function notFound(res, id) {
  return res.status(404).json({ error: { message: `Task ${id} not found` } });
}

function parseId(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: { message: 'Task id must be a positive integer' } });
    return null;
  }
  return id;
}

// ── Controllers ────────────────────────────────────────────────────────────────

async function listTasks(req, res, next) {
  try {
    const tasks = await taskService.getAllTasks();
    res.json({ data: tasks });
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const id = parseId(req, res);
    if (!id) return;

    const task = await taskService.getTaskById(id);
    if (!task) return notFound(res, id);

    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description } = req.body;
    const task = await taskService.createTask({ title, description });
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const id = parseId(req, res);
    if (!id) return;

    const { title, description, completed } = req.body;
    const task = await taskService.updateTask(id, { title, description, completed });
    if (!task) return notFound(res, id);

    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const id = parseId(req, res);
    if (!id) return;

    const task = await taskService.deleteTask(id);
    if (!task) return notFound(res, id);

    res.json({ data: task, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
