import { isValid } from 'date-fns'
import { ObjectId } from 'mongodb'

/**
 * https://www.mongodb.com/docs/drivers/node/current/fundamentals/indexes/
 * https://www.mongodb.com/docs/manual/reference/collation/
 * https://www.mongodb.com/docs/manual/core/index-sparse/
 * https://www.mongodb.com/docs/manual/core/index-partial/
 */
export class MongoDBHelper {
  private db

  constructor(db: IDatabase) {
    this.db = db
  }

  /**
   * Create unique column
   *
   * @example
   * create unique attribute "name"
   * createUnique(collection, {
   *   name: -1,
   * })
   *
   * @example
   * create unique attribute for multiple column "first_name" and "last_name"
   * createUnique(collection, {
   *   firstName: -1,
   *   lastName: -1,
   * })
   */
  public async createUnique(collection: string, properties: object) {
    await this.db.createIndex(collection, properties, {
      unique: true,
      collation: {
        locale: 'en',
        strength: 2,
      },
    })
  }

  /**
   * Create unique if column is exists
   */
  public async createUniqueIfNotNull(collection: string, properties: object) {
    await this.db.createIndex(collection, properties, {
      unique: true,
      sparse: true,
      collation: {
        locale: 'en',
        strength: 2,
      },
    })
  }

  public async isExists(name: string) {
    const collections = (await this.db.listCollections()) as []
    return collections.some(function (collection: { name: string }) {
      return collection.name === name
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static stringToObjectId(val: any): any {
    if (val == null) return null
    if (Array.isArray(val)) {
      return val.map((item) => {
        return MongoDBHelper.stringToObjectId(item)
      })
    } else if (typeof val === 'object' && !isValid(val)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Object.keys(val).reduce((obj: any, key) => {
        const propVal = MongoDBHelper.stringToObjectId(val[key])
        obj[key] = propVal
        return obj
      }, {})
    } else if (typeof val === 'string' && ObjectId.isValid(val) && val === new ObjectId(val).toString()) {
      return new ObjectId(val)
    }

    return val
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static objectIdToString(val: any): any {
    if (val == null) return null
    if (Array.isArray(val)) {
      return val.map((item) => {
        return MongoDBHelper.objectIdToString(item)
      })
    } else if (typeof val === 'object' && ObjectId.isValid(val)) {
      return val.toString()
    } else if (typeof val === 'object' && !isValid(val)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Object.keys(val).reduce((obj: any, key) => {
        if (ObjectId.isValid(val) || isValid(val)) {
          return val.toString()
        } else {
          const propVal = MongoDBHelper.objectIdToString(val[key])
          obj[key] = propVal
          return obj
        }
      }, {})
    }

    return val
  }
}
