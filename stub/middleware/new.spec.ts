import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import middleware from "./new.middleware.js";

it("test middleware", () => {
  const req = {} as Request;
  const res = {} as Response;
  const next: NextFunction = jest.fn();
  middleware(req, res, next);

  expect(next).toBeCalled();
});
