/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express'
import { ClientSession } from 'mongodb'
/**
 * Controller
 */
export interface IControllerInput {
  req: Request
  res: Response
  next: NextFunction
  dbConnection: IDatabase
}

export interface IController {
  (input: IControllerInput): Promise<IControllerOutput>
}

export interface IControllerOutput {
  status: number
  cookies?: any
  json?: any
}
/**
 * Middleware
 */
export interface IMiddlewareInput {
  req: Request
  res: Response
  next: NextFunction
  dbConnection: IDatabase
}

export interface IMiddleware {
  (input: IMiddlewareInput): Promise<void>
}
/**
 * UseCase
 */
export interface IUseCase<TInput, TDeps, TOptions, TOutput> {
  handle(input: TInput, deps: TDeps, options?: TOptions): Promise<TOutput>
}
/**
 * Repository
 */
export interface IAggregateRepository {
  handle(filter: IDocument, options?: unknown): Promise<IAggregateOutput>
}

export interface ICreateManyRepository {
  handle(documents: IDocument[], options?: unknown): Promise<ICreateManyOutput>
}

export interface ICreateRepository {
  handle(document: IDocument, options?: unknown): Promise<ICreateOutput>
}

export interface IDeleteManyRepository {
  handle(_ids: string[], options?: unknown): Promise<IDeleteManyOutput>
}

export interface IDeleteRepository {
  handle(_id: string, options?: unknown): Promise<IDeleteOutput>
}

export interface IRetrieveAllRepository {
  handle(query: IQuery, options?: unknown): Promise<IRetrieveAllOutput>
}

export interface IRetrieveRepository {
  handle(_id: string, options?: unknown): Promise<IRetrieveOutput>
}

export interface IUpdateManyRepository {
  handle(filter: IDocument, document: IDocument, options?: unknown): Promise<IUpdateManyOutput>
}

export interface IUpdateRepository {
  handle(_id: string, document: IDocument, options?: unknown): Promise<IUpdateOutput>
}

/**
 * Database
 */
export interface ISchema {
  collection: string
  unique: string[][]
  uniqueIfExists: string[][]
  indexes: { spec: string[]; options: Record<string, any> }[]
  schema: Record<string, any>
}

export interface IDocument {
  [key: string]: any
}

export interface IQuery {
  fields?: string
  exclude_fields?: string[]
  filter?: { [key: string]: any }
  page?: number
  page_size?: number
  sort?: string
}

export interface IPipeline {
  [key: string]: any
}

export interface ICreateOutput {
  inserted_id: string
  [key: string]: unknown
}

export interface ICreateManyOutput {
  inserted_count: number
  inserted_ids: string[]
  [key: string]: unknown
}

export interface IRetrieveOutput {
  _id: string
  [key: string]: unknown
}

export interface IPagination {
  page: number
  page_count: number
  page_size: number
  total_document: number
}

export interface IRetrieveAllOutput {
  data: IRetrieveOutput[]
  pagination: IPagination
  [key: string]: unknown
}

export interface IUpdateOutput {
  matched_count: number
  modified_count: number
  [key: string]: unknown
}

export interface IUpdateManyOutput {
  matched_count: number
  modified_count: number
  [key: string]: unknown
}

export interface IDeleteOutput {
  deleted_count: number
  [key: string]: unknown
}

export interface IDeleteManyOutput {
  deleted_count: number
  [key: string]: unknown
}

export interface IAggregateOutput {
  data: { [key: string]: unknown }[]
  pagination: IPagination
  [key: string]: unknown
}

// Todo: declare own client session
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IClientSession extends ClientSession {}

export interface IDatabase {
  session: unknown
  open(): Promise<void>
  close(): Promise<void>
  database(name: string, options?: unknown): this
  collection(name: string, options?: unknown): this
  listCollections(): Promise<{ name: string }[]>
  startSession(): ClientSession
  endSession(): Promise<void>
  startTransaction(): void
  commitTransaction(): Promise<void>
  abortTransaction(): Promise<void>
  createIndex(name: string, spec: unknown, options?: unknown): Promise<void>
  createCollection(name: string, options?: unknown): Promise<void>
  dropCollection(name: string, options?: unknown): Promise<void>
  updateSchema(name: string, schema: unknown): Promise<void>
  create(document: IDocument, options?: unknown): Promise<ICreateOutput>
  createMany(documents: IDocument[], options?: unknown): Promise<ICreateManyOutput>
  retrieveAll(query: IQuery, options?: unknown): Promise<IRetrieveAllOutput>
  retrieve(_id: string, options?: unknown): Promise<IRetrieveOutput>
  update(_id: string, document: IDocument, options?: unknown): Promise<IUpdateOutput>
  updateMany(filter: IDocument, document: IDocument, options?: unknown): Promise<IUpdateManyOutput>
  delete(_id: string, options?: unknown): Promise<IDeleteOutput>
  deleteMany(_ids: string[], options?: unknown): Promise<IDeleteManyOutput>
  deleteAll(options?: unknown): Promise<IDeleteManyOutput>
  aggregate(pipeline?: IPipeline[], query?: IQuery, options?: unknown): Promise<IAggregateOutput>
}
/**
 * Express App
 */
export interface IAppInput {
  dbConnection: IDatabase
}
export interface IMakeControllerInput {
  controller: IController
  dbConnection: IDatabase
}
export interface IMakeMiddlewareInput {
  middleware: IMiddleware
  dbConnection: IDatabase
}
/**
 * Router
 */
export interface IBaseRouterInput {
  dbConnection: IDatabase
}
/**
 * Schema Validation
 */
export interface ISchemaValidation {
  (document: IDocument, schema: IDocument): Promise<void>
}
/**
 * Config
 */
export interface IServerConfig {
  port: number
  host: string
}
export interface IMongoDBConfig {
  url: string
  name: string
}
