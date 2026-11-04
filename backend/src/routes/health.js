'use strict';

/**
 * src/routes/health.js
 *
 * Lightweight health-check used by hosting providers and monitoring tools.
 * Returns 200 when the app and database are healthy, 503 otherwise.
 */

const express = require('express');
const db      = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await db.ping();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[health] DB ping failed:', err.message);
    res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

module.exports = router;

