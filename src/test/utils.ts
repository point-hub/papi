import { fileSearch } from '@point-hub/express-utils'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

import type { IDatabase, IQuery } from '../index'
import { BaseMongoDBConnection, BaseMongoDBHelper, BaseMongoDBQuerystring } from '../index'

const mongodbServer = await MongoMemoryReplSet.create({ replSet: { count: 3 } })
const uri = mongodbServer.getUri()

export class DatabaseTestUtil {
  public static dbConnection: IDatabase

  static async open() {
    DatabaseTestUtil.dbConnection = new BaseMongoDBConnection(uri, 'api_test')
    await DatabaseTestUtil.dbConnection.open()
  }

  static async close() {
    await DatabaseTestUtil.dbConnection.close()
    await mongodbServer.stop()
  }

  static async createCollections() {
    const helper = new BaseMongoDBHelper(DatabaseTestUtil.dbConnection)
    const object = await fileSearch('schema.ts', './src/modules', { maxDeep: 2, regExp: true })
    for (const property in object) {
      const path = `../modules/${object[property].path.replace('\\', '/')}`
      const { schema } = await import(path)
      for (const iterator of schema) {
        if (!(await helper.isExists(iterator.collection))) {
          console.info(`[schema] ${iterator.collection} - create collection`)
          await DatabaseTestUtil.dbConnection.createCollection(iterator.collection)
        }

        console.info(`[schema] ${iterator.collection} - update schema`)
        await DatabaseTestUtil.dbConnection.updateSchema(iterator.collection, iterator.schema)

        for (const unique of iterator.unique) {
          if (unique.length) {
            console.info(`[schema] ${iterator.collection} - create unique attribute "name"`)
            await helper.createUnique(iterator.collection, BaseMongoDBQuerystring.convertArrayToObject(unique, -1))
          }
        }

        for (const unique of iterator.uniqueIfExists) {
          if (unique.length) {
            console.info(`[schema] ${iterator.collection} - create unique attribute "name"`)
            await helper.createUniqueIfNotNull(
              iterator.collection,
              BaseMongoDBQuerystring.convertArrayToObject(unique, -1),
            )
          }
        }
      }
    }
  }

  static async reset() {
    const collections = await DatabaseTestUtil.dbConnection.listCollections()
    for (const collection of collections) {
      await DatabaseTestUtil.dbConnection.collection(collection.name).deleteAll()
    }
  }

  static async retrieve(collection: string, _id: string) {
    return await DatabaseTestUtil.dbConnection.collection(collection).retrieve(_id)
  }

  static async retrieveAll(collection: string, query: IQuery = {}) {
    return await DatabaseTestUtil.dbConnection.collection(collection).retrieveAll(query)
  }
}
