
import { describe, expect, it } from 'bun:test';

import BaseError, { isTrustedError } from './base-error';

class OperationalTestError extends BaseError {
  public get name(): string {
    return 'OperationalTestError';
  }

  public get isOperational(): boolean {
    return true;
  }
}

class NonOperationalTestError extends BaseError {
  public get name(): string {
    return 'NonOperationalTestError';
  }

  public get isOperational(): boolean {
    return false;
  }
}

describe('BaseError', () => {
  const errorData = {
    name: 'OperationalError',
    code: 400,
    status: 'Bad Request',
    message: 'Invalid request',
  };

  it('should create an error with the provided properties', () => {
    const error = new OperationalTestError(errorData);

    expect(error.code).toBe(400);
    expect(error.status).toBe('Bad Request');
    expect(error.message).toBe('Invalid request');
    expect(error.errors).toBeUndefined();
  });

  it('should extend the native Error class', () => {
    const error = new OperationalTestError(errorData);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
  });

  it('should preserve the subclass prototype', () => {
    const error = new OperationalTestError(errorData);

    expect(error).toBeInstanceOf(OperationalTestError);
    expect(error.name).toBe('OperationalTestError');
  });

  it('should include additional error details', () => {
    const errors = {
      email: ['Email is required'],
    };

    const error = new OperationalTestError({
      ...errorData,
      errors,
    });

    expect(error.errors).toEqual(errors);
  });

  it('should capture the error stack trace', () => {
    const error = new OperationalTestError(errorData);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Invalid request');
  });

  it('should expose the operational status', () => {
    const operationalError = new OperationalTestError(errorData);
    const nonOperationalError = new NonOperationalTestError(errorData);

    expect(operationalError.isOperational).toBe(true);
    expect(nonOperationalError.isOperational).toBe(false);
  });
});

describe('isTrustedError', () => {
  it('should return true for operational BaseError instances', () => {
    const error = new OperationalTestError({
      name: 'OperationalError',
      code: 400,
      status: 'Bad Request',
      message: 'Invalid request',
    });

    expect(isTrustedError(error)).toBe(true);
  });

  it('should return false for non-operational BaseError instances', () => {
    const error = new NonOperationalTestError({
      name: 'NonOperationalError',
      code: 500,
      status: 'Internal Server Error',
      message: 'Unexpected error',
    });

    expect(isTrustedError(error)).toBe(false);
  });

  it('should return false for native Error instances', () => {
    const error = new Error('Unexpected error');

    expect(isTrustedError(error)).toBe(false);
  });

  it('should return false for native TypeError instances', () => {
    const error = new TypeError('Invalid type');

    expect(isTrustedError(error)).toBe(false);
  });
});
