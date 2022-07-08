import { Request, Response, NextFunction } from "express";

export default function newMiddleware<T>(options?: T) {
  return function (req: Request, res: Response, next: NextFunction) {
    console.log(options);
    next();
  };
}
