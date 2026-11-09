/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AggregateOptions, BulkWriteOptions, Db, DeleteOptions, FindOneOptions, FindOptions, InsertOneOptions, MongoClient, ObjectId, UpdateOptions } from 'mongodb';
/**
 * Controller
 */
export interface IControllerInput {
  req: Request
  res: Response
  next: NextFunction
  mongoClient: MongoClient
  database: Db
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
  mongoClient: MongoClient
  database: Db
}

export type IAppMiddleware = (input: IMiddlewareInput) => Promise<void> | void;

export type IMiddleware = RequestHandler | IAppMiddleware;

/**
 * Repository
 */
export interface IAggregateRepository<TData> {
  handle(filter: IDocument, options?: AggregateOptions): Promise<IAggregateOutput<TData>>
}

export interface ICreateManyRepository {
  handle(documents: IDocument[], options?: BulkWriteOptions): Promise<ICreateManyOutput>
}

export interface ICreateRepository {
  handle(document: IDocument, options?: InsertOneOptions): Promise<ICreateOutput>
}

export interface IDeleteManyRepository {
  handle(_ids: (string | ObjectId)[], options?: DeleteOptions): Promise<IDeleteManyOutput>
}

export interface IDeleteRepository {
  handle(_id: string | ObjectId, options?: DeleteOptions): Promise<IDeleteOutput>
}

export interface IRetrieveManyRepository<TData> {
  handle(query: IQuery, options?: FindOptions): Promise<TData>
}

export interface IRetrieveRepository<TOutput extends object> {
  handle(_id: string | ObjectId, options?: FindOneOptions): Promise<TOutput>
}

export interface IUpdateManyRepository {
  handle(filter: IDocument, document: IDocument, options?: UpdateOptions): Promise<IUpdateManyOutput>
}

export interface IUpdateRepository {
  handle(_id: string | ObjectId, document: IDocument, options?: UpdateOptions): Promise<IUpdateOutput>
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

/**
 * Express App
 */
export interface IAppInput {
  mongoClient: MongoClient
}

export interface IMakeControllerInput {
  controller: IController
  mongoClient: MongoClient
}

export interface IMakeMiddlewareInput {
  middleware: IMiddleware
  mongoClient: MongoClient
}

/**
 * Router
 */
export interface IBaseRouterInput {
  mongoClient: MongoClient
  database: Db
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
