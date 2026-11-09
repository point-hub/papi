import { Db, MongoClient, MongoClientOptions } from 'mongodb';

import type { ISchema } from '../../interfaces/types';
import { MongoService } from './mongo.service';
import MongoQueryBuilder from './mongo-query-builder.utils';

/**
 * Provides utilities for managing a MongoDB database during tests.
 *
 * Handles database connections, collection creation, schema validation,
 * index creation, and database cleanup.
 *
 * @example
 * ```ts
 * const database = new MongoTestService(process.env.MONGO_URI!, 'api_test')
 *
 * await database.open()
 *
 * try {
 *   await database.createCollections(listSchema)
 *   // Run tests
 * } finally {
 *   await database.close()
 * }
 * ```
 */
export class MongoTestService {
  private mongoClient: MongoClient;
  private mongoService: MongoService;
  private db: Db;

  /**
   * Creates a MongoDB test service.
   *
   * Initializes the MongoDB client and database reference.
   * The connection is not established until {@link open} is called.
   *
   * @param uri - MongoDB connection URI.
   * @param name - Name of the test database.
   */
  constructor(uri: string, name: string) {
    const options: MongoClientOptions = {
      writeConcern: { w: 'majority' },
      readConcern: { level: 'majority' },
    };

    this.mongoClient = new MongoClient(uri, options);
    this.db = this.mongoClient.db(name);
    this.mongoService = new MongoService(this.db);
  }

  /**
   * Provides access to the MongoDB client.
   *
   * Use this to access native MongoDB client functionality,
   * such as creating sessions and managing transactions.
   *
   * @example
   * ```ts
   * const session = mongoTestService.client.startSession()
   * ```
   */
  public get client(): MongoClient {
    return this.mongoClient;
  }

  /**
   * Provides access to the MongoDB database.
   *
   * Use this to perform direct database operations in tests,
   * such as inserting fixtures and querying documents.
   *
   * @example
   * ```ts
   * await mongoTestService.database.collection('users').insertOne({
   *   email: 'john@example.com'
   * })
   * ```
   */
  public get database(): Db {
    return this.db;
  }

  /**
   * Provides access to the MongoDB service.
   *
   * Use this to perform MongoDB operations through the service abstraction
   * instead of accessing the database directly.
   *
   * @example
   * ```ts
   * await mongoTestService.service.createUnique('users', { email: 1 })
   * ```
   */
  public get service(): MongoService {
    return this.mongoService;
  }

  /**
   * Establishes a connection to MongoDB.
   *
   * @returns A promise that resolves when the connection is established.
   */
  public async open(): Promise<void> {
    await this.mongoClient.connect();
  }

  /**
   * Closes the MongoDB connection.
   *
   * @returns A promise that resolves when the connection is closed.
   */
  public async close(): Promise<void> {
    await this.mongoClient.close();
  }

  /**
   * Creates collections defined in the provided schema configuration.
   *
   * For each collection, this method:
   * - Creates the collection if it does not exist.
   * - Applies the collection's JSON schema validation.
   * - Creates unique indexes.
   * - Creates unique sparse indexes for fields that may be missing or null.
   *
   * Existing collections are not dropped or recreated.
   *
   * @param listSchema - Grouped collection schema configurations.
   * @returns A promise that resolves when all collections and indexes are configured.
   *
   * @example
   * ```ts
   * await database.createCollections(listSchema)
   * ```
   */
  public async createCollections(listSchema: ISchema[][]): Promise<void> {
    for (let i = 0; i < listSchema.length; i++) {
      for (let j = 0; j < listSchema[i].length; j++) {
        if (!(await this.mongoService.isExists(listSchema[i][j].collection))) {
          console.info(`[schema] ${listSchema[i][j].collection} - create collection`);
          await this.db.createCollection(listSchema[i][j].collection);
        }

        console.info(`[schema] ${listSchema[i][j].collection} - update schema`);
        await this.mongoService.updateSchema(listSchema[i][j].collection, listSchema[i][j].schema);

        for (const unique of listSchema[i][j].unique) {
          if (unique.length) {
            console.info(`[schema] ${listSchema[i][j].collection} - create unique attribute "${unique}"`);
            await this.mongoService.createUnique(
              listSchema[i][j].collection,
              MongoQueryBuilder.createProjection(unique, -1),
            );
          }
        }

        for (const unique of listSchema[i][j].uniqueIfExists) {
          if (unique.length) {
            console.info(`[schema] ${listSchema[i][j].collection} - create unique attribute "${unique}"`);
            await this.mongoService.createUniqueIfNotNull(
              listSchema[i][j].collection,
              MongoQueryBuilder.createProjection(unique, -1),
            );
          }
        }
      }
    }
  }

  /**
   * Drops the entire test database, including all its collections and indexes.
   *
   * Use this when a complete database cleanup is required.
   *
   * @returns A promise that resolves when the database has been dropped.
   *
   * @example
   * ```ts
   * await database.dropDatabase()
   * ```
   */
  public async dropDatabase(): Promise<void> {
    await this.db.dropDatabase();
  }

  /**
   * Drops every collection in the test database.
   *
   * Unlike {@link dropDatabase}, this keeps the database itself.
   *
   * @returns A promise that resolves when all collections have been dropped.
   *
   * @example
   * ```ts
   * await database.dropAllCollections()
   * ```
   */
  public async dropAllCollections(): Promise<void> {
    const collections = await this.db.listCollections().toArray();

    for (const collection of collections) {
      console.info(`[drop] ${collection.name}`);
      await this.db.dropCollection(collection.name);
    }
  }

  /**
   * Removes all documents from every collection in the test database.
   *
   * Collections, indexes, and schema validation rules are preserved.
   *
   * @returns A promise that resolves when all collections have been cleared.
   *
   * @example
   * ```ts
   * // Clear test data before each test.
   * await database.reset()
   * ```
   */
  public async reset(): Promise<void> {
    const collections = await this.db.listCollections().toArray();

    for (const collection of collections) {
      await this.db.collection(collection.name).deleteMany({});
    }
  }
}
