import { NextFunction, Request, Response } from 'express'

export default function newMiddleware<T>(options?: T) {
  return function (req: Request, res: Response, next: NextFunction) {
    next()
  }
}
