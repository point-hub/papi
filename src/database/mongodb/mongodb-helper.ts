import { isType } from '@point-hub/express-utils'
import { isValid } from 'date-fns'
import { CreateIndexesOptions, IndexSpecification, ObjectId } from 'mongodb'

import { IDatabase } from '../../index'

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
        strength: 2
      }
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
        strength: 2
      }
    })
  }

  public async createIndex(
    collection: string,
    spec: IndexSpecification,
    options?: CreateIndexesOptions
  ): Promise<void> {
    await this.db.createIndex(collection, spec, options)
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

  /**
   * Deeply cleans an object by removing properties that are:
   * 1. Undefined
   * 2. Null
   * 3. Empty objects ({})
   * 4. Empty arrays ([])
   * * @param rawInput The input data object.
   * @returns The deeply filtered object, or an empty object if all content was filtered.
   */
  public static buildPostData(rawInput: Record<string, any>): Record<string, any> {

    /**
     * Recursively cleans the object.
     */
    const recursiveFilter = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return undefined // Filter out null and undefined directly
      }

      if (Array.isArray(obj)) {
        // Filter out empty array elements, then filter out the array if it becomes empty
        const cleanedArray = obj.map(recursiveFilter).filter(value => value !== undefined)
        return cleanedArray.length > 0 ? cleanedArray : undefined

      } else if (typeof obj === 'object' && !isValid(obj) && !(obj instanceof ObjectId)) {
        // Handle non-null, non-array, non-date, non-ObjectId objects
        const cleanedObject: Record<string, any> = {}
        let hasContent = false

        for (const key in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, key)) {
            continue
          }

          const value = recursiveFilter(obj[key]) // Recurse

          if (value !== undefined) {
            cleanedObject[key] = value
            hasContent = true
          }
        }

        // Filter out the object if it becomes empty
        return hasContent ? cleanedObject : undefined

      } else {
        // Primitive value, Date, or ObjectId: return as is
        return obj
      }
    }

    // Start cleaning and ensure the result is always an object, even if empty.
    const result = recursiveFilter(rawInput)
    return (typeof result === 'object' && result !== null) ? result : {}
  }

  /**
   * Builds a clean array of documents for a MongoDB insertMany operation.
   * It iterates over the array, applying deep filtering to each document.
   * Documents that become empty after filtering are removed from the array.
   */
  public static buildPostManyData(rawInput: Array<Record<string, any>>): Array<Record<string, any>> {
    if (!Array.isArray(rawInput)) {
      // Handle non-array input robustly, though type checking should prevent this. Returning empty array.
      return []
    }

    // 1. Iterate over the raw input array.
    const cleanedDocuments = rawInput.map(doc => {
      // 2. Apply the single-document cleaning logic (buildPostData) to each document.
      return MongoDBHelper.buildPostData(doc)
    }).filter(cleanedDoc => {
      // 3. Filter out any documents that became completely empty ({}) after cleaning.
      // The deepFilter returns {} for an empty input, so we check if it's non-empty.
      return Object.keys(cleanedDoc).length > 0
    })

    return cleanedDocuments
  }

  /**
   * Builds safe MongoDB $set and $unset operations for a PATCH request.
   * It flattens nested objects into dot notation and handles explicit null values for $unset.
   * Undefined values are ignored.
   */
  public static buildPatchData = (rawInput: Record<string, any>): { $set?: Record<string, any>, $unset?: Record<string, true> } => {
    const setOperations: Record<string, any> = {}
    const unsetOperations: Record<string, true> = {}

    /**
     * Recursively traverses the object and populates $set/$unset operations.
     */
    const flattenAndSeparate = (obj: Record<string, any>, prefix: string = '') => {
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
          continue
        }

        const currentKey = prefix + key
        const value = obj[key]

        if (value === undefined) {
          // Ignore undefined values.
          continue

        } else if (value === null) {
          // Use null to signal field removal via $unset.
          unsetOperations[currentKey] = true

        } else if (
          isType(value, 'object') &&
          value !== null &&
          !Array.isArray(value) &&
          !isType(value, 'date') &&
          !isType(value, 'function') &&
          !(value instanceof ObjectId)
        ) {
          // Recurse into non-null, non-array objects.
          flattenAndSeparate(value, currentKey + '.')

        } else {
          // Primitive value or Array: Add to $set.
          setOperations[currentKey] = value
        }
      }
    }

    // Start processing from the top level
    flattenAndSeparate(rawInput)

    // Assemble and return the final update document
    const updateDoc: { $set?: Record<string, any>, $unset?: Record<string, true> } = {}

    if (Object.keys(setOperations).length > 0) {
      updateDoc.$set = setOperations
    }

    if (Object.keys(unsetOperations).length > 0) {
      updateDoc.$unset = unsetOperations
    }

    return updateDoc
  }
}
