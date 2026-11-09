import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { Db, Document, MongoClient } from 'mongodb';

import { MongoService } from './mongo.service';
import { MongoTestService } from './mongo-test.service';

type IUserDocument = Document & {
  email: string
  username?: string
  name?: string
  status?: string
  createdAt?: Date
}

const uri = process.env.DATABASE_URI;

if (!uri) {
  throw new Error('DATABASE_URI must be configured for MongoDB integration tests');
}

const databaseName = `test_${crypto.randomUUID().replaceAll('-', '').slice(0, 32)}`;

const database = new MongoTestService(uri, databaseName);
const client = new MongoClient(uri);
const db: Db = client.db(databaseName);

const mongoService = new MongoService(db);

describe('MongoService integration', () => {
  beforeAll(async () => {
    await database.open();
    await client.connect();
  });

  afterAll(async () => {
    try {
      await database.dropDatabase();
    } finally {
      await Promise.all([
        database.close(),
        client.close(),
      ]);
    }
  });

  beforeEach(async () => {
    await database.dropAllCollections();
  });

  describe('createUnique', () => {
    it('creates a case-insensitive unique index', async () => {
      await db.createCollection('users');

      await mongoService.createUnique('users', {
        email: 1,
      });

      const indexes = await db.collection('users').indexes();
      const index = indexes.find((item) => item.name === 'email_1');

      expect(index).toMatchObject({
        key: { email: 1 },
        unique: true,
        collation: {
          locale: 'en',
          strength: 2,
        },
      });

      await db.collection('users').insertOne({
        email: 'john@example.com',
      });

      const error = await db.collection('users').insertOne({
        email: 'JOHN@example.com',
      }).catch((error: unknown) => error);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createUniqueIfNotNull', () => {
    it('creates a case-insensitive sparse unique index', async () => {
      await db.createCollection('users');

      await mongoService.createUniqueIfNotNull('users', {
        username: 1,
      });

      const indexes = await db.collection('users').indexes();
      const index = indexes.find((item) => item.name === 'username_1');

      expect(index).toMatchObject({
        key: { username: 1 },
        unique: true,
        sparse: true,
        collation: {
          locale: 'en',
          strength: 2,
        },
      });

      const collection = db.collection('users');

      await collection.insertMany([
        { email: 'john1@example.com' },
        { email: 'john2@example.com' },
      ]);

      await collection.insertOne({
        email: 'john3@example.com',
        username: 'john',
      });

      const error = await collection.insertOne({
        email: 'john4@example.com',
        username: 'JOHN',
      }).catch((error: unknown) => error);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('createIndex', () => {
    it('creates an index with the provided options', async () => {
      await db.createCollection('users');

      await mongoService.createIndex(
        'users',
        { status: 1 },
        { name: 'status_index' },
      );

      const indexes = await db.collection('users').indexes();
      const index = indexes.find((item) => item.name === 'status_index');

      expect(index).toMatchObject({
        name: 'status_index',
        key: { status: 1 },
      });
    });
  });

  describe('isExists', () => {
    it('returns false when the collection does not exist', async () => {
      expect(await mongoService.isExists('users')).toBe(false);
    });

    it('returns true when the collection exists', async () => {
      await db.createCollection('users');

      expect(await mongoService.isExists('users')).toBe(true);
    });
  });

  describe('updateSchema', () => {
    it('updates the collection JSON Schema validator', async () => {
      await db.createCollection('users');

      await mongoService.updateSchema('users', {
        bsonType: 'object',
        required: ['email'],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          email: {
            bsonType: 'string',
          },
        },
      });

      const collection = db.collection('users');

      const result = await collection.insertOne({
        email: 'john@example.com',
      });

      expect(result).toBeDefined();

      const error = await collection.insertOne({
        email: 123,
      }).catch((error: unknown) => error);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('retrievePaginated', () => {
    it('retrieves paginated documents with sorting and additional stages', async () => {
      const collection = db.collection<IUserDocument>('users');

      await collection.insertMany([
        {
          email: 'user1@example.com',
          status: 'active',
          createdAt: new Date('2026-01-01'),
        },
        {
          email: 'user2@example.com',
          status: 'active',
          createdAt: new Date('2026-01-02'),
        },
        {
          email: 'user3@example.com',
          status: 'active',
          createdAt: new Date('2026-01-03'),
        },
        {
          email: 'user4@example.com',
          status: 'active',
          createdAt: new Date('2026-01-04'),
        },
        {
          email: 'user5@example.com',
          status: 'active',
          createdAt: new Date('2026-01-05'),
        },
        {
          email: 'inactive@example.com',
          status: 'inactive',
          createdAt: new Date('2026-01-06'),
        },
      ]);

      const result = await mongoService.retrievePaginated<IUserDocument>(
        'users',
        [
          {
            $match: {
              status: 'active',
            },
          },
        ],
        {
          page: 2,
          pageSize: 2,
          sort: '-createdAt',
          afterPagination: [
            {
              $project: {
                _id: 0,
                email: 1,
              },
            },
          ],
        },
      );

      expect(result).toEqual({
        data: [
          { email: 'user3@example.com' },
          { email: 'user2@example.com' },
        ],
        pagination: {
          page: 2,
          page_size: 2,
          page_count: 3,
          total_document: 5,
        },
      });
    });

    it('returns empty data when no documents match', async () => {
      await db.createCollection('users');

      const result = await mongoService.retrievePaginated<IUserDocument>(
        'users',
        [
          {
            $match: {
              status: 'active',
            },
          },
        ],
        {
          page: 1,
          pageSize: 10,
        },
      );

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          page_size: 10,
          page_count: 0,
          total_document: 0,
        },
      });
    });
  });

  describe('retrieveOne', () => {
    it('retrieves the first matching document', async () => {
      const collection = db.collection<IUserDocument>('users');

      await collection.insertMany([
        { email: 'john@example.com' },
        { email: 'jane@example.com' },
      ]);

      const result = await mongoService.retrieveOne<IUserDocument>(
        'users',
        [
          {
            $match: {
              email: 'john@example.com',
            },
          },
        ],
        {},
      );

      expect(result).toMatchObject({
        email: 'john@example.com',
      });
    });

    it('returns null when no document matches', async () => {
      await db.createCollection('users');

      const result = await mongoService.retrieveOne<IUserDocument>(
        'users',
        [
          {
            $match: {
              email: 'unknown@example.com',
            },
          },
        ],
        {},
      );

      expect(result).toBeNull();
    });
  });
});
