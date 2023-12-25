import { NextFunction, Request, Response } from 'express'

import { BaseMongoErrorHandler, BaseMongoServerError } from '../index'

export default function mongodbErrorHandlerMiddleware() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof BaseMongoServerError) {
      throw new BaseMongoErrorHandler(err)
    }
    next(err)
  }
}
