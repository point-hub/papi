
import type { NextFunction, Request, Response } from 'express';

import ApiError from '../utils/errors/api-error';

/**
 * Express middleware that handles requests to undefined routes.
 *
 * Forwards a 404 Not Found error to the centralized error handler.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function.
 */
export default function errorNotFound(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  next(new ApiError(404));
}
