import type { Request, Response } from 'express'

import { BaseMongoErrorHandler, BaseMongoServerError } from '../index'

export default function mongodbErrorHandlerMiddleware() {
  return (err: Error, req: Request, res: Response) => {
    if (err instanceof BaseMongoServerError) {
      throw new BaseMongoErrorHandler(err)
    }
    return err
  }
}
