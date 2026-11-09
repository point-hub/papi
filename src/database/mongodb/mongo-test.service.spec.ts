import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import type { ISchema } from '../../interfaces/types';
import { MongoTestService } from './mongo-test.service';

const uri = process.env.DATABASE_URI ?? 'mongodb://localhost:27017';
const databaseName = `test_${crypto.randomUUID().replaceAll('-', '').slice(0, 32)}`;
const database = new MongoTestService(uri, databaseName);

const schemas: ISchema[][] = [
  [
    {
      collection: 'users',
      schema: {
        bsonType: 'object',
        required: ['email'],
        properties: {
          email: {
            bsonType: 'string',
          },
          username: {
            bsonType: 'string',
          },
        },
      },
      unique: [['email']],
      uniqueIfExists: [['username']],
      indexes: [],
    },
  ],
];

beforeAll(async () => {
  await database.open();
});

afterAll(async () => {
  try {
    await database.dropDatabase();
  } finally {
    await database.close();
  }
});

beforeEach(async () => {
  await database.dropAllCollections();
});

describe('MongoTestService', () => {
  describe('open and close', () => {
    it('connects to MongoDB', async () => {
      // The connection is established in beforeAll.
      expect(await database.reset()).toBeUndefined();
    });
  });

  describe('createCollections', () => {
    it('creates collections and applies schema indexes', async () => {
      await database.createCollections(schemas);

      const collections = await database['db'].listCollections().toArray();

      expect(collections.map((collection) => collection.name)).toContain('users');

      const indexes = await database['db']
        .collection('users')
        .listIndexes()
        .toArray();

      expect(indexes.some((index) => index.key.email === -1)).toBe(true);
      expect(indexes.some((index) => index.key.username === -1)).toBe(true);
    });

    it('does not recreate existing collections', async () => {
      await database.createCollections(schemas);
      await database.createCollections(schemas);

      const collections = await database['db'].listCollections().toArray();

      expect(collections.filter((collection) => collection.name === 'users')).toHaveLength(1);
    });
  });

  describe('dropDatabase', () => {
    it('drops the database', async () => {
      await database.createCollections(schemas);
      await database.dropDatabase();

      const collections = await database['db'].listCollections().toArray();

      expect(collections).toHaveLength(0);
    });
  });

  describe('dropAllCollections', () => {
    it('drops all collections but keeps the connection usable', async () => {
      await database.createCollections(schemas);
      await database.dropAllCollections();

      const collections = await database['db'].listCollections().toArray();

      expect(collections).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('deletes documents but preserves collections and indexes', async () => {
      await database.createCollections(schemas);

      await database['db'].collection('users').insertOne({
        email: 'john@example.com',
        username: 'john',
      });

      await database.reset();

      const collection = database['db'].collection('users');

      expect(await collection.countDocuments()).toBe(0);

      const indexes = await collection.listIndexes().toArray();

      expect(indexes.some((index) => index.key.email === -1)).toBe(true);
      expect(indexes.some((index) => index.key.username === -1)).toBe(true);
    });
  });
});
