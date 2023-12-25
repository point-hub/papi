import { BaseCommand } from '@point-hub/express-cli'
import {
  ApiError,
  BaseError,
  errorHandlerMiddleware,
  find,
  invalidPathMiddleware,
  isTrustedError,
} from '@point-hub/express-error-handler'
import { MongoServerError } from 'mongodb'

import { ConsoleKernel } from './console'
import { DatabaseConnection } from './database/connection'
import { MongoDBConnection } from './database/mongodb/connection'
import { MongoErrorHandler } from './database/mongodb/mongodb-error-handler'
import { MongoDBHelper } from './database/mongodb/mongodb-helper'
import Querystring from './database/mongodb/mongodb-querystring'

export const stubDir = import.meta.path.replace('/index.ts', '/../stub').replace('/index.js', '/../stub')

// Console
export { ExpressCli as BaseConsoleCli } from '@point-hub/express-cli'
export const BaseConsoleCommand = BaseCommand
export const BaseConsoleKernel = ConsoleKernel
// Database
export const BaseDatabaseConnection = DatabaseConnection
export const BaseMongoDBConnection = MongoDBConnection
export const BaseMongoDBHelper = MongoDBHelper
export const BaseMongoDBQuerystring = Querystring
export const BaseMongoServerError = MongoServerError
export const BaseMongoErrorHandler = MongoErrorHandler
// Error Handler
export const BaseErrorHandler = {
  ApiError,
  BaseError,
  isTrustedError,
  getHttpError: find,
  errorHandlerMiddleware,
  invalidPathMiddleware,
}
// Server
export { Server as BaseServer } from './server'
// Types
export type {
  IAggregateOutput,
  IClientSession,
  IController,
  IControllerInput,
  IControllerOutput,
  ICreateManyOutput,
  ICreateOutput,
  IDatabase,
  IDeleteManyOutput,
  IDeleteOutput,
  IDocument,
  IHttpRequest,
  IPipeline,
  IQuery,
  IRetrieveAllOutput,
  IRetrieveOutput,
  IUpdateManyOutput,
  IUpdateOutput,
  IUseCase,
} from './interfaces/types'
