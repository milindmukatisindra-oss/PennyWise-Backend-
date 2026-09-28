import { errorResponse } from '../utils/response.js';

/**
 * Centralized application error handling middleware.
 * Prevents stack traces or database connection details from leaking to clients.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Application Error]:', err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected internal server error occurred. Please try again.';

  return errorResponse(res, message, statusCode);
};
