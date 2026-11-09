import { type AggregateOptions, type CreateIndexesOptions, type Db, type Document, type IndexSpecification } from 'mongodb';

import { type IPagination, MongoQueryBuilder } from '../../index';

/**
 * Represents the result of a paginated MongoDB query.
 *
 * @typeParam T - The document structure returned by the query.
 */
interface IRetrievePaginated<T> {
  /** The documents retrieved for the current page. */
  data: T[];

  /** Pagination metadata, including page count and total documents. */
  pagination: IPagination;
}

/**
 * Options for retrieving paginated MongoDB documents.
 */
export interface IRetrievePaginatedOptions {
  /** The page number to retrieve. */
  page?: number;

  /** The maximum number of documents per page. */
  pageSize?: number;

  /**
   * Sort expression using field names.
   * Prefix a field with `-` for descending order.
   *
   * @example
   * '-createdAt'
   * 'name,-createdAt'
   */
  sort?: string;

  /**
   * Additional aggregation stages appended after pagination.
   *
   * Useful for operations such as `$lookup` or `$project`
   * that should execute after `$skip` and `$limit`.
   */
  afterPagination?: Document[];

  /** Additional MongoDB aggregation options. */
  aggregateOptions?: AggregateOptions;
}

/**
 * Provides methods for managing MongoDB collections, indexes,
 * schema validation, and document retrieval.
 *
 * Supports standard queries and aggregation-based pagination.
 *
 * @see https://www.mongodb.com/docs/drivers/node/current/fundamentals/indexes/
 * @see https://www.mongodb.com/docs/manual/reference/collation/
 * @see https://www.mongodb.com/docs/manual/core/index-sparse/
 * @see https://www.mongodb.com/docs/manual/core/index-partial/
 */
export class MongoService {
  private db: Db;

  /**
   * Creates a MongoDB service instance.
   *
   * @param db - The MongoDB database instance used by this service.
   */
  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Creates a unique index on the specified collection.
   *
   * Uses case-insensitive collation to prevent duplicate values
   * that differ only in letter casing.
   *
   * @param collection - The name of the collection to index.
   * @param spec - The index specification containing the fields and sort order.
   *
   * @example
   * // Create a unique index on the name field.
   * await mongoDBService.createUnique('users', {
   *   name: 1
   * })
   *
   * @example
   * // Create a compound unique index on firstName and lastName.
   * await mongoDBService.createUnique('users', {
   *   firstName: 1,
   *   lastName: 1
   * })
   */
  public async createUnique(
    collection: string,
    spec: IndexSpecification,
  ): Promise<void> {
    await this.db.createIndex(collection, spec, {
      unique: true,
      collation: {
        locale: 'en',
        strength: 2,
      },
    });
  }

  /**
   * Creates a unique sparse index on the specified collection.
   *
   * Documents that do not contain the indexed field are excluded
   * from the index. Documents containing the indexed field must
   * have unique values.
   *
   * Uses case-insensitive collation.
   *
   * @param collection - The name of the collection to index.
   * @param spec - The index specification containing the fields and sort order.
   *
   * @example
   * // Allow multiple documents without an email field,
   * // but enforce uniqueness when email is present.
   * await mongoDBService.createUniqueIfNotNull('users', {
   *   email: 1
   * })
   */
  public async createUniqueIfNotNull(
    collection: string,
    spec: IndexSpecification,
  ): Promise<void> {
    await this.db.createIndex(collection, spec, {
      unique: true,
      sparse: true,
      collation: {
        locale: 'en',
        strength: 2,
      },
    });
  }

  /**
   * Creates an index on the specified collection.
   *
   * Supports standard MongoDB index options, including unique,
   * sparse, partialFilterExpression, and expireAfterSeconds.
   *
   * @param collection - The name of the collection to index.
   * @param spec - The index specification containing the fields and sort order.
   * @param options - Optional MongoDB index creation options.
   *
   * @example
   * // Create a standard index on the createdAt field.
   * await mongoDBService.createIndex('users', {
   *   createdAt: -1
   * })
   *
   * @example
   * // Create a partial index for active users.
   * await mongoDBService.createIndex(
   *   'users',
   *   { email: 1 },
   *   {
   *     partialFilterExpression: {
   *       status: 'active'
   *     }
   *   }
   * )
   */
  public async createIndex(
    collection: string,
    spec: IndexSpecification,
    options?: CreateIndexesOptions,
  ): Promise<void> {
    await this.db.createIndex(collection, spec, options);
  }

  /**
   * Checks whether a collection exists in the current database.
   *
   * @param name - The name of the collection to check.
   * @returns True if the collection exists; otherwise, false.
   *
   * @example
   * const exists = await mongoDBService.isExists('users')
   */
  public async isExists(name: string): Promise<boolean> {
    const collections = await this.db.listCollections().toArray();

    return collections.some((collection) => collection.name === name);
  }

