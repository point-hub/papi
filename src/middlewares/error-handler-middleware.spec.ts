
import type { NextFunction, Request, Response } from 'express';

import BaseError, { isTrustedError } from '../utils/errors/base-error';

/**
 * Defines the standardized API error response structure.
 */
type ResponseType = {
  /** Error category based on the HTTP status code. */
  name: string;

  /** HTTP status code. */
  code: number;

  /** HTTP status text. */
  status: string;

  /** Human-readable error message. */
  message: string;

  /** Optional additional error details. */
  errors?: object;
};

/**
 * Express error-handling middleware.
 *
 * Returns standardized responses for trusted operational errors.
 * Unexpected errors are hidden behind a generic 500 response.
 *
 * If response headers have already been sent, delegates the error
 * to the next Express error handler.
 *
 * @param err - Error passed from the previous middleware.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function.
 */
export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof BaseError && isTrustedError(err)) {
    const response: ResponseType = {
      name: err.code >= 500 ? 'ServerError' : 'ClientError',
      code: err.code,
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    };

    res.status(err.code).json(response);
    return;
  }

  // Cannot handle error, return "INTERNAL SERVER ERROR".
  const response: ResponseType = {
    name: 'ServerError',
    code: 500,
    status: 'Internal Server Error',
    message: 'Sorry something went wrong.',
  };

  res.status(500).json(response);
}
