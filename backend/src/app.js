'use strict';

/**
 * src/app.js
 *
 * Creates and configures the Express application.
 * Kept separate from server.js so tests can import the app without
 * binding to a port.
 */

const express    = require('express');
const cors       = require('cors');

const taskRoutes   = require('./routes/tasks');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// CORS_ORIGIN env var may be a single origin or comma-separated list.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/tasks',  taskRoutes);

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// ── Centralised error handler (must be LAST middleware) ───────────────────────
app.use(errorHandler);

module.exports = app;