  /**
   * Updates the JSON Schema validator of an existing MongoDB collection.
   *
   * Uses the `collMod` command to modify the collection's validation rules
   * without dropping or recreating the collection.
   *
   * @param name - Name of the collection to update.
   * @param schema - JSON Schema definition used to validate collection documents.
   * @throws {Error} If the database connection is not available.
   */
  public async updateSchema(name: string, schema: unknown): Promise<void> {
    if (!this.db) {
      throw new Error('Database not found');
    }

    await this.db.command({
      collMod: name,
      validator: {
        $jsonSchema: schema,
      },
    });
  }

  /**
   * Retrieves paginated documents from a MongoDB collection using an aggregation pipeline.
   *
   * Executes the aggregation pipeline twice:
   * - The count pipeline calculates the total number of documents matching the pipeline.
   * - The data pipeline retrieves documents for the requested page, applying sorting,
   *   skipping, and limiting when applicable.
   *
   * @typeParam T - The expected document structure of the retrieved data.
   *
   * @param collection - The name of the MongoDB collection.
   * @param pipeline - The aggregation pipeline used to filter or transform documents.
   * @param options - Pagination, sorting, and aggregation options.
   *
   * @returns The retrieved documents and pagination metadata.
   *
   * @throws RangeError If the page or page size is invalid.
   *
   * @example
   * // Retrieve the first page of active users, sorted by creation date.
   * const result = await mongoDBService.retrievePaginated<IUser>(
   *   'users',
   *   [
   *     {
   *       $match: {
   *         status: 'active',
   *       },
   *     },
   *   ],
   *   {
   *     page: 1,
   *     pageSize: 10,
   *     sort: '-createdAt',
   *   },
   * );
   *
   * @example
   * // Retrieve users with their associated profiles.
   * const result = await mongoDBService.retrievePaginated<IUser>(
   *   'users',
   *   [
   *     {
   *       $lookup: {
   *         from: 'profiles',
   *         localField: '_id',
   *         foreignField: 'user_id',
   *         as: 'profile',
   *       },
   *     },
   *   ],
   *   {
   *     page: 2,
   *     pageSize: 20,
   *   },
   * );
   */
  public async retrievePaginated<T extends Document>(
    collection: string,
    pipeline: Document[] = [],
    options: IRetrievePaginatedOptions = {
      page: 1,
      pageSize: 10,
    },
  ): Promise<IRetrievePaginated<T>> {
    const page =  MongoQueryBuilder.parsePage(options.page);
    const pageSize =  MongoQueryBuilder.parsePageSize(options.pageSize);
    const sort = options?.sort ?  MongoQueryBuilder.parseSort(options?.sort) : {};
    const skip =  MongoQueryBuilder.calculateSkip(page, pageSize);

    const countPipeline = [...pipeline, { $count: 'totalDocuments' }];

    const dataPipeline = [
      ...pipeline,
      ...(Object.keys(sort).length > 0 ? [{ $sort: sort }] : []),
      { $skip: skip },
      { $limit: pageSize },
      ...options?.afterPagination ?? [],
    ];

    const [countResult, data] = await Promise.all([
      this.db
        .collection(collection)
        .aggregate<{ totalDocuments: number }>(
          countPipeline,
          options.aggregateOptions,
        )
        .toArray(),

      this.db
        .collection(collection)
        .aggregate<T>(
          dataPipeline,
          options.aggregateOptions,
        )
        .toArray(),
    ]);

    const totalDocuments = countResult[0]?.totalDocuments ?? 0;

    return {
      data,
      pagination: {
        page,
        page_size: pageSize,
        page_count: Math.ceil(totalDocuments / pageSize),
        total_document: totalDocuments,
      },
    };
  }

  /**
   * Retrieves the first document matching an aggregation pipeline.
   *
   * Executes the provided aggregation pipeline and returns the first
   * matching document. Returns `null` if no document is found.
   *
   * @typeParam T - The expected document structure of the retrieved data.
   *
   * @param collection - The name of the MongoDB collection.
   * @param pipeline - The aggregation pipeline used to filter or transform documents.
   * @param options - MongoDB aggregation options.
   *
   * @returns The first matching document, or `null` if no document is found.
   *
   * @example
   * // Retrieve an active user by email.
   * const user = await mongoDBService.retrieveOne<IUser>(
   *   'users',
   *   [
   *     {
   *       $match: {
   *         email: 'john@example.com',
   *         status: 'active',
   *       },
   *     },
   *   ],
   *   {},
   * );
   *
   * @example
   * // Retrieve a user with their associated profile.
   * const user = await mongoDBService.retrieveOne<IUser>(
   *   'users',
   *   [
   *     {
   *       $match: {
   *         _id: userId,
   *       },
   *     },
   *     {
   *       $lookup: {
   *         from: 'profiles',
   *         localField: '_id',
   *         foreignField: 'user_id',
   *         as: 'profile',
   *       },
   *     },
   *   ],
   *   {},
   * );
   */
  public async retrieveOne<T extends Document>(
    collection: string,
    pipeline: Document[] = [],
    options: AggregateOptions,
  ): Promise<T | null> {
    const data = await this.db
      .collection(collection)
      .aggregate<T>(pipeline, options)
      .toArray();

    return data && data.length ? data[0] : null;
  }
}
