
import { describe, expect, it } from 'bun:test';

import ApiError from './api-error';
import BaseError from './base-error';

describe('ApiError', () => {
  it('should create an error with the provided HTTP status code', () => {
    const error = new ApiError(400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(400);
    expect(error.status).toBe('Bad Request');
    expect(error.message).toBe('Bad Request');
    expect(error.name).toBe('ApiError');
  });

  it('should use the custom error message', () => {
    const error = new ApiError(400, {
      message: 'Invalid request data',
    });

    expect(error.message).toBe('Invalid request data');
  });

  it('should use the HTTP status text when the message is omitted', () => {
    const error = new ApiError(404);

    expect(error.message).toBe('Not Found');
  });

  it('should preserve an empty custom message', () => {
    const error = new ApiError(400, {
      message: '',
    });

    expect(error.message).toBe('');
  });

  it('should include additional error details for client errors', () => {
    const errors = {
      email: ['Email is required'],
      password: ['Password is too short'],
    };

    const error = new ApiError(422, { errors });

    expect(error.errors).toEqual(errors);
  });

  it('should not include additional error details for server errors', () => {
    const error = new ApiError(500, {
      errors: {
        internal: ['Internal error'],
      },
    });

    expect(error.errors).toBeUndefined();
  });

  it('should return the ApiError name', () => {
    const error = new ApiError(500);

    expect(error.name).toBe('ApiError');
  });

  it('should always be operational', () => {
    const clientError = new ApiError(400);
    const serverError = new ApiError(500);

    expect(clientError.isOperational).toBe(true);
    expect(serverError.isOperational).toBe(true);
  });

  it('should throw an error for an invalid HTTP status code', () => {
    expect(() => new ApiError(999)).toThrow(
      'Invalid HTTP status code: "999"',
    );
  });

  it('should throw an error for an unsupported HTTP status code', () => {
    expect(() => new ApiError(0)).toThrow(
      'Invalid HTTP status code: "0"',
    );
  });
});
