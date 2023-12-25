/* eslint-disable @typescript-eslint/no-explicit-any */
// controller
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
// use case
export interface IUseCase<TInput, TDeps, TOptions, TOutput> {
  handle(input: TInput, deps: TDeps, options?: TOptions): Promise<TOutput>
}
// database
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  startSession(): IClientSession
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
