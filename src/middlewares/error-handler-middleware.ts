import { NextFunction,Request, Response } from 'express';

import BaseError, { isTrustedError } from '../utils/errors/base-error';

type ResponseType = {
  name: string;
  code: number;
  status: string;
  message: string;
  errors?: object;
};


export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
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

  // Cannot handle error, return "INTERNAL SERVER ERROR"
  const response: ResponseType = {
    name: 'ServerError',
    code: 500,
    status: 'Internal Server Error',
    message: 'Sorry something went wrong.',
  };

  res.status(500).json(response);
}
