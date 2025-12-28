import type { IDatabase, IQuery } from '../index'
import { BaseMongoDBConnection, BaseMongoDBHelper, BaseMongoDBQuerystring } from '../index'
import { ISchema } from '../index'

export class DatabaseTestUtil {
  public static dbConnection: IDatabase

  static async open(uri: string, name = 'api_test') {
    DatabaseTestUtil.dbConnection = new BaseMongoDBConnection(uri, name)
    await DatabaseTestUtil.dbConnection.open()
  }

  static async close() {
    await DatabaseTestUtil.dbConnection.close()
  }

  static async createCollections(listSchema: ISchema[][]) {
    const helper = new BaseMongoDBHelper(DatabaseTestUtil.dbConnection)

    for (let i = 0; i < listSchema.length; i++) {
      for (let j = 0; j < listSchema[i].length; j++) {
        if (!(await helper.isExists(listSchema[i][j].collection))) {
          console.info(`[schema] ${listSchema[i][j].collection} - create collection`)
          await DatabaseTestUtil.dbConnection.createCollection(listSchema[i][j].collection)
        }

        console.info(`[schema] ${listSchema[i][j].collection} - update schema`)
        await DatabaseTestUtil.dbConnection.updateSchema(listSchema[i][j].collection, listSchema[i][j].schema)

        for (const unique of listSchema[i][j].unique) {
          if (unique.length) {
            console.info(`[schema] ${listSchema[i][j].collection} - create unique attribute "${unique}"`)
            await helper.createUnique(
              listSchema[i][j].collection,
              BaseMongoDBQuerystring.convertFieldObject(unique, -1)
            )
          }
        }

        for (const unique of listSchema[i][j].uniqueIfExists) {
          if (unique.length) {
            console.info(`[schema] ${listSchema[i][j].collection} - create unique attribute "${unique}"`)
            await helper.createUniqueIfNotNull(
              listSchema[i][j].collection,
              BaseMongoDBQuerystring.convertFieldObject(unique, -1)
            )
          }
        }
      }
    }
  }

  static async dropAllCollections() {
    const collections = await DatabaseTestUtil.dbConnection.listCollections()

    for (const collection of collections) {
      console.info(`[drop] ${collection.name}`)
      await DatabaseTestUtil.dbConnection.dropCollection(collection.name)
    }
  }

  static async reset() {
    const collections = await DatabaseTestUtil.dbConnection.listCollections()
    for (const collection of collections) {
      await DatabaseTestUtil.dbConnection.collection(collection.name).deleteAll()
    }
  }

  static async retrieve<TOutput extends object>(collection: string, _id: string) {
    return await DatabaseTestUtil.dbConnection.collection(collection).retrieve<TOutput>(_id)
  }

  static async retrieveAll<TData>(collection: string, query: IQuery = {}) {
    return await DatabaseTestUtil.dbConnection.collection(collection).retrieveAll<TData>(query)
  }
}
