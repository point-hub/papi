
import { STATUS_CODES } from 'node:http';

import type { MongoServerError } from 'mongodb';

import BaseError, { type IError } from '../../utils/errors/base-error';

const VALIDATION_CODE = 422;

/**
 * Creates the default HTTP validation error.
 *
 * @returns Standardized HTTP 422 error data.
 */
function createValidationError(): IError {
  const status = STATUS_CODES[VALIDATION_CODE];

  if (!status) {
    throw new Error(`Invalid HTTP status code: "${VALIDATION_CODE}"`);
  }

  return {
    name: 'ClientError',
    code: VALIDATION_CODE,
    status,
    message: status,
  };
}

/**
 * Converts a MongoDB schema validation error into an HTTP validation error.
 *
 * Extracts missing required properties from MongoDB schema validation details
 * and generates a validation message for each missing property.
 *
 * @param err - MongoDB server error with code 121.
 * @returns HTTP validation error containing missing property errors.
 */
export function handleSchemaValidation(err: MongoServerError): IError {
  const error = createValidationError();

  const missingProperties: string[] = err.errInfo?.details?.schemaRulesNotSatisfied?.[0]?.missingProperties ?? [];

  error.errors = Object.fromEntries(
    missingProperties.map(property => [
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
 * @returns HTTP validation error containing duplicate key errors.
 */
export function handleUniqueValidation(err: MongoServerError): IError {
  const error = createValidationError();
  const keys = Object.keys(err.keyPattern ?? {});

  if (keys.length === 1) {
    const key = keys[0]!;

    error.errors = {
      [key]: [`The ${key} already exists.`],
    };

    return error;
  }

  if (keys.length > 1) {
    const combination = `'${keys.join(', ')}'`;

    error.errors = Object.fromEntries(
      keys.map(key => [
        key,
        [`The combination of ${combination} already exists.`],
      ]),
    );
  }

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
    let error: IError;

    switch (err.code) {
    case 121:
      error = handleSchemaValidation(err);
      break;

    case 11000:
      error = handleUniqueValidation(err);
      break;

    default: {
      console.error('[MongoErrorHandler]', err);

      const status = STATUS_CODES[500]!;

      error = {
        name: 'ServerError',
        code: 500,
        status,
        message: status,
      };
    }
    }

    super(error);

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Indicates whether the error is operational and expected to be handled.
   */
  override get isOperational(): boolean {
    return true;
  }

  /**
   * Returns the error class name.
   */
  override get name(): string {
    return 'MongoErrorHandler';
  }
}
