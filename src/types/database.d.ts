/* eslint-disable @typescript-eslint/no-explicit-any */
interface IDocument {
  [key: string]: any
}

interface IQuery {
  fields?: string
  excludeFields?: string[]
  filter?: { [key: string]: unknown }
  page?: number
  pageSize?: number
  sort?: string
}

interface IPipeline {
  [key: string]: any
}

interface ICreateOutput {
  insertedId: string
}

interface ICreateManyOutput {
  insertedCount: number
  insertedIds: string[]
}

interface IRetrieveOutput {
  _id: string
  [key: string]: unknown
}

interface IRetrieveAllOutput {
  data: IRetrieveOutput[]
  pagination: {
    page: number
    pageCount: number
    pageSize: number
    totalDocument: number
  }
}

interface IUpdateOutput {
  matchedCount: number
  modifiedCount: number
}

interface IUpdateManyOutput {
  matchedCount: number
  modifiedCount: number
}

interface IDeleteOutput {
  deletedCount: number
}

interface IDeleteManyOutput {
  deletedCount: number
}

interface IAggregateOutput {
  data: IRetrieveOutput[]
  pagination: {
    page: number
    pageCount: number
    pageSize: number
    totalDocument: number
  }
}

interface IClientSession {
  startTransaction(options?: unknown): void
  commitTransaction(): Promise<void>
  abortTransaction(): Promise<void>
  endSession(): Promise<void>
}

interface IDatabase {
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
