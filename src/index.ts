import {
  ApiError,
  BaseError,
  errorHandlerMiddleware,
  find,
  invalidPathMiddleware,
  isTrustedError,
  type TypeCodeStatus,
} from '@point-hub/express-error-handler';
import path from 'path';
export const stubDir = path.resolve(import.meta.dir, '../stub');
// Abstact Class
export type { IUseCaseError,IUseCaseOutputFailed, IUseCaseOutputSuccess } from './base-usecase';
export { BaseUseCase } from './base-usecase';
// Console
export { ConsoleKernel } from './console';
export { BaseCommand, ExpressCli } from '@point-hub/express-cli';
// Database
export { MongoService } from './database/mongodb/mongo.service';
export { MongoErrorHandler } from './database/mongodb/mongo-error-handler';
export { default as MongoQueryBuilder } from './database/mongodb/mongo-query-builder.utils';
export { MongoTestService } from './database/mongodb/mongo-test.service';
// Factory
export { default as BaseFactory } from '@point-hub/express-factory';
// Error Handler
export const BaseErrorHandler = {
  ApiError,
  BaseError,
  isTrustedError,
  getHttpError: find,
  errorHandlerMiddleware,
  invalidPathMiddleware,
};
// Server
export { Server as BaseServer } from './server';
// Types
export type { TypeCodeStatus };
export type {
  IAggregateOutput,
  IAggregateRepository,
  IAppInput,
  IBaseRouterInput,
  IController,
  IControllerInput,
  IControllerOutput,
  ICreateManyOutput,
  ICreateManyRepository,
  ICreateOutput,
  ICreateRepository,
  IDeleteManyOutput,
  IDeleteManyRepository,
  IDeleteOutput,
  IDeleteRepository,
  IDocument,
  IMakeControllerInput,
  IMakeMiddlewareInput,
  IMiddleware,
  IMiddlewareInput,
  IMongoDBConfig,
  IPagination,
  IPipeline,
  IQuery,
  IRetrieveManyOutput,
  IRetrieveManyRepository,
  IRetrieveRepository,
  ISchema,
  ISchemaValidation,
  IServerConfig,
  IUpdateManyOutput,
  IUpdateManyRepository,
  IUpdateOutput,
  IUpdateRepository,
} from './interfaces/types';
