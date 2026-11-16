
/**
 * Defines the standard structure of an application error.
 */
export interface IError extends Error {
  /** HTTP status code associated with the error. */
  code: number;

  /** HTTP status text associated with the error. */
  status: string;

  /** Human-readable error message. */
  message: string;

  /** Optional additional error details. */
  errors?: object;
}

/**
 * Base class for application-specific errors.
 *
 * Provides a consistent error structure and distinguishes
 * operational errors from unexpected programming errors.
 */
export default abstract class BaseError extends Error implements IError {
  public code: number;
  public status: string;
  public message: string;
  public errors?: object | undefined;

  /**
   * Creates a standardized application error.
   *
   * @param error - Error details including code, status, message, and optional errors.
   */
  constructor(error: IError) {
    super(error.message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.code = error.code;
    this.status = error.status;
    this.message = error.message;
    this.errors = error.errors;

    Error.captureStackTrace(this);
  }

  /**
   * Indicates whether the error is an expected operational error.
   *
   * Operational errors represent anticipated application failures,
   * such as validation errors, authentication failures, or missing resources.
   */
  abstract get isOperational(): boolean;

  /**
   * Returns the error class name.
   */
  abstract get name(): string;
}

/**
 * Determines whether an error is a trusted application error.
 *
 * Only errors extending BaseError and explicitly marked as operational
 * are considered trusted.
 *
 * @param err - Error to evaluate.
 * @returns True if the error is an operational BaseError; otherwise false.
 */
export const isTrustedError = (err: Error): boolean => {
  if (err instanceof BaseError) {
    return err.isOperational;
  }

  return false;
};
