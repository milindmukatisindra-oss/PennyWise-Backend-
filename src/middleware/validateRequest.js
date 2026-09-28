import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware that inspects express-validator results.
 * If validation errors exist, short-circuits request with 422 error.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return errorResponse(res, formattedErrors[0]?.message || 'Validation failed', 422, formattedErrors);
  }
  next();
};
