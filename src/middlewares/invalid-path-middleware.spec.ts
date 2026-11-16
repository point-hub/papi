
import { describe, expect, it, mock } from 'bun:test';
import type { NextFunction, Request, Response } from 'express';

import ApiError from '../utils/errors/api-error';
import errorNotFound from './invalid-path-middleware';

describe('errorNotFound', () => {
  it('should forward a 404 ApiError to the next middleware', () => {
    const nextMock = mock((_error?: unknown) => {});

    errorNotFound(
      {} as Request,
      {} as Response,
      nextMock as unknown as NextFunction,
    );

    expect(nextMock).toHaveBeenCalledTimes(1);

    const error = nextMock.mock.calls[0]?.[0];

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 404,
      status: 'Not Found',
      message: 'Not Found',
      name: 'ApiError',
    });
  });
});
