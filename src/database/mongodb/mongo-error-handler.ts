import {
  BaseError,
  find,
  type IError,
  type IHttpStatus,
} from '@point-hub/express-error-handler';
import { MongoServerError } from 'mongodb';

/**
 * Converts a MongoDB schema validation error into an HTTP validation error.
 *
 * Extracts missing required properties from MongoDB schema validation details
 * and generates a validation message for each missing property.
 *
 * @param err - MongoDB server error with code 121.
 * @param error - HTTP validation error to populate.
 * @returns The HTTP validation error containing missing property errors.
 */
export function handleSchemaValidation(err: MongoServerError, error: IError): IError {
  const missingProperties =
    err.errInfo?.details.schemaRulesNotSatisfied[0].missingProperties ?? [];

  error.errors = Object.fromEntries(
    missingProperties.map((property: string) => [
      property,
      [`${property} is required`],
    ]),
  );

  return error;
}

/**
 * Converts a MongoDB duplicate key error into an HTTP validation error.
 *
 * Generates a validation message for a single duplicated field or a
 * combination of fields when a compound unique index is violated.
 *
 * @param err - MongoDB server error with code 11000.
 * @param error - HTTP validation error to populate.
 * @returns The HTTP validation error containing duplicate key errors.
 */
export function handleUniqueValidation(err: MongoServerError, error: IError): IError {
  const keys = Object.keys(err.keyPattern);

  if (keys.length === 1) {
    const key = keys[0];

    error.errors = {
      [key]: [`The ${key} is exists.`],
    };

    return error;
  }

  const combination = `'${keys.join(', ')}'`;

  error.errors = Object.fromEntries(
    keys.map(key => [
      key,
      [`The combination of ${combination} is exists.`],
    ]),
  );

  return error;
}

/**
 * Handles MongoDB server errors and converts supported errors into
 * HTTP 422 validation errors.
 *
 * Supported MongoDB error codes:
 * - 121: Document schema validation failure.
 * - 11000: Duplicate key constraint violation.
 *
 * @extends BaseError
 */
export class MongoErrorHandler extends BaseError {
  /**
   * Creates a MongoDB error handler.
   *
   * @param err - MongoDB server error to handle.
   */
  constructor(err: MongoServerError) {
    const error: IError = find(422) as IHttpStatus;

    if (err.code === 121) {
      super(handleSchemaValidation(err, error));
    } else if (err.code === 11000) {
      super(handleUniqueValidation(err, error));
    } else {
      console.error(JSON.stringify(err));
      super(error);
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Indicates whether the error is operational and expected to be handled.
   */
  get isOperational() {
    return true;
  }

  /**
   * Returns the error class name.
   */
  override get name() {
    return 'MongoErrorHandler';
  }
}
