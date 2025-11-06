/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEmpty } from '@point-hub/express-utils'
import type {
  AggregateOptions,
  BulkWriteOptions,
  ClientSession,
  Collection,
  CollectionOptions,
  CreateIndexesOptions,
  Db,
  DbOptions,
  DeleteOptions,
  FindOptions,
  IndexSpecification,
  InsertOneOptions,
  MongoClientOptions,
  RunCommandOptions,
  UpdateOptions
} from 'mongodb'
import { MongoClient, ObjectId } from 'mongodb'

import {
  IAggregateOutput,
  ICreateManyOutput,
  ICreateOutput,
  IDatabase,
  IDeleteManyOutput,
  IDeleteOutput,
  IDocument,
  IPipeline,
  IQuery,
  IRetrieveAllOutput,
  IRetrieveOutput,
  IUpdateManyOutput,
  IUpdateOutput
} from '../../index'
import { MongoDBHelper } from './mongodb-helper'
import Querystring from './mongodb-querystring'

export class MongoDBConnection implements IDatabase {
  public client: MongoClient
  public _database: Db | undefined
  public _collection: Collection | undefined
  public session: ClientSession | undefined

  constructor(
    connectionString: string,
    public databaseName: string
  ) {
    const options: MongoClientOptions = {
      writeConcern: { w: 'majority' },
      readConcern: { level: 'majority' }
    }

    this.client = new MongoClient(connectionString, options)
    this.database(databaseName)
  }

  public async open() {
    await this.client.connect()
  }

  public async close() {
    await this.client.close()
  }

  public database(name: string, options?: DbOptions) {
    this._database = this.client.db(name, options)
    return this
  }

  public collection(name: string, options?: CollectionOptions) {
    if (!this._database) {
      throw new Error('Database not found')
    }

    this._collection = this._database.collection(name, options)
    return this
  }

  public async listCollections(): Promise<{ name: string }[]> {
    if (!this._database) {
      throw new Error('Database not found')
    }

    return await this._database.listCollections().toArray()
  }

  public async createIndex(name: string, spec: IndexSpecification, options: CreateIndexesOptions): Promise<void> {
    if (!this._database) {
      throw new Error('Database not found')
    }

    await this._database.createIndex(name, spec, options)
  }

  public async updateSchema(name: string, schema: unknown): Promise<void> {
    if (!this._database) {
      throw new Error('Database not found')
    }

    await this._database.command({
      collMod: name,
      validator: {
        $jsonSchema: schema
      }
    })
  }

  public async createCollection(name: string, options: any): Promise<void> {
    if (!this._database) {
      throw new Error('Database not found')
    }

    await this._database.createCollection(name, options)
  }

  public async dropCollection(name: string, options: any): Promise<void> {
    if (!this._database) {
      throw new Error('Database not found')
    }

    await this._database.dropCollection(name, options)
  }

  public startSession() {
    this.session = this.client.startSession()
    return this.session
  }

  public async endSession() {
    await this.session?.endSession()
  }

  public startTransaction() {
    this.session?.startTransaction()
  }

  public async commitTransaction() {
    await this.session?.commitTransaction()
  }

  public async abortTransaction() {
    await this.session?.abortTransaction()
  }

  public async command(command: IDocument, options?: unknown): Promise<IDocument> {
    if (!this._database) {
      throw new Error('Database not found')
    }
    const commandOptions = options as RunCommandOptions
    return await this._database.command(command, commandOptions)
  }

  public async create(document: IDocument, options?: unknown): Promise<ICreateOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const createOptions = options as InsertOneOptions
    const buildPostData = MongoDBHelper.buildPostData(document)

    const response = await this._collection.insertOne(MongoDBHelper.stringToObjectId(buildPostData), createOptions)

