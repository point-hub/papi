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
import mongodbErrorHandlerMiddleware from './middleware/mongodb-error-handler.middleware'

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
// Factory
export { default as BaseFactory } from '@point-hub/express-factory'
// Error Handler
export const BaseErrorHandler = {
  ApiError,
  BaseError,
  isTrustedError,
  getHttpError: find,
  mongodbErrorHandlerMiddleware: mongodbErrorHandlerMiddleware,
  errorHandlerMiddleware,
  invalidPathMiddleware,
}
// Server
export { Server as BaseServer } from './server'
// Types
export type {
  IAggregateOutput,
  IAggregateRepository,
  IAppInput,
  IBaseRouterInput,
  IClientSession,
  IController,
  IControllerInput,
  IControllerOutput,
  ICreateManyOutput,
  ICreateManyRepository,
  ICreateOutput,
  ICreateRepository,
  IDatabase,
  IDeleteManyOutput,
  IDeleteManyRepository,
  IDeleteOutput,
  IDeleteRepository,
  IDocument,
  IHttpRequest,
  IMakeControllerInput,
  IMongoDBConfig,
  IPipeline,
  IQuery,
  IRetrieveAllOutput,
  IRetrieveAllRepository,
  IRetrieveOutput,
  IRetrieveRepository,
  ISchemaValidation,
  IServerConfig,
  IUpdateManyOutput,
  IUpdateManyRepository,
  IUpdateOutput,
  IUpdateRepository,
  IUseCase,
} from './interfaces/types'
