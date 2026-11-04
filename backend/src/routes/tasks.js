'use strict';

/**
 * src/routes/tasks.js
 *
 * Maps HTTP verbs + paths to controller functions.
 * Validation rules live here, keeping controllers clean.
 */

const express = require('express');
const { body, param } = require('express-validator');

const taskController = require('../controllers/taskController');
const validate       = require('../middleware/validate');

const router = express.Router();

// ── Shared validation rules ────────────────────────────────────────────────────

const titleRules = body('title')
  .trim()
  .notEmpty().withMessage('Title is required')
  .isLength({ max: 255 }).withMessage('Title must be 255 characters or fewer');

const descriptionRules = body('description')
  .optional({ nullable: true })
  .trim()
  .isLength({ max: 2000 }).withMessage('Description must be 2 000 characters or fewer');

const completedRules = body('completed')
  .optional()
  .isBoolean().withMessage('completed must be true or false');

// ── Routes ─────────────────────────────────────────────────────────────────────

// GET /api/tasks
router.get('/', taskController.listTasks);

// GET /api/tasks/:id
router.get('/:id', taskController.getTask);

// POST /api/tasks
router.post(
  '/',
  [titleRules, descriptionRules],
  validate,
  taskController.createTask
);

// PATCH /api/tasks/:id  — partial update (title, description, completed)
router.patch(
  '/:id',
  [
    titleRules.optional(),            // title is optional on PATCH
    descriptionRules,
    completedRules,
  ],
  validate,
  taskController.updateTask
);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