    return {
      inserted_id: response.insertedId.toString()
    }
  }

  public async createMany(documents: IDocument[], options?: unknown): Promise<ICreateManyOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const createManyOptions = options as BulkWriteOptions
    const buildPostManyData = MongoDBHelper.buildPostManyData(documents)

    const response = await this._collection.insertMany(MongoDBHelper.stringToObjectId(buildPostManyData), createManyOptions)

    // convert array of object to array of string
    const insertedIds: string[] = []
    Object.values(response.insertedIds).forEach((val) => {
      insertedIds.push(val.toString())
    })

    return {
      inserted_ids: insertedIds,
      inserted_count: response.insertedCount
    }
  }

  public async retrieveAll(query: IQuery, options?: any): Promise<IRetrieveAllOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }
    const retrieveOptions = options as FindOptions

    const cursor = this._collection
      .find(MongoDBHelper.stringToObjectId(query.filter ?? {}), retrieveOptions)
      .limit(Querystring.limit(query.page_size))
      .skip(Querystring.skip(Querystring.page(query.page), Querystring.limit(query.page_size)))

    const sort = Querystring.sort(query.sort ?? '')
    if (!isEmpty(sort)) {
      cursor.sort(sort)
    }
    const fields = Querystring.fields(query.fields ?? '', query.exclude_fields ?? [])
    if (!isEmpty(fields)) {
      cursor.project(fields)
    }
    const result = await cursor.toArray()

    const totalDocument = await this._collection.countDocuments(query.filter ?? {}, retrieveOptions)

    return {
      data: MongoDBHelper.objectIdToString(result) as unknown[] as IRetrieveOutput[],
      pagination: {
        page: Querystring.page(query.page),
        page_count: Math.ceil(totalDocument / Querystring.limit(query.page_size)),
        page_size: Querystring.limit(query.page_size),
        total_document: totalDocument
      }
    }
  }

  public async retrieve(_id: string, options?: any): Promise<IRetrieveOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const retrieveOptions = options as FindOptions

    const result = await this._collection.findOne(
      {
        _id: new ObjectId(_id)
      },
      retrieveOptions
    )

    return MongoDBHelper.objectIdToString(result)
  }

  public async update(_id: string, document: IDocument, options?: any): Promise<IUpdateOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const updateOptions = options as UpdateOptions
    const buildPatchData = MongoDBHelper.buildPatchData(document)

    const result = await this._collection.updateOne(
      { _id: new ObjectId(_id) },
      MongoDBHelper.stringToObjectId(buildPatchData),
      updateOptions
    )

    return {
      modified_count: result.modifiedCount,
      matched_count: result.matchedCount
    }
  }

  public async updateMany(filter: IDocument, document: IDocument, options?: any): Promise<IUpdateManyOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const updateManyOptions = options as UpdateOptions
    const buildPatchData = MongoDBHelper.buildPatchData(document)

    const result = await this._collection.updateMany(
      MongoDBHelper.stringToObjectId(filter),
      MongoDBHelper.stringToObjectId(buildPatchData),
      updateManyOptions
    )

    return {
      matched_count: result.matchedCount,
      modified_count: result.modifiedCount
    }
  }

  public async delete(_id: string, options?: any): Promise<IDeleteOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const deleteOptions = options as DeleteOptions

    const result = await this._collection.deleteOne(
      {
        _id: new ObjectId(_id)
      },
      deleteOptions
    )

    return { deleted_count: result.deletedCount }
  }

  public async deleteMany(_ids: string[], options?: any): Promise<IDeleteManyOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const deleteOptions = options as DeleteOptions

    const result = await this._collection.deleteMany(
      {
        _id: {
          $in: MongoDBHelper.stringToObjectId(_ids)
        }
      },
      deleteOptions
    )

    return { deleted_count: result.deletedCount }
  }

  public async deleteAll(options?: any): Promise<IDeleteManyOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const deleteOptions = options as DeleteOptions

    const result = await this._collection.deleteMany({}, deleteOptions)

    return { deleted_count: result.deletedCount }
  }

  public async aggregate(pipeline: IPipeline[], query?: IQuery, options?: any): Promise<IAggregateOutput> {
    if (!this._collection) {
      throw new Error('Collection not found')
    }

    const aggregateOptions = options as AggregateOptions
    const convertedPipeline = MongoDBHelper.stringToObjectId(pipeline)

    const sort = Querystring.sort(query?.sort ?? '')
    if (!isEmpty(sort)) {
      convertedPipeline.push({ $sort: Querystring.sort(query?.sort ?? '') })
    }

    const fields = Querystring.fields(query?.fields ?? '', query?.exclude_fields ?? [])
    if (!isEmpty(fields)) {
      convertedPipeline.push({ $project: Querystring.fields(query?.fields ?? '', query?.exclude_fields ?? []) })
    }
    const cursor = this._collection.aggregate(
      [
        ...convertedPipeline,
        {
          $facet: {
            paginated_result: [
              { $skip: (Querystring.page(query?.page) - 1) * Querystring.limit(query?.page_size) },
              { $limit: Querystring.limit(query?.page_size) }
            ],
            total_document: [
              {
                $count: 'total_document'
              }
            ]
          }
        }
      ],
      aggregateOptions
    )

    const result = await cursor.toArray()

    const totalDocument = result[0]?.total_document[0]?.total_document ?? 0

    return {
      data: MongoDBHelper.objectIdToString(result[0].paginated_result),
      pagination: {
        page: Querystring.page(query?.page),
        page_count: totalDocument ? Math.ceil(totalDocument / Querystring.limit(query?.page_size)) : 0,
        page_size: Querystring.limit(query?.page_size),
        total_document: totalDocument ?? 0
      }
    }
  }
}
