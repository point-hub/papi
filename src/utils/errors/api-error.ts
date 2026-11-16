
import { STATUS_CODES } from 'node:http';

import BaseError, { type IError } from './base-error';

/**
 * Optional configuration for an API error.
 */
export interface IOptions {
  /** Custom human-readable error message. */
  message?: string;

  /** Additional error details, typically used for client errors. */
  errors?: object;
}

/**
 * Represents an HTTP API error.
 *
 * Automatically resolves the HTTP status text from the provided status code.
 * Client errors (4xx) may include additional validation or error details.
 */
export default class ApiError extends BaseError {
  /**
   * Creates an API error using an HTTP status code.
   *
   * @param code - Valid HTTP status code.
   * @param options - Optional error message and additional error details.
   * @throws Error if the provided HTTP status code is invalid.
   */
  constructor(code: number, options?: IOptions) {
    const status = STATUS_CODES[code];

    if (!status) {
      throw new Error(`Invalid HTTP status code: "${code}"`);
    }

    const error: IError = {
      name: code >= 500 ? 'ServerError' : 'ClientError',
      code,
      status,
      message: options?.message ?? status,
      ...(code >= 400 && code < 500 && options?.errors && { errors: options.errors }),
    };

    super(error);
  }

  /**
   * API errors are considered operational errors.
   */
  override get isOperational(): boolean {
    return true;
  }

  /**
   * Returns the API error class name.
   */
  override get name(): string {
    return 'ApiError';
  }
}
