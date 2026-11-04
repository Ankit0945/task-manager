'use strict';

/**
 * src/middleware/errorHandler.js
 *
 * Central error-handling middleware.  Express identifies it as an error
 * handler because it has FOUR parameters.  Mount it last in server.js.
 *
 * Rules:
 *  - Never expose stack traces or internal DB errors to clients.
 *  - Use err.status / err.statusCode when the route sets them deliberately.
 *  - Return a consistent JSON shape: { error: { message, code? } }
 */

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;

  // Log full error server-side so we can diagnose it
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.url} →`, err);
  } else {
    console.warn(`[WARN]  ${req.method} ${req.url} → ${status}: ${err.message}`);
  }

  // Sanitise what we send to the client
  const clientMessage =
    status < 500
      ? err.message || 'Bad request'
      : 'An unexpected error occurred. Please try again later.';

  res.status(status).json({
    error: {
      message: clientMessage,
      ...(err.code ? { code: err.code } : {}),
    },
  });
}

module.exports = errorHandler;

