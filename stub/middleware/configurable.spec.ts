import { expect, it, jest } from 'bun:test'
import { NextFunction, Request, Response } from 'express'

import middleware from './configurable.middleware'

it('test middleware', () => {
  const req = {} as Request
  const res = {} as Response
  const next: NextFunction = jest.fn()
  middleware()(req, res, next)

  expect(next).toHaveBeenCalled()
})
