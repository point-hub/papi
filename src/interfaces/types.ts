/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Controller
 */
export interface IHttpRequest {
  [key: string]: any
}

export interface IControllerInput {
  httpRequest: IHttpRequest
  dbConnection: IDatabase
}

export interface IController {
  (input: IControllerInput): Promise<IControllerOutput>
}

export interface IControllerOutput {
  status: number
  json?: any
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
  collection: string
  handle(pipeline: IPipeline, query: IQuery, options?: unknown): Promise<IAggregateOutput>
}

export interface ICreateManyRepository {
  collection: string
  handle(documents: IDocument[], options?: unknown): Promise<ICreateManyOutput>
}

export interface ICreateRepository {
  collection: string
  handle(document: IDocument, options?: unknown): Promise<ICreateOutput>
}

export interface IDeleteManyRepository {
  collection: string
  handle(_ids: string[], options?: unknown): Promise<IDeleteManyOutput>
}

export interface IDeleteRepository {
  collection: string
  handle(_id: string, options?: unknown): Promise<IDeleteOutput>
}

export interface IRetrieveAllRepository {
  collection: string
  handle(query: IQuery, options?: unknown): Promise<IRetrieveAllOutput>
}

export interface IRetrieveRepository {
  collection: string
  handle(_id: string, options?: unknown): Promise<IRetrieveOutput>
}

export interface IUpdateManyRepository {
  collection: string
  handle(filter: IDocument, document: IDocument, options?: unknown): Promise<IUpdateManyOutput>
}

export interface IUpdateRepository {
  collection: string
  handle(_id: string, document: IDocument, options?: unknown): Promise<IUpdateOutput>
}

/**
 * Database
 */
export interface IDocument {
  [key: string]: any
}

export interface IQuery {
  fields?: string
  excludeFields?: string[]
  filter?: { [key: string]: unknown }
  page?: number
  pageSize?: number
  sort?: string
}

export interface IPipeline {
  [key: string]: any
}

export interface ICreateOutput {
  insertedId: string
}

export interface ICreateManyOutput {
  insertedCount: number
  insertedIds: string[]
}

export interface IRetrieveOutput {
  _id: string
  [key: string]: unknown
}

export interface IRetrieveAllOutput {
  data: IRetrieveOutput[]
  pagination: {
    page: number
    pageCount: number
    pageSize: number
    totalDocument: number
  }
}

export interface IUpdateOutput {
  matchedCount: number
  modifiedCount: number
}

export interface IUpdateManyOutput {
  matchedCount: number
  modifiedCount: number
}

export interface IDeleteOutput {
  deletedCount: number
}

export interface IDeleteManyOutput {
  deletedCount: number
}

export interface IAggregateOutput {
  data: IRetrieveOutput[]
  pagination: {
    page: number
    pageCount: number
    pageSize: number
    totalDocument: number
  }
}

export interface IClientSession {
  startTransaction(options?: unknown): void
  commitTransaction(): Promise<void>
  abortTransaction(): Promise<void>
  endSession(): Promise<void>
}

export interface IDatabase {
  session: unknown
  open(): Promise<void>
  close(): Promise<void>
  database(name: string, options?: unknown): this
  collection(name: string, options?: unknown): this
  listCollections(): Promise<{ name: string }[]>
  startSession(): unknown
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
  aggregate(pipeline: IPipeline, query: IQuery, options?: unknown): Promise<IAggregateOutput>
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
