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
  (input: IControllerInput): Promise<IControllerOutput | void>
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
 * Repository
 */
export interface IAggregateRepository<TData> {
  handle(filter: IDocument, options?: unknown): Promise<IAggregateOutput<TData>>
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

/**
 * @deprecated
 */
export interface IRetrieveAllRepository<TData> {
  handle(query: IQuery, options?: unknown): Promise<TData>
}

export interface IRetrieveManyRepository<TData> {
  handle(query: IQuery, options?: unknown): Promise<TData>
}

export interface IRetrieveRepository<TOutput extends object> {
  handle(_id: string, options?: unknown): Promise<TOutput>
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
  [key: string]: any
}

export interface IPipeline {
  [key: string]: any
}

export interface ICreateOutput {
  inserted_id: string
}

export interface ICreateManyOutput {
  inserted_count: number
  inserted_ids: string[]
}

export interface IPagination {
  page: number
  page_count: number
  page_size: number
  total_document: number
}

/**
 * @deprecated
 */
export interface IRetrieveAllOutput<TData> {
  data: TData[]
  pagination: IPagination
}

export interface IRetrieveManyOutput<TData> {
  data: TData[]
  pagination: IPagination
}

export interface IUpdateOutput {
  matched_count: number
  modified_count: number
}

export interface IUpdateManyOutput {
  matched_count: number
  modified_count: number
}

export interface IDeleteOutput {
  deleted_count: number
}

export interface IDeleteManyOutput {
  deleted_count: number
}

export interface IAggregateOutput<TData> {
  data: TData[]
  pagination: IPagination
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
  dropDatabase(options?: unknown): Promise<void>
  updateSchema(name: string, schema: unknown): Promise<void>
  command(document: IDocument, options?: unknown): Promise<IDocument>
  create(document: IDocument, options?: unknown): Promise<ICreateOutput>
  createMany(documents: IDocument[], options?: unknown): Promise<ICreateManyOutput>
  retrieveAll<TData>(query: IQuery, options?: unknown): Promise<IRetrieveAllOutput<TData>>
  retrieveMany<TData>(query: IQuery, options?: unknown): Promise<IRetrieveManyOutput<TData>>
  retrieve<TOutput extends object>(_id: string, options?: unknown): Promise<TOutput | null>
  update(filter: string | IDocument, document: IDocument, options?: unknown): Promise<IUpdateOutput>
  updateOne(filter: IDocument, document: IDocument, options?: unknown): Promise<IUpdateOutput>
  updateMany(filter: IDocument, document: IDocument, options?: unknown): Promise<IUpdateManyOutput>
  delete(_id: string, options?: unknown): Promise<IDeleteOutput>
  deleteMany(input: string[] | Record<string, unknown>, options?: unknown): Promise<IDeleteManyOutput>
  deleteAll(options?: unknown): Promise<IDeleteManyOutput>
  aggregate<TData>(pipeline?: IPipeline[], query?: IQuery, options?: unknown): Promise<IAggregateOutput<TData>>
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
