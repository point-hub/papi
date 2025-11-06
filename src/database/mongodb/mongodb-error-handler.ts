/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseError, find, type IError, type IHttpStatus } from '@point-hub/express-error-handler'
import { MongoServerError } from 'mongodb'

export function handleSchemaValidation(err: MongoServerError, error: IError) {
  // handle schema validation error
  error.errors = {} as any
  const errorMessage = err.errInfo?.details.schemaRulesNotSatisfied[0].missingProperties
  errorMessage.forEach((element: string) => {
    const obj: any = {}
    obj[element] = [`${element} is required`]
    error.errors = obj
  })
}

export function handleUniqueValidation(err: MongoServerError, error: IError) {
  // handle unique validation
  if (Object.keys(err.keyPattern).length === 1) {
    error.errors = {
      [Object.keys(err.keyPattern)[0]]: [`The ${Object.keys(err.keyPattern)[0]} is exists.`]
    }
  } else {
    // get keys
    const keys = Object.keys(err.keyPattern).reduce((keys: string, key, index) => {
      if (index === 0) {
        keys += '\''
      }
      keys += `${key.toString()}`
      if (index === Object.keys(err.keyPattern).length - 1) {
        keys += '\''
      } else {
        keys += ', '
      }
      return keys
    }, '')

    // generate error object
    const obj = Object.keys(err.keyPattern).reduce((obj: any, key) => {
      obj[key] = [`The combination of ${keys.toString()} is exists.`]
      return obj
    }, {})
    error.errors = obj
  }
}

export class MongoErrorHandler extends BaseError {
  constructor(err: MongoServerError) {
    const error: IError = find(422) as IHttpStatus
    if (err.code === 121) {
      handleSchemaValidation(err, error)
    } else if (err.code === 11000) {
      handleUniqueValidation(err, error)
    } else {
      console.error(JSON.stringify(err))
    }
    super(error)
    Object.setPrototypeOf(this, new.target.prototype)
  }
  get isOperational() {
    return true
  }
  override get name() {
    return 'MongoErrorHandler'
  }
}
