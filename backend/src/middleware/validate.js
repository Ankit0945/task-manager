'use strict';

/**
 * src/middleware/validate.js
 *
 * Thin wrapper around express-validator's validationResult.
 * Drop this after any chain of check() calls to return 422 on failure.
 */

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.status = 422;
    // Attach the validation details as a code so the client can render them
    err.code = errors
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join('; ');
    return next(err);
  }
  next();
}

module.exports = validate;
