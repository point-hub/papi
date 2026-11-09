import { find } from '@point-hub/express-error-handler';
import { describe, expect, it, spyOn } from 'bun:test';
import { MongoServerError } from 'mongodb';

import {
  handleSchemaValidation,
  handleUniqueValidation,
  MongoErrorHandler,
} from './mongo-error-handler';

function createMongoServerError(
  code: number,
  extra: Record<string, unknown> = {},
): MongoServerError {
  const error = new MongoServerError({
    message: 'MongoDB error',
  });

  Object.assign(error, { code }, extra);

  return error;
}

function createError() {
  return find(422)!;
}

describe('handleSchemaValidation', () => {
  it('returns required validation errors for multiple missing properties', () => {
    const err = createMongoServerError(121, {
      errInfo: {
        details: {
          schemaRulesNotSatisfied: [
            {
              missingProperties: ['name', 'email'],
            },
          ],
        },
      },
    });

    const result = handleSchemaValidation(err, createError());

    expect(result.errors).toStrictEqual({
      name: ['name is required'],
      email: ['email is required'],
    });
  });

  it('returns required validation error for a single missing property', () => {
    const err = createMongoServerError(121, {
      errInfo: {
        details: {
          schemaRulesNotSatisfied: [
            {
              missingProperties: ['name'],
            },
          ],
        },
      },
    });

    const result = handleSchemaValidation(err, createError());

    expect(result.errors).toStrictEqual({
      name: ['name is required'],
    });
  });

  it('returns empty validation errors when no properties are missing', () => {
    const err = createMongoServerError(121, {
      errInfo: {
        details: {
          schemaRulesNotSatisfied: [
            {
              missingProperties: [],
            },
          ],
        },
      },
    });

    const result = handleSchemaValidation(err, createError());

    expect(result.errors).toStrictEqual({});
  });
});

describe('handleUniqueValidation', () => {
  it('returns unique validation error for a single field', () => {
    const err = createMongoServerError(11000, {
      keyPattern: {
        email: 1,
      },
    });

    const result = handleUniqueValidation(err, createError());

    expect(result.errors).toStrictEqual({
      email: ['The email is exists.'],
    });
  });

  it('returns unique validation errors for multiple fields', () => {
    const err = createMongoServerError(11000, {
      keyPattern: {
        first_name: 1,
        last_name: 1,
      },
    });

    const result = handleUniqueValidation(err, createError());

    expect(result.errors).toStrictEqual({
      first_name: [
        'The combination of \'first_name, last_name\' is exists.',
      ],
      last_name: [
        'The combination of \'first_name, last_name\' is exists.',
      ],
    });
  });
});

describe('MongoErrorHandler', () => {
  it('handles schema validation errors', () => {
    const err = createMongoServerError(121, {
      errInfo: {
        details: {
          schemaRulesNotSatisfied: [
            {
              missingProperties: ['name'],
            },
          ],
        },
      },
    });

    const error = new MongoErrorHandler(err);

    expect(error.name).toBe('MongoErrorHandler');
    expect(error.isOperational).toBe(true);
    expect(error.errors).toStrictEqual({
      name: ['name is required'],
    });
  });

  it('handles unique validation errors', () => {
    const err = createMongoServerError(11000, {
      keyPattern: {
        email: 1,
      },
    });

    const error = new MongoErrorHandler(err);

    expect(error.errors).toStrictEqual({
      email: ['The email is exists.'],
    });
  });

  it('logs unknown MongoDB errors', () => {
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    const err = createMongoServerError(999);

    const error = new MongoErrorHandler(err);

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(err));
    expect(error.name).toBe('MongoErrorHandler');
    expect(error.isOperational).toBe(true);
  });
});
